import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { Check, Plus, RotateCcw, Sparkles, Trash2, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { Nivi } from "@/components/brand";
import { CategoryIcon, GoalIcon } from "@/components/icons";
import { categories, type CategoryKey } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { money } from "@/lib/format";
import { monthLabel, nextMonthIso, suggestPlan, totals, type Plan, type PlanKind, type PlanLine } from "@/lib/planning";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/planejamento")({
  component: Planning,
});

const sections: { kind: PlanKind; title: string; hint: string }[] = [
  { kind: "fixo", title: "Contas fixas e assinaturas", hint: "Detectadas nas suas transações" },
  { kind: "variavel", title: "Gastos do dia a dia", hint: "Pelo seu orçamento ou pela média dos últimos meses" },
  { kind: "meta", title: "Guardar para metas", hint: "Quanto separar para chegar no prazo" },
  { kind: "extra", title: "Gastos extras previstos", hint: "Presentes, viagens, IPVA, consertos…" },
];

const parse = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;

/** Campo de dinheiro que aceita centavos enquanto digita (o texto só é formatado ao sair do campo). */
function MoneyInput({
  value,
  onValue,
  className,
  ...rest
}: { value: number; onValue: (v: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const fmt = (v: number) => (v ? v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "");
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      {...rest}
      inputMode="decimal"
      value={text ?? fmt(value)}
      onFocus={() => setText(fmt(value))}
      onBlur={() => setText(null)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d.,]/g, "");
        setText(raw);
        onValue(parse(raw));
      }}
      className={className}
    />
  );
}

function Planning() {
  const { transactions: allTx, recurrences, budgets, goals, canEdit, session, saveBudget, mode, summary, ready } = useFinance();
  const month = nextMonthIso();
  const userId = session?.user.id ?? null;
  // Logado sem banco conectado: não usar as transações de exemplo na sugestão.
  const transactions = useMemo(() => (session && mode === "demo" ? [] : allTx), [session, mode, allTx]);
  const suggestion = useMemo(() => {
    if (mode === "demo" && !session) {
      // Exemplo: dados de demonstração só têm o mês atual, então montamos um plano ilustrativo.
      const base = suggestPlan(transactions, recurrences, {}, goals);
      const variable: PlanLine[] = summary.distribution
        .filter((d) => d.key !== "assinaturas")
        .map((d) => ({ id: `var-${d.key}`, kind: "variavel", label: "", category: d.key, amount: Math.round((d.limit ?? d.value) / 10) * 10 }));
      return {
        ...base,
        income: 9500,
        lines: [
          ...base.lines.filter((l) => l.kind === "fixo"),
          ...variable,
          ...base.lines.filter((l) => l.kind === "meta").map((l) => ({ ...l, amount: Math.min(l.amount, 500) })),
        ],
      };
    }
    return suggestPlan(transactions, recurrences, budgets, goals);
  }, [transactions, recurrences, budgets, goals, mode, session, summary.distribution]);

  const [plan, setPlan] = useState<Plan | null>(null);
  /** "saved" = veio do banco; "suggestion" = sugestão ainda não salva. */
  const [source, setSource] = useState<"saved" | "suggestion">("suggestion");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  // 1) Busca o plano salvo UMA vez por usuário/mês (recarregar dados não apaga suas edições).
  useEffect(() => {
    const key = `${userId ?? "anon"}:${month}`;
    if (loadedFor === key) return;
    const sb = getSupabase();
    if (!sb || !userId) {
      setLoadedFor(key);
      setSource("suggestion");
      setPlan(null);
      return;
    }
    let cancel = false;
    sb.from("month_plans")
      .select("income, lines, updated_at")
      .eq("month", month)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) setNotice({ kind: "error", text: `Não foi possível carregar o plano salvo: ${error.message}` });
        if (data) {
          setPlan({ month, income: Number(data.income), lines: (data.lines as PlanLine[]) ?? [] });
          setSavedAt(data.updated_at as string);
          setSource("saved");
        } else {
          setPlan(null);
          setSource("suggestion");
        }
        setDirty(false);
        setLoadedFor(key);
      });
    return () => {
      cancel = true;
    };
  }, [userId, month, loadedFor]);

  // 2) Sem plano salvo e sem edições: acompanha a sugestão (ela muda quando os dados terminam de carregar).
  useEffect(() => {
    if (!loadedFor || source === "saved" || dirty) return;
    setPlan(suggestion);
  }, [loadedFor, source, dirty, suggestion]);

  const update = useCallback((fn: (p: Plan) => Plan) => {
    setPlan((p) => (p ? fn(p) : p));
    setDirty(true);
    setNotice(null);
  }, []);

  if (!plan || !loadedFor || (session && !ready)) {
    return (
      <>
        <PageHeader title="Planejamento" subtitle={`Próximo mês · ${monthLabel(month)}`} />
        <div className="card animate-pulse p-6 text-[14px] text-ink-3">Montando seu planejamento…</div>
      </>
    );
  }

  const t = totals(plan);
  const usage = plan.income ? Math.min(100, (t.planned / plan.income) * 100) : 0;
  const priorityGoal = goals.find((g) => g.priority && g.current < g.target);

  async function save() {
    const sb = getSupabase();
    if (!sb || !session || !plan) return;
    setBusy(true);
    const { data, error } = await sb
      .from("month_plans")
      .upsert({ month, income: plan.income, lines: plan.lines, updated_at: new Date().toISOString() }, { onConflict: "user_id,month" })
      .select("updated_at")
      .single();
    setBusy(false);
    if (error) return setNotice({ kind: "error", text: `Não foi possível salvar: ${error.message}` });
    setSavedAt(data.updated_at as string);
    setSource("saved");
    setDirty(false);
    setNotice({ kind: "ok", text: "Planejamento salvo." });
  }

  async function applyBudgets() {
    if (!plan) return;
    setBusy(true);
    try {
      const fixedByCat = new Map<CategoryKey, number>();
      for (const l of plan.lines) {
        if (!l.category || (l.kind !== "fixo" && l.kind !== "variavel")) continue;
        fixedByCat.set(l.category, (fixedByCat.get(l.category) ?? 0) + l.amount);
      }
      for (const [k, v] of fixedByCat) await saveBudget(k, Math.round(v));
      setNotice({ kind: "ok", text: `Limites de ${fixedByCat.size} categorias atualizados em Categorias.` });
    } catch (err) {
      setNotice({ kind: "error", text: err instanceof Error ? err.message : "Não foi possível aplicar." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Planejamento"
        subtitle={`Próximo mês · ${monthLabel(month)}`}
        actions={
          canEdit && (
            <button
              onClick={save}
              disabled={busy || (source === "saved" && !dirty)}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-violet px-3.5 text-[14px] font-bold text-white hover:brightness-110 disabled:opacity-50"
            >
              <Check size={17} /> {busy ? "Salvando…" : source === "saved" && !dirty ? "Salvo" : dirty && source === "saved" ? "Salvar alterações" : "Salvar plano"}
            </button>
          )
        }
      />

      {!canEdit && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          Plano de exemplo.{" "}
          <Link to="/entrar" className="font-semibold underline">
            Entre na sua conta
          </Link>{" "}
          para salvar o seu.
        </p>
      )}
      {notice && (
        <p className={clsx("rise mb-4 rounded-2xl px-4 py-3 text-[14px]", notice.kind === "ok" ? "bg-positive-soft text-positive" : "bg-pink-soft text-pink")}>
          {notice.text}
        </p>
      )}

      {/* Resumo */}
      <div className="mb-5 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="card rise p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="plan-income" className="text-[13px] font-medium text-ink-2">
                Renda prevista
              </label>
              <div className="relative mt-1">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[14px] text-ink-3">R$</span>
                <MoneyInput
                  id="plan-income"
                  value={plan.income}
                  onValue={(v) => update((p) => ({ ...p, income: v }))}
                  className="input pl-9 text-[18px] font-bold"
                />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink-2">Total planejado</p>
              <Money className="mt-2 block text-[22px] font-bold tracking-[-0.03em]">{money(t.planned)}</Money>
            </div>
            <div>
              <p className="text-[13px] font-medium text-ink-2">{t.leftover >= 0 ? "Sobra prevista" : "Vai faltar"}</p>
              <Money className={clsx("mt-2 block text-[22px] font-bold tracking-[-0.03em]", t.leftover >= 0 ? "text-positive" : "text-pink")}>
                {money(Math.abs(t.leftover))}
              </Money>
            </div>
          </div>
          {/* barra empilhada */}
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-line">
            {(
              [
                ["fixo", "#6a00ff"],
                ["variavel", "#00a3b8"],
                ["meta", "#b8ff00"],
                ["extra", "#ff6b00"],
              ] as const
            ).map(([k, c]) => (
              <span key={k} style={{ width: plan.income ? `${(t[k] / Math.max(plan.income, t.planned)) * 100}%` : 0, background: c }} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3">
            <Legend color="#6a00ff" label="Fixos" value={t.fixo} />
            <Legend color="#00a3b8" label="Dia a dia" value={t.variavel} />
            <Legend color="#b8ff00" label="Metas" value={t.meta} />
            <Legend color="#ff6b00" label="Extras" value={t.extra} />
            <span className="ml-auto font-semibold text-ink-2">{Math.round(usage)}% da renda</span>
          </div>
        </div>

        <div className="nivo-gradient rise relative overflow-hidden rounded-[22px] p-5 text-white sm:p-6">
          <Nivi className="absolute -right-3 -bottom-5 size-28 opacity-90" sparkle={false} />
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-lime">
            <Sparkles size={14} /> Análise do Nivi
          </p>
          <p className="mt-2 max-w-[85%] text-[14px] leading-snug text-white/90">
            {t.leftover < 0 ? (
              <>
                O plano passa da renda em <b>{money(-t.leftover)}</b>. Reduza os gastos do dia a dia ou adie algum extra para fechar no azul.
              </>
            ) : t.leftover < plan.income * 0.05 ? (
              <>
                Plano apertado: sobram só <b>{money(t.leftover)}</b>. Deixe uma folga para imprevistos.
              </>
            ) : (
              <>
                Sobram <b>{money(t.leftover)}</b>.{" "}
                {priorityGoal ? (
                  <>
                    Que tal mandar parte disso para <b>{priorityGoal.name}</b>?
                  </>
                ) : (
                  "Que tal reforçar a reserva de emergência?"
                )}
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => update(() => suggestion)}
              className="flex items-center gap-1.5 rounded-xl bg-surface/15 px-3 py-2 text-[12px] font-semibold hover:bg-surface/25"
            >
              <RotateCcw size={13} /> Refazer sugestão
            </button>
            {canEdit && (
              <button
                onClick={applyBudgets}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-xl bg-lime px-3 py-2 text-[12px] font-bold text-ink hover:brightness-95 disabled:opacity-60"
              >
                <Wallet size={13} /> Usar como orçamento
              </button>
            )}
          </div>
        </div>
      </div>

      {source === "suggestion" && !dirty && canEdit && (
        <p className="mb-3 text-[12px] text-ink-3">Esta é uma sugestão do Nivi a partir do seu histórico. Ajuste o que quiser e toque em Salvar plano.</p>
      )}
      {savedAt && source === "saved" && !dirty && (
        <p className="mb-3 text-[12px] text-ink-3">
          Salvo em {new Date(savedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {sections.map((s) => {
          const lines = plan.lines.filter((l) => l.kind === s.kind);
          const sum = lines.reduce((a, l) => a + l.amount, 0);
          return (
            <section key={s.kind} className="card rise p-5 sm:p-6">
              <header className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-[15px] font-bold">{s.title}</h2>
                  <p className="text-[12px] text-ink-3">{s.hint}</p>
                </div>
                <Money className="text-[15px] font-bold">{money(sum)}</Money>
              </header>
              <ul className="divide-y divide-line/70">
                {lines.length === 0 && <li className="py-3 text-[13px] text-ink-3">Nada aqui ainda.</li>}
                {lines.map((l) => (
                  <PlanRow
                    key={l.id}
                    line={l}
                    goalColor={goals.find((g) => g.id === l.goalId)?.color}
                    goalIcon={goals.find((g) => g.id === l.goalId)?.icon}
                    onChange={(patch) => update((p) => ({ ...p, lines: p.lines.map((x) => (x.id === l.id ? { ...x, ...patch } : x)) }))}
                    onRemove={() => update((p) => ({ ...p, lines: p.lines.filter((x) => x.id !== l.id) }))}
                  />
                ))}
              </ul>
              {(s.kind === "extra" || s.kind === "fixo") && (
                <button
                  onClick={() =>
                    update((p) => ({
                      ...p,
                      lines: [...p.lines, { id: `${s.kind}-${Date.now()}`, kind: s.kind, label: "", amount: 0 }],
                    }))
                  }
                  className="mt-2 flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-violet hover:bg-violet-soft"
                >
                  <Plus size={15} /> Adicionar
                </button>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label} <Money className="font-semibold text-ink-2">{money(value)}</Money>
    </span>
  );
}

function PlanRow({
  line,
  goalColor,
  goalIcon,
  onChange,
  onRemove,
}: {
  line: PlanLine;
  goalColor?: string;
  goalIcon?: Parameters<typeof GoalIcon>[0]["k"];
  onChange: (patch: Partial<PlanLine>) => void;
  onRemove: () => void;
}) {
  const editableLabel = line.kind === "extra" || (line.kind === "fixo" && !line.category);
  const label = line.kind === "variavel" && line.category ? categories[line.category].label : line.label;
  return (
    <li className="flex items-center gap-3 py-2.5">
      {line.category ? (
        <CategoryIcon k={line.category} size="md" />
      ) : line.kind === "meta" && goalIcon && goalColor ? (
        <GoalIcon k={goalIcon} color={goalColor} className="size-8 rounded-lg [&_svg]:size-4" />
      ) : (
        <span className="grid size-8 place-items-center rounded-lg bg-orange-soft text-orange">
          <Plus size={15} />
        </span>
      )}
      {editableLabel ? (
        <input
          aria-label="Descrição"
          value={line.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Descrição"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-[14px] font-medium outline-none focus:bg-canvas"
        />
      ) : (
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{label}</span>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12px] text-ink-3">R$</span>
        <MoneyInput
          aria-label={`Valor de ${label || "item"}`}
          value={line.amount}
          onValue={(v) => onChange({ amount: v })}
          placeholder="0"
          className="h-9 w-28 rounded-lg border border-line bg-surface pr-2 pl-8 text-right text-[14px] font-semibold tabular outline-none focus:border-violet"
        />
      </div>
      <button onClick={onRemove} className="grid size-8 place-items-center rounded-lg text-ink-3 hover:bg-pink-soft hover:text-pink" aria-label={`Remover ${label || "item"}`}>
        <Trash2 size={14} />
      </button>
    </li>
  );
}
