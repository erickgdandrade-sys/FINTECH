import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { AlertTriangle, Check, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { CategoryIcon } from "@/components/icons";
import { Progress } from "@/components/ui";
import { categories, type CategoryKey } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { money, moneyShort } from "@/lib/format";

export const Route = createFileRoute("/categorias")({
  component: Categories,
});

/** Categorias de consumo (as que podem ter orçamento). */
const SPENDING: CategoryKey[] = [
  "moradia",
  "mercado",
  "delivery",
  "transporte",
  "saude",
  "assinaturas",
  "compras",
  "lazer",
  "eletronicos",
  "taxas",
  "outros",
];

function Categories() {
  const { transactions, budgets, canEdit, saveBudget, summary, mode } = useFinance();

  const spentByCat = useMemo(() => {
    const now = new Date();
    const monthStart =
      mode === "live" ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01` : "2026-11-01";
    const map = new Map<CategoryKey, number>();
    for (const t of transactions) {
      if (t.date < monthStart || t.amount >= 0) continue;
      map.set(t.category, (map.get(t.category) ?? 0) - t.amount);
    }
    // No modo demonstração, usa a distribuição do dashboard (mais completa que a lista de exemplo).
    if (mode === "demo") for (const d of summary.distribution) map.set(d.key, d.value);
    return map;
  }, [transactions, mode, summary.distribution]);

  const rows = SPENDING.map((k) => ({ k, spent: spentByCat.get(k) ?? 0, limit: budgets[k] })).sort(
    (a, b) => Number(Boolean(b.limit)) - Number(Boolean(a.limit)) || b.spent - a.spent,
  );

  const totalLimit = rows.reduce((a, r) => a + (r.limit ?? 0), 0);
  const totalSpentWithLimit = rows.filter((r) => r.limit).reduce((a, r) => a + r.spent, 0);
  const over = rows.filter((r) => r.limit && r.spent > r.limit);

  return (
    <>
      <PageHeader title="Categorias e orçamento" subtitle={`Limites mensais · ${summary.monthLabel}`} />

      {!canEdit && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          <Link to="/entrar" className="font-semibold underline">
            Entre na sua conta
          </Link>{" "}
          para definir seus limites por categoria.
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Orçamento do mês</p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{totalLimit ? money(totalLimit) : "—"}</Money>
          <p className="text-[12px] text-ink-3">{totalLimit ? "soma dos limites" : "defina limites abaixo"}</p>
        </div>
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Gasto nas categorias com limite</p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(totalSpentWithLimit)}</Money>
          {totalLimit > 0 && <Progress value={(totalSpentWithLimit / totalLimit) * 100} className="mt-2" />}
        </div>
        <div className={clsx("card rise p-5", over.length && "ring-2 ring-pink/40")}>
          <p className="text-[13px] font-medium text-ink-2">Acima do limite</p>
          <p className={clsx("mt-1 text-[24px] font-bold tracking-[-0.03em]", over.length ? "text-pink" : "text-positive")}>
            {over.length ? `${over.length} ${over.length === 1 ? "categoria" : "categorias"}` : "Nenhuma"}
          </p>
          <p className="truncate text-[12px] text-ink-3">{over.map((r) => categories[r.k].label).join(", ") || "Tudo sob controle"}</p>
        </div>
      </div>

      <div className="card rise divide-y divide-line/70 px-4 sm:px-6">
        {rows.map((r) => (
          <BudgetRow key={r.k} k={r.k} spent={r.spent} limit={r.limit} canEdit={canEdit} onSave={(v) => saveBudget(r.k, v)} />
        ))}
      </div>
    </>
  );
}

function BudgetRow({
  k,
  spent,
  limit,
  canEdit,
  onSave,
}: {
  k: CategoryKey;
  spent: number;
  limit?: number;
  canEdit: boolean;
  onSave: (v: number | null) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(limit ? String(limit) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = categories[k];
  const ratio = limit ? spent / limit : 0;
  const tone = !limit ? "none" : ratio > 1 ? "over" : ratio > 0.85 ? "near" : "ok";

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(value.replace(/\./g, "").replace(",", "."));
    setBusy(true);
    setError(null);
    try {
      await onSave(v > 0 ? v : null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <CategoryIcon k={k} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[14px] font-semibold">
            {c.label}
            {tone === "over" && (
              <span className="flex items-center gap-1 rounded-full bg-pink-soft px-2 py-0.5 text-[11px] font-bold text-pink">
                <AlertTriangle size={11} /> passou {moneyShort(spent - (limit ?? 0))}
              </span>
            )}
          </p>
          <p className="text-[12px] text-ink-3">
            Gasto no mês <Money className="font-semibold text-ink-2">{money(spent)}</Money>
            {limit ? (
              <>
                {" "}
                de <Money>{money(limit)}</Money>
              </>
            ) : (
              " · sem limite"
            )}
          </p>
        </div>

        {editing ? (
          <form onSubmit={save} className="flex items-center gap-2">
            <label className="sr-only" htmlFor={`limit-${k}`}>
              Limite mensal de {c.label}
            </label>
            <input
              id={`limit-${k}`}
              autoFocus
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Limite"
              className="input h-9 w-28 text-[14px]"
            />
            <button disabled={busy} className="grid size-9 place-items-center rounded-xl bg-lime text-ink" aria-label="Salvar limite">
              <Check size={16} />
            </button>
          </form>
        ) : (
          canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-2 text-[12px] font-semibold text-ink-2 hover:bg-violet-soft hover:text-violet"
            >
              <Pencil size={13} /> {limit ? "Editar" : "Definir limite"}
            </button>
          )
        )}
      </div>
      {limit ? (
        <Progress
          value={ratio * 100}
          color={tone === "over" ? "var(--color-pink)" : tone === "near" ? "var(--color-orange)" : c.color}
          className="mt-3 ml-[52px]"
        />
      ) : null}
      {error && <p className="mt-2 ml-[52px] text-[12px] text-pink">{error}</p>}
      {editing && <p className="mt-2 ml-[52px] text-[11px] text-ink-3">Deixe em branco para remover o limite.</p>}
    </div>
  );
}
