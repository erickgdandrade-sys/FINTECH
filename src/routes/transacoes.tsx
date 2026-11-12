import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { ArrowDownCircle, ArrowUpCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { categories, transactions, type CategoryKey } from "@/lib/data";
import { money } from "@/lib/format";

export const Route = createFileRoute("/transacoes")({
  component: Transactions,
});

type Kind = "todas" | "entradas" | "saidas";

const dayLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

function Transactions() {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("todas");
  const [cat, setCat] = useState<CategoryKey | null>(null);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (kind === "todas" || (kind === "entradas" ? t.amount > 0 : t.amount < 0)) &&
          (!cat || t.category === cat) &&
          t.description.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, kind, cat],
  );

  const income = filtered.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const outcome = filtered.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()];
  }, [filtered]);

  const usedCats = [...new Set(transactions.map((t) => t.category))];

  return (
    <>
      <PageHeader title="Transações" subtitle="Novembro 2026" />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Entradas", value: income, cls: "text-positive", icon: ArrowDownCircle },
          { label: "Saídas", value: outcome, cls: "text-pink", icon: ArrowUpCircle },
          { label: "Saldo do período", value: income + outcome, cls: "text-violet", icon: null },
        ].map(({ label, value, cls, icon: Icon }) => (
          <div key={label} className="card rise p-5">
            <p className={clsx("flex items-center gap-1.5 text-[13px] font-medium", cls)}>
              {Icon && <Icon size={15} />} {label}
            </p>
            <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(value)}</Money>
          </div>
        ))}
      </div>

      <div className="card rise p-4 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar</span>
            <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar transação…"
              className="h-11 w-full rounded-xl bg-canvas pr-4 pl-10 text-[14px] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-violet/30"
            />
          </label>
          <div className="flex rounded-xl bg-canvas p-1">
            {(["todas", "entradas", "saidas"] as Kind[]).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={clsx(
                  "flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold capitalize transition-colors",
                  kind === k ? "bg-white text-violet shadow-sm" : "text-ink-3 hover:text-ink",
                )}
              >
                {k === "saidas" ? "Saídas" : k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCat(null)}
            className={clsx(
              "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold",
              !cat ? "bg-ink text-white" : "bg-canvas text-ink-2 hover:bg-line",
            )}
          >
            Todas
          </button>
          {usedCats.map((k) => (
            <button
              key={k}
              onClick={() => setCat(cat === k ? null : k)}
              className={clsx(
                "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
                cat === k ? "text-white" : "text-ink-2 hover:brightness-95",
              )}
              style={{ background: cat === k ? categories[k].color : categories[k].soft }}
            >
              {categories[k].emoji} {categories[k].label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {groups.length === 0 && (
            <p className="py-12 text-center text-[14px] text-ink-3">Nenhuma transação encontrada.</p>
          )}
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="sticky top-16 bg-white py-2 text-[12px] font-semibold text-ink-3 first-letter:uppercase lg:top-0">
                {dayLabel(date)}
              </p>
              <ul className="divide-y divide-line/70">
                {items.map((t) => {
                  const c = categories[t.category];
                  return (
                    <li key={t.id} className="flex items-center gap-3 rounded-xl px-1 py-3 hover:bg-canvas/60">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl text-[17px]" style={{ background: c.soft }}>
                        {c.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold">{t.description}</p>
                        <p className="text-[12px] text-ink-3">
                          {c.label} · {t.account}
                        </p>
                      </div>
                      <Money className={clsx("text-[15px] font-bold", t.amount > 0 ? "text-positive" : "text-ink")}>
                        {t.amount > 0 ? "+" : "−"}
                        {money(Math.abs(t.amount))}
                      </Money>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
