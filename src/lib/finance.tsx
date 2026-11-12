/**
 * Fonte única dos dados financeiros exibidos no app.
 * - Sem Supabase configurado ou sem login: modo demonstração (dados de src/lib/data.ts).
 * - Logado: lê contas e transações reais sincronizadas da Pluggy.
 */
import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { GoalIconKey } from "@/components/icons";
import { mapCategory } from "./categories";
import { detectRecurrences, manualToRecurrences, sameRecurrence, type ManualRecurrence, type Recurrence } from "./recurrences";
import * as demo from "./data";
import type { CategoryKey, Transaction } from "./data";
import { removePhoto, signedUrls, uploadPhoto } from "./photos";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export type ItemRow = {
  id: string;
  connector_name: string;
  connector_image: string | null;
  primary_color: string | null;
  status: string;
  execution_status: string | null;
  error_message: string | null;
  last_synced_at: string | null;
};

export type AccountRow = {
  id: string;
  item_id: string;
  type: "BANK" | "CREDIT";
  subtype: string | null;
  name: string;
  number: string | null;
  balance: number;
  credit_limit: number | null;
  available_credit_limit: number | null;
  balance_due_date: string | null;
  balance_close_date?: string | null;
  minimum_payment?: number | null;
};

export type InvoiceCard = {
  id: string;
  name: string;
  bank: string;
  logo: string | null;
  color: string;
  amount: number;
  dueDate: string | null; // YYYY-MM-DD
  closeDate: string | null;
  limit: number | null;
  available: number | null;
  minimum: number | null;
};

type TxRow = {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
};

export type Summary = {
  monthLabel: string;
  dayOfMonth: number;
  daysInMonth: number;
  spent: number;
  budget: number;
  income: number;
  expenses: number;
  result: number;
  prevResult: number;
  resultChange: number;
  balance: number;
  balanceChange: number;
  pace: { diff: number; perDay: number; remainingDays: number };
  spendingCurve: { day: number; ideal: number; real: number | null }[];
  distribution: { key: CategoryKey; value: number; limit?: number; trend?: "up" | "down" }[];
  invoices: { total: number; dueDate: string; balanceAfter: number; cards: InvoiceCard[] };
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  current: number;
  due_date: string | null;
  icon: GoalIconKey;
  color: string;
  priority: boolean;
  photo_path?: string | null;
  /** Link temporário para exibir a foto (não é salvo). */
  photo_url?: string | null;
};

export type GoalInput = Omit<Goal, "id" | "photo_url"> & { id?: string; photo_url?: string | null };

/** Limite mensal por categoria. */
export type Budgets = Partial<Record<CategoryKey, number>>;

type FinanceCtx = {
  mode: "demo" | "live";
  /** Pode criar/editar metas e orçamentos (precisa estar logado). */
  canEdit: boolean;
  goals: Goal[];
  budgets: Budgets;
  recurrences: Recurrence[];
  saveGoal: (g: GoalInput) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  saveBudget: (category: CategoryKey, limit: number | null) => Promise<void>;
  /** Assinaturas/parcelados cadastrados pelo usuário (incluindo os encerrados). */
  manualRecurrences: Recurrence[];
  saveManualRecurrence: (r: Omit<ManualRecurrence, "id"> & { id?: string }) => Promise<void>;
  deleteManualRecurrence: (id: string) => Promise<void>;
  /** Foto de perfil (link temporário) e troca da foto. */
  avatarUrl: string | null;
  setAvatar: (file: File | null) => Promise<void>;
  configured: boolean;
  session: Session | null;
  ready: boolean;
  items: ItemRow[];
  accounts: AccountRow[];
  transactions: Transaction[];
  summary: Summary;
  reload: () => Promise<void>;
  signOut: () => Promise<void>;
};

/* ───────── Cálculos ───────── */

/** Categorias que não são consumo (não entram em "gastos"). */
const NOT_SPENDING: CategoryKey[] = ["transferencias", "investimento", "salario"];

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const brDate = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

function buildSummary(
  txs: Transaction[],
  accounts: AccountRow[],
  items: ItemRow[],
  budgets: Budgets,
  now = new Date(),
): Summary {
  const y = now.getFullYear();
  const m = now.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const day = now.getDate();
  const monthStart = ymd(new Date(y, m, 1));
  const prevStart = ymd(new Date(y, m - 1, 1));

  const thisMonth = txs.filter((t) => t.date >= monthStart);
  const prevMonth = txs.filter((t) => t.date >= prevStart && t.date < monthStart);
  const isSpend = (t: Transaction) => t.amount < 0 && !NOT_SPENDING.includes(t.category);

  const income = thisMonth.filter((t) => t.amount > 0 && t.category !== "transferencias").reduce((a, t) => a + t.amount, 0);
  const spent = -thisMonth.filter(isSpend).reduce((a, t) => a + t.amount, 0);
  const prevSpent = -prevMonth.filter(isSpend).reduce((a, t) => a + t.amount, 0);
  const prevIncome = prevMonth.filter((t) => t.amount > 0 && t.category !== "transferencias").reduce((a, t) => a + t.amount, 0);

  // Orçamento: soma dos limites cadastrados; sem limites, usa o gasto do mês anterior como referência.
  const budgetSum = Object.values(budgets).reduce((a, v) => a + (v ?? 0), 0);
  const budget = budgetSum > 0 ? budgetSum : Math.max(100, Math.ceil((prevSpent || spent * 1.25 || 1000) / 100) * 100);

  const byDay = new Map<number, number>();
  for (const t of thisMonth.filter(isSpend)) {
    const d = Number(t.date.slice(8, 10));
    byDay.set(d, (byDay.get(d) ?? 0) - t.amount);
  }
  let acc = 0;
  const spendingCurve = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    acc += byDay.get(d) ?? 0;
    return { day: d, ideal: Math.round((budget / daysInMonth) * d), real: d <= day ? Math.round(acc * 100) / 100 : null };
  });

  const ideal = (budget / daysInMonth) * day;
  const remainingDays = Math.max(1, daysInMonth - day);

  const byCat = new Map<CategoryKey, number>();
  const prevByCat = new Map<CategoryKey, number>();
  for (const t of thisMonth.filter(isSpend)) byCat.set(t.category, (byCat.get(t.category) ?? 0) - t.amount);
  for (const t of prevMonth.filter(isSpend)) prevByCat.set(t.category, (prevByCat.get(t.category) ?? 0) - t.amount);
  const distribution = [...byCat.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, value]) => {
      const prev = prevByCat.get(key) ?? 0;
      const trend: "up" | "down" | undefined = prev ? (value > prev * 1.1 ? "up" : value < prev * 0.9 ? "down" : undefined) : undefined;
      return { key, value: Math.round(value * 100) / 100, trend, limit: budgets[key] };
    });

  const balance = accounts.filter((a) => a.type === "BANK").reduce((a, c) => a + Number(c.balance), 0);
  const credit = accounts.filter((a) => a.type === "CREDIT");
  const color = (a: AccountRow) => items.find((i) => i.id === a.item_id)?.primary_color ?? "#6a00ff";
  const total = credit.reduce((a, c) => a + Number(c.balance), 0);
  const nextDue = credit.map((c) => c.balance_due_date).filter(Boolean).sort()[0];

  const result = income - spent;
  const prevResult = prevIncome - prevSpent;

  return {
    monthLabel: now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    dayOfMonth: day,
    daysInMonth,
    spent,
    budget,
    income,
    expenses: spent,
    result,
    prevResult,
    resultChange: prevResult ? Math.round(((result - prevResult) / Math.abs(prevResult)) * 100) : 0,
    balance,
    balanceChange: 0,
    pace: {
      diff: Math.round(ideal - spent),
      perDay: Math.max(0, Math.floor((budget - spent) / remainingDays / 5) * 5),
      remainingDays,
    },
    spendingCurve,
    distribution,
    invoices: {
      total,
      dueDate: nextDue ? brDate(nextDue) : "—",
      balanceAfter: balance - total,
      cards: credit.map((c) => {
        const item = items.find((i) => i.id === c.item_id);
        return {
          id: c.id,
          name: c.name,
          bank: item?.connector_name ?? "Banco",
          logo: item?.connector_image ?? null,
          color: color(c),
          amount: Number(c.balance),
          dueDate: c.balance_due_date,
          closeDate: c.balance_close_date ?? null,
          limit: c.credit_limit != null ? Number(c.credit_limit) : null,
          available: c.available_credit_limit != null ? Number(c.available_credit_limit) : null,
          minimum: c.minimum_payment != null ? Number(c.minimum_payment) : null,
        };
      }),
    },
  };
}

const demoSummary: Summary = {
  monthLabel: demo.month.label,
  dayOfMonth: demo.month.dayOfMonth,
  daysInMonth: demo.month.daysInMonth,
  spent: demo.month.spent,
  budget: demo.month.budget,
  income: demo.month.income,
  expenses: demo.month.expenses,
  result: demo.month.result,
  prevResult: demo.month.prevResult,
  resultChange: demo.month.resultChange,
  balance: demo.month.balance,
  balanceChange: demo.month.balanceChange,
  pace: demo.pace,
  spendingCurve: demo.spendingCurve,
  distribution: demo.distribution,
  invoices: {
    ...demo.invoices,
    cards: demo.invoices.cards.map((c, i) => ({
      id: `demo-card-${i}`,
      name: `Cartão ${c.name}`,
      bank: c.name,
      logo: null,
      color: c.color,
      amount: c.amount,
      dueDate: ["2026-11-22", "2026-11-25", "2026-12-02"][i] ?? null,
      closeDate: ["2026-11-15", "2026-11-18", "2026-11-25"][i] ?? null,
      limit: [5000, 3000, 2500][i] ?? null,
      available: [5000 - c.amount, 3000 - c.amount, 2500 - c.amount][i] ?? null,
      minimum: Math.round(c.amount * 0.15),
    })),
  },
};

/** "05/10/2026" ou "03/2027" → "2026-10-05" / "2027-03-01". */
const toIso = (br: string) => {
  const p = br.split("/");
  return p.length === 3 ? `${p[2]}-${p[1]}-${p[0]}` : `${p[1]}-${p[0]}-01`;
};

const demoGoals: Goal[] = demo.goals.map((g, i) => ({
  id: `demo-${i}`,
  name: g.name,
  target: g.target,
  current: g.current,
  due_date: toIso(g.due),
  icon: g.icon,
  color: g.color,
  priority: g.priority,
}));

const demoRecurrences: Recurrence[] = demo.recurrences.map((r) => {
  const [d, m] = r.date.split("/");
  return {
    key: r.name,
    name: r.name,
    category: "assinaturas" as CategoryKey,
    amount: r.amount,
    day: Number(d),
    months: 6,
    next: `2026-${m}-${d}`,
    lastDate: `2026-10-${d}`,
  };
});

/* ───────── Provider ───────── */

const Ctx = createContext<FinanceCtx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!isSupabaseConfigured);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [rows, setRows] = useState<TxRow[]>([]);
  const [dbGoals, setDbGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budgets>({});
  const [manualRows, setManualRows] = useState<ManualRecurrence[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !session) return;
    const since = new Date();
    since.setMonth(since.getMonth() - 3, 1);
    const [i, a, t, g, b, mr] = await Promise.all([
      sb.from("pluggy_items").select("*").order("created_at"),
      sb.from("accounts").select("*").order("type"),
      sb
        .from("transactions")
        .select("id, account_id, date, description, amount, category")
        .gte("date", ymd(since))
        .order("date", { ascending: false })
        .limit(5000),
      sb.from("goals").select("*").order("priority", { ascending: false }).order("created_at"),
      sb.from("budgets").select("category, monthly_limit"),
      sb.from("manual_recurrences").select("*").order("created_at"),
    ]);
    setManualRows(((mr.data as ManualRecurrence[]) ?? []).map((r) => ({ ...r, amount: Number(r.amount) })));
    const goalRows = ((g.data as Goal[]) ?? []).map((r) => ({ ...r, target: Number(r.target), current: Number(r.current) }));
    const avatarPath = session.user.user_metadata?.avatar_path as string | undefined;
    const urls = await signedUrls([...goalRows.map((r) => r.photo_path ?? ""), avatarPath ?? ""]);
    setDbGoals(goalRows.map((r) => ({ ...r, photo_url: r.photo_path ? (urls[r.photo_path] ?? null) : null })));
    setAvatarUrl(avatarPath ? (urls[avatarPath] ?? null) : null);
    setBudgets(
      Object.fromEntries(
        ((b.data as { category: CategoryKey; monthly_limit: number }[]) ?? []).map((r) => [r.category, Number(r.monthly_limit)]),
      ),
    );
    setItems((i.data as ItemRow[]) ?? []);
    setAccounts(((a.data as AccountRow[]) ?? []).map((r) => ({ ...r, balance: Number(r.balance) })));
    setRows(((t.data as TxRow[]) ?? []).map((r) => ({ ...r, amount: Number(r.amount) })));
    setReady(true);
  }, [session]);

  useEffect(() => {
    if (session) reload();
    else {
      setItems([]);
      setAccounts([]);
      setRows([]);
      setDbGoals([]);
      setBudgets({});
      setManualRows([]);
      setAvatarUrl(null);
    }
  }, [session, reload]);

  const saveGoal = useCallback(
    async (goal: GoalInput) => {
      const sb = getSupabase();
      if (!sb || !session) throw new Error("Entre na sua conta para salvar metas.");
      const { id, photo_url: _url, ...fields } = goal;
      void _url;
      const { error } = id
        ? await sb.from("goals").update(fields).eq("id", id)
        : await sb.from("goals").insert(fields);
      if (error) throw new Error(error.message);
      await reload();
    },
    [session, reload],
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      if (!sb || !session) return;
      const photo = dbGoals.find((g) => g.id === id)?.photo_path;
      const { error } = await sb.from("goals").delete().eq("id", id);
      if (!error) await removePhoto(photo);
      if (error) throw new Error(error.message);
      await reload();
    },
    [session, reload, dbGoals],
  );

  const setAvatar = useCallback(
    async (file: File | null) => {
      const sb = getSupabase();
      if (!sb || !session) throw new Error("Entre na sua conta para trocar a foto.");
      const old = session.user.user_metadata?.avatar_path as string | undefined;
      const path = file ? await uploadPhoto(file, "perfil", 512) : null;
      const { error } = await sb.auth.updateUser({ data: { avatar_path: path } });
      if (error) throw new Error(error.message);
      await removePhoto(old);
      const urls = path ? await signedUrls([path]) : {};
      setAvatarUrl(path ? (urls[path] ?? null) : null);
    },
    [session],
  );

  const saveBudget = useCallback(
    async (category: CategoryKey, limit: number | null) => {
      const sb = getSupabase();
      if (!sb || !session) throw new Error("Entre na sua conta para definir orçamentos.");
      const { error } =
        limit && limit > 0
          ? await sb.from("budgets").upsert({ category, monthly_limit: limit }, { onConflict: "user_id,category" })
          : await sb.from("budgets").delete().eq("category", category);
      if (error) throw new Error(error.message);
      await reload();
    },
    [session, reload],
  );

  const live = Boolean(session && items.length);

  const saveManualRecurrence = useCallback(
    async (r: Omit<ManualRecurrence, "id"> & { id?: string }) => {
      const sb = getSupabase();
      if (!sb || !session) throw new Error("Entre na sua conta para cadastrar.");
      const { id, ...fields } = r;
      const { error } = id
        ? await sb.from("manual_recurrences").update(fields).eq("id", id)
        : await sb.from("manual_recurrences").insert(fields);
      if (error) throw new Error(error.message);
      await reload();
    },
    [session, reload],
  );

  const deleteManualRecurrence = useCallback(
    async (id: string) => {
      const sb = getSupabase();
      if (!sb || !session) return;
      const { error } = await sb.from("manual_recurrences").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await reload();
    },
    [session, reload],
  );

  const manualRecurrences = useMemo(() => manualToRecurrences(manualRows), [manualRows]);

  const value = useMemo<FinanceCtx>(() => {
    const activeManual = manualRecurrences.filter((r) => !r.ended);
    /** Junta cadastros manuais com os detectados, sem repetir o mesmo gasto. */
    const merge = (auto: Recurrence[]) =>
      [...activeManual, ...auto.filter((a) => !manualRecurrences.some((m) => sameRecurrence(m.name, a.name)))].sort((x, y) =>
        x.next.localeCompare(y.next),
      );
    const shared = {
      avatarUrl,
      setAvatar,
      manualRecurrences,
      saveManualRecurrence,
      deleteManualRecurrence,
      canEdit: Boolean(session),
      goals: session ? dbGoals : demoGoals,
      budgets,
      saveGoal,
      deleteGoal,
      saveBudget,
    };
    if (!live) {
      return {
        ...shared,
        recurrences: merge(session ? [] : demoRecurrences),
        mode: "demo",
        configured: isSupabaseConfigured,
        session,
        ready,
        items,
        accounts,
        transactions: demo.transactions,
        summary: demoSummary,
        reload,
        signOut: async () => void (await getSupabase()?.auth.signOut()),
      };
    }
    const accName = new Map(accounts.map((a) => [a.id, a.name]));
    const transactions: Transaction[] = rows.map((r) => ({
      id: r.id,
      date: r.date,
      description: r.description,
      category: mapCategory(r.category, r.description),
      account: accName.get(r.account_id) ?? "Conta",
      amount: r.amount,
    }));
    return {
      ...shared,
      recurrences: merge(detectRecurrences(transactions)),
      mode: "live",
      configured: true,
      session,
      ready,
      items,
      accounts,
      transactions,
      summary: buildSummary(transactions, accounts, items, budgets),
      reload,
      signOut: async () => void (await getSupabase()?.auth.signOut()),
    };
  }, [live, session, ready, items, accounts, rows, reload, dbGoals, budgets, saveGoal, deleteGoal, saveBudget, manualRecurrences, saveManualRecurrence, deleteManualRecurrence, avatarUrl, setAvatar]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinance() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFinance precisa estar dentro de <FinanceProvider>.");
  return v;
}
