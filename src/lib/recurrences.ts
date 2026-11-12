import type { CategoryKey, Transaction } from "./data";

export type Recurrence = {
  key: string;
  name: string;
  category: CategoryKey;
  amount: number; // valor típico (positivo)
  day: number; // dia do mês em que costuma cair
  months: number; // em quantos meses apareceu
  next: string; // próxima data prevista (YYYY-MM-DD)
  lastDate: string;
  source?: "auto" | "manual";
  manualId?: string;
  kind?: "assinatura" | "parcelado";
  endDate?: string | null;
  installment?: { current: number; total: number } | null;
  ended?: boolean;
};

export type ManualRecurrence = {
  id: string;
  kind: "assinatura" | "parcelado";
  name: string;
  amount: number;
  category: CategoryKey;
  day: number;
  start_date: string;
  end_date: string | null;
  installments: number | null;
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Data no dia `day` do mês (ajusta para o último dia em meses curtos). */
const onDay = (y: number, m: number, day: number) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()));
const monthsBetween = (a: string, b: string) => {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
};

/** Converte cadastros manuais em recorrências com próxima cobrança, parcela atual e término. */
export function manualToRecurrences(rows: ManualRecurrence[], today = new Date()): Recurrence[] {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return rows.map((r) => {
    let next = onDay(today.getFullYear(), today.getMonth(), r.day);
    if (next < t0) next = onDay(today.getFullYear(), today.getMonth() + 1, r.day);
    const start = new Date(`${r.start_date}T00:00:00`);
    if (next < start) next = onDay(start.getFullYear(), start.getMonth(), r.day);
    const nextIso = iso(next);
    const endIso =
      r.end_date ??
      (r.kind === "parcelado" && r.installments ? iso(onDay(start.getFullYear(), start.getMonth() + r.installments - 1, r.day)) : null);
    const ended = Boolean(endIso && nextIso.slice(0, 7) > endIso.slice(0, 7));
    const total = r.kind === "parcelado" ? (r.installments ?? (r.end_date ? monthsBetween(r.start_date, r.end_date) + 1 : null)) : null;
    const current = total ? Math.min(total, monthsBetween(r.start_date, nextIso) + 1) : null;
    return {
      key: `manual-${r.id}`,
      name: r.name,
      category: r.category,
      amount: Number(r.amount),
      day: r.day,
      months: Math.max(1, monthsBetween(r.start_date, iso(t0)) + 1),
      next: nextIso,
      lastDate: r.start_date,
      source: "manual",
      manualId: r.id,
      kind: r.kind,
      endDate: endIso,
      installment: total && current ? { current, total } : null,
      ended,
    };
  });
}

/** Normalização usada para não duplicar um cadastro manual com uma recorrência detectada. */
export const sameRecurrence = (a: string, b: string) => {
  const n = (s: string) => normalize(s).replace(/\s/g, "");
  const x = n(a);
  const y = n(b);
  return x.length > 2 && y.length > 2 && (x.includes(y) || y.includes(x));
};

/** Remove números, datas e ruídos para agrupar "NETFLIX.COM 0423" e "NETFLIX.COM 0523". */
function normalize(desc: string) {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\d+[\/.-]\d+([\/.-]\d+)?/g, "")
    .replace(/\d+/g, "")
    .replace(/\b(parc(ela)?|pgto|pag(amento)?|compra|debito|credito)\b/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const pretty = (s: string) => s.replace(/\s+/g, " ").trim().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Detecta gastos recorrentes: mesma descrição em 2+ meses diferentes, com valor parecido (±20%).
 * Ignora transferências, salário e investimentos.
 */
export function detectRecurrences(transactions: Transaction[], today = new Date()): Recurrence[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.amount >= 0 || ["transferencias", "salario", "investimento"].includes(t.category)) continue;
    const k = normalize(t.description);
    if (k.length < 3) continue;
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }

  const out: Recurrence[] = [];
  for (const [key, txs] of groups) {
    const byMonth = new Map<string, Transaction>();
    for (const t of txs) {
      const m = t.date.slice(0, 7);
      if (!byMonth.has(m)) byMonth.set(m, t);
    }
    if (byMonth.size < 2) continue;

    const amounts = [...byMonth.values()].map((t) => -t.amount);
    const typical = median(amounts);
    if (amounts.some((a) => Math.abs(a - typical) / typical > 0.2)) continue;

    const sorted = [...byMonth.values()].sort((a, b) => b.date.localeCompare(a.date));
    const last = sorted[0];
    // Só considera ativa se apareceu nos últimos ~45 dias.
    if (today.getTime() - new Date(`${last.date}T12:00:00`).getTime() > 45 * 864e5) continue;

    const day = Math.round(median(sorted.map((t) => Number(t.date.slice(8, 10)))));
    const next = new Date(today.getFullYear(), today.getMonth(), day);
    if (next.getTime() < new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) {
      next.setMonth(next.getMonth() + 1);
    }
    out.push({
      source: "auto",
      key,
      name: pretty(last.description),
      category: last.category,
      amount: Math.round(typical * 100) / 100,
      day,
      months: byMonth.size,
      next: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`,
      lastDate: last.date,
    });
  }
  return out.sort((a, b) => a.next.localeCompare(b.next));
}
