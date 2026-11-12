import type { CategoryKey, Transaction } from "./data";
import type { Budgets, Goal } from "./finance";
import type { Recurrence } from "./recurrences";

export type PlanKind = "fixo" | "variavel" | "meta" | "extra";

export type PlanLine = {
  id: string;
  kind: PlanKind;
  label: string;
  amount: number;
  category?: CategoryKey;
  goalId?: string;
};

export type Plan = { month: string; income: number; lines: PlanLine[] };

const NOT_SPENDING: CategoryKey[] = ["transferencias", "investimento", "salario"];
const round10 = (v: number) => Math.round(v / 10) * 10;

/** Primeiro dia do mês seguinte, em YYYY-MM-DD. */
export function nextMonthIso(today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthLabel(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/** Meses completos anteriores ao atual presentes nos dados (até 3). */
function completeMonths(txs: Transaction[], today: Date) {
  const current = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return [...new Set(txs.map((t) => t.date.slice(0, 7)))]
    .filter((m) => m < current)
    .sort()
    .slice(-3);
}

/**
 * Sugere o plano do próximo mês a partir do histórico:
 * - renda: média dos últimos meses completos
 * - fixos: recorrências detectadas
 * - variáveis: orçamento da categoria, ou média do histórico (sem a parte já coberta pelos fixos)
 * - metas: quanto guardar por mês para chegar no prazo
 */
export function suggestPlan(
  txs: Transaction[],
  recurrences: Recurrence[],
  budgets: Budgets,
  goals: Goal[],
  today = new Date(),
): Plan {
  const month = nextMonthIso(today);
  const months = completeMonths(txs, today);
  const n = Math.max(1, months.length);
  const inMonths = txs.filter((t) => months.includes(t.date.slice(0, 7)));

  // Renda: mediana por mês (um mês incompleto não derruba a previsão).
  const incomes = months
    .map((m) => inMonths.filter((t) => t.date.startsWith(m) && t.amount > 0 && t.category !== "transferencias").reduce((a, t) => a + t.amount, 0))
    .sort((a, b) => a - b);
  const income = incomes.length ? incomes[Math.floor(incomes.length / 2)] : 0;

  const lines: PlanLine[] = [];

  for (const r of recurrences) {
    lines.push({ id: `fixo-${r.key}`, kind: "fixo", label: r.name, amount: r.amount, category: r.category });
  }

  const fixedByCat = new Map<CategoryKey, number>();
  for (const r of recurrences) fixedByCat.set(r.category, (fixedByCat.get(r.category) ?? 0) + r.amount);

  const avgByCat = new Map<CategoryKey, number>();
  for (const t of inMonths) {
    if (t.amount >= 0 || NOT_SPENDING.includes(t.category)) continue;
    avgByCat.set(t.category, (avgByCat.get(t.category) ?? 0) - t.amount / n);
  }

  const cats = new Set<CategoryKey>([...avgByCat.keys(), ...(Object.keys(budgets) as CategoryKey[])]);
  for (const k of cats) {
    const fixed = fixedByCat.get(k) ?? 0;
    const base = budgets[k] ?? avgByCat.get(k) ?? 0;
    const variable = Math.max(0, base - fixed);
    if (variable < 10) continue;
    lines.push({ id: `var-${k}`, kind: "variavel", label: "", amount: round10(variable), category: k });
  }

  const [y, m] = month.split("-").map(Number);
  for (const g of goals) {
    if (g.current >= g.target) continue;
    let amount = 0;
    if (g.due_date) {
      const due = new Date(`${g.due_date}T12:00:00`);
      const left = Math.max(1, (due.getFullYear() - y) * 12 + due.getMonth() - (m - 1) + 1);
      amount = Math.ceil((g.target - g.current) / left / 10) * 10;
    }
    lines.push({ id: `meta-${g.id}`, kind: "meta", label: g.name, amount, goalId: g.id });
  }

  return { month, income: round10(income), lines };
}

export function totals(plan: Plan) {
  const sum = (k: PlanKind) => plan.lines.filter((l) => l.kind === k).reduce((a, l) => a + (l.amount || 0), 0);
  const fixo = sum("fixo");
  const variavel = sum("variavel");
  const meta = sum("meta");
  const extra = sum("extra");
  const planned = fixo + variavel + meta + extra;
  return { fixo, variavel, meta, extra, planned, leftover: plan.income - planned };
}
