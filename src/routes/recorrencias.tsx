import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { CalendarClock, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { CategoryIcon } from "@/components/icons";
import { Field, Modal } from "@/components/modal";
import { useQuickIntent } from "@/components/quick-add";
import { Progress } from "@/components/ui";
import { categories, type CategoryKey } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { money } from "@/lib/format";
import type { ManualRecurrence, Recurrence } from "@/lib/recurrences";

export const Route = createFileRoute("/recorrencias")({
  component: Recurrences,
});

const CATS: CategoryKey[] = ["assinaturas", "compras", "eletronicos", "moradia", "saude", "transporte", "lazer", "mercado", "taxas", "outros"];

const when = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 864e5);
  if (days === 0) return "hoje";
  if (days === 1) return "amanhã";
  if (days < 7) return `em ${days} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};
const monthYear = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

type Draft = Omit<ManualRecurrence, "id"> & { id?: string };

function Recurrences() {
  const { recurrences, manualRecurrences, mode, canEdit, saveManualRecurrence, deleteManualRecurrence } = useFinance();
  const [draft, setDraft] = useState<Draft | null>(null);

  const monthly = recurrences.reduce((a, r) => a + r.amount, 0);
  const next7 = recurrences.filter((r) => (new Date(`${r.next}T12:00:00`).getTime() - Date.now()) / 864e5 <= 7);
  const installmentsLeft = manualRecurrences
    .filter((r) => r.kind === "parcelado" && !r.ended && r.installment)
    .reduce((a, r) => a + (r.installment!.total - r.installment!.current + 1) * r.amount, 0);
  const auto = recurrences.filter((r) => r.source !== "manual");
  const ended = manualRecurrences.filter((r) => r.ended);

  const today = new Date();
  const blank = (kind: Draft["kind"]): Draft => ({
    kind,
    name: "",
    amount: 0,
    category: kind === "assinatura" ? "assinaturas" : "compras",
    day: today.getDate(),
    start_date: today.toISOString().slice(0, 10),
    end_date: null,
    installments: kind === "parcelado" ? 10 : null,
  });

  useQuickIntent(["assinatura", "parcelado"], (i) => setDraft(blank(i === "parcelado" ? "parcelado" : "assinatura")), canEdit);

  const edit = (r: Recurrence) => {
    const row = manualRecurrences.find((m) => m.manualId === r.manualId);
    if (!row?.manualId) return;
    setDraft({
      id: row.manualId,
      kind: row.kind!,
      name: row.name,
      amount: row.amount,
      category: row.category,
      day: row.day,
      start_date: row.lastDate,
      end_date: row.endDate ?? null,
      installments: row.installment?.total ?? null,
    });
  };

  return (
    <>
      <PageHeader
        title="Recorrências"
        subtitle="Assinaturas, contas fixas e compras parceladas"
        actions={
          canEdit && (
            <div className="flex gap-2">
              <button onClick={() => setDraft(blank("parcelado"))} className="hidden h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-[13px] font-semibold text-ink-2 hover:text-ink sm:flex">
                <Plus size={16} /> Parcelado
              </button>
              <button onClick={() => setDraft(blank("assinatura"))} className="flex h-10 items-center gap-1.5 rounded-xl bg-violet px-3.5 text-[14px] font-bold text-white hover:brightness-110">
                <Plus size={17} /> Cadastrar
              </button>
            </div>
          )
        }
      />

      {mode === "demo" && !canEdit && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          Exemplo.{" "}
          <Link to="/entrar" className="font-semibold underline">
            Entre na sua conta
          </Link>{" "}
          para cadastrar assinaturas e parcelados, e conecte um banco para o Nivo detectar o resto sozinho.
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card rise p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <Repeat size={14} className="text-violet" /> Por mês
          </p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(monthly)}</Money>
          <p className="text-[12px] text-ink-3">
            {recurrences.length} cobranças · <Money>{money(monthly * 12)}</Money> por ano
          </p>
        </div>
        <div className="card rise p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <CalendarClock size={14} className="text-orange" /> Próximos 7 dias
          </p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(next7.reduce((a, r) => a + r.amount, 0))}</Money>
          <p className="text-[12px] text-ink-3">{next7.length} cobranças</p>
        </div>
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Falta pagar em parcelas</p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(installmentsLeft)}</Money>
          <p className="text-[12px] text-ink-3">somando todas as parcelas restantes</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card rise px-4 py-2 sm:px-6">
          <h2 className="pt-4 text-[15px] font-bold">Cadastradas por você</h2>
          {manualRecurrences.filter((r) => !r.ended).length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">
              {canEdit ? "Cadastre assinaturas e compras parceladas para o Nivo acompanhar até a última parcela." : "Entre para cadastrar."}
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {manualRecurrences
                .filter((r) => !r.ended)
                .sort((a, b) => a.next.localeCompare(b.next))
                .map((r) => (
                  <Row key={r.key} r={r} onEdit={canEdit ? () => edit(r) : undefined} />
                ))}
            </ul>
          )}
        </section>

        <section className="card rise px-4 py-2 sm:px-6">
          <h2 className="pt-4 text-[15px] font-bold">Detectadas automaticamente</h2>
          {auto.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">
              Nenhuma ainda. Elas aparecem quando o mesmo gasto se repete em 2 meses ou mais nas contas conectadas.
            </p>
          ) : (
            <ul className="divide-y divide-line/70">
              {auto.map((r) => (
                <Row key={r.key} r={r} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {ended.length > 0 && (
        <details className="card rise mt-5 px-4 py-3 sm:px-6">
          <summary className="cursor-pointer text-[14px] font-semibold text-ink-2">Encerradas ({ended.length})</summary>
          <ul className="divide-y divide-line/70">
            {ended.map((r) => (
              <Row key={r.key} r={r} onEdit={canEdit ? () => edit(r) : undefined} />
            ))}
          </ul>
        </details>
      )}

      {draft && (
        <RecurrenceModal
          draft={draft}
          onClose={() => setDraft(null)}
          onSave={async (d) => {
            await saveManualRecurrence(d);
            setDraft(null);
          }}
          onDelete={
            draft.id
              ? async () => {
                  await deleteManualRecurrence(draft.id!);
                  setDraft(null);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function Row({ r, onEdit }: { r: Recurrence; onEdit?: () => void }) {
  return (
    <li className={clsx("flex items-center gap-3 py-4", r.ended && "opacity-60")}>
      <CategoryIcon k={r.category} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-[14px] font-semibold">
          {r.name}
          {r.kind && (
            <span className={clsx("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", r.kind === "parcelado" ? "bg-orange-soft text-orange" : "bg-violet-soft text-violet")}>
              {r.kind === "parcelado" ? "Parcelado" : "Assinatura"}
            </span>
          )}
        </p>
        <p className="text-[12px] text-ink-3">
          {categories[r.category].label} · todo dia {r.day}
          {r.endDate ? ` · até ${monthYear(r.endDate)}` : r.source === "auto" ? ` · visto em ${r.months} meses` : ""}
        </p>
        {r.installment && (
          <div className="mt-1.5 flex items-center gap-2">
            <Progress value={(r.installment.current / r.installment.total) * 100} color="var(--color-orange)" className="h-1.5 flex-1" />
            <span className="text-[11px] font-semibold text-ink-2">
              {r.ended ? "quitado" : `parcela ${r.installment.current}/${r.installment.total}`}
            </span>
          </div>
        )}
      </div>
      <div className="text-right">
        <Money className="block text-[15px] font-bold">{money(r.amount)}</Money>
        {!r.ended && <span className="text-[12px] text-ink-3">próxima {when(r.next)}</span>}
      </div>
      {onEdit && (
        <button onClick={onEdit} className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink" aria-label={`Editar ${r.name}`}>
          <Pencil size={15} />
        </button>
      )}
    </li>
  );
}

const parse = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;
const addMonths = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1 + n, 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(d, last));
  return date.toISOString().slice(0, 10);
};

function RecurrenceModal({
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft;
  onClose: () => void;
  onSave: (d: Draft) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [amount, setAmount] = useState(draft.amount ? draft.amount.toLocaleString("pt-BR") : "");
  const [endMode, setEndMode] = useState<"parcelas" | "data">(draft.kind === "parcelado" && draft.installments ? "parcelas" : "data");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const isInstallment = d.kind === "parcelado";
  const computedEnd = isInstallment && endMode === "parcelas" && d.installments ? addMonths(d.start_date, d.installments - 1) : d.end_date;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = parse(amount);
    if (!d.name.trim()) return setError("Dê um nome (ex.: Netflix, Notebook 10x).");
    if (value <= 0) return setError("Informe o valor de cada cobrança.");
    if (isInstallment && !computedEnd) return setError("Informe o número de parcelas ou a data da última parcela.");
    if (computedEnd && computedEnd < d.start_date) return setError("A data final precisa ser depois da primeira cobrança.");
    setBusy(true);
    setError(null);
    try {
      await onSave({
        ...d,
        name: d.name.trim(),
        amount: value,
        day: Number(d.start_date.slice(8, 10)) || d.day,
        end_date: computedEnd ?? null,
        installments: isInstallment && endMode === "parcelas" ? d.installments : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }

  return (
    <Modal title={draft.id ? "Editar recorrência" : "Nova recorrência"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex rounded-xl bg-canvas p-1">
          {(["assinatura", "parcelado"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setD({ ...d, kind: k, category: k === "assinatura" ? "assinaturas" : d.category === "assinaturas" ? "compras" : d.category, installments: k === "parcelado" ? d.installments ?? 10 : null })}
              className={clsx("flex-1 rounded-lg py-2 text-[13px] font-semibold", d.kind === k ? "bg-surface text-violet shadow-sm" : "text-ink-3")}
            >
              {k === "assinatura" ? "Assinatura / conta fixa" : "Compra parcelada"}
            </button>
          ))}
        </div>

        <Field label="Nome" htmlFor="rec-name">
          <input id="rec-name" autoFocus maxLength={80} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder={isInstallment ? "Ex.: Notebook Dell" : "Ex.: Netflix"} className="input" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={isInstallment ? "Valor da parcela (R$)" : "Valor mensal (R$)"} htmlFor="rec-amount">
            <input id="rec-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="input" />
          </Field>
          <Field label="Categoria" htmlFor="rec-cat">
            <select id="rec-cat" value={d.category} onChange={(e) => setD({ ...d, category: e.target.value as CategoryKey })} className="input">
              {CATS.map((k) => (
                <option key={k} value={k}>
                  {categories[k].label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={isInstallment ? "Primeira parcela" : "Primeira cobrança"} htmlFor="rec-start" hint="O dia desta data vira o dia de cobrança todo mês.">
          <input id="rec-start" type="date" value={d.start_date} onChange={(e) => setD({ ...d, start_date: e.target.value })} className="input" />
        </Field>

        {isInstallment ? (
          <fieldset className="space-y-2">
            <legend className="mb-1 text-[13px] font-medium text-ink-2">Término do pagamento</legend>
            <div className="flex gap-2">
              {(["parcelas", "data"] as const).map((m) => (
                <button type="button" key={m} onClick={() => setEndMode(m)} className={clsx("rounded-full px-3 py-1.5 text-[12px] font-semibold", endMode === m ? "bg-violet text-white" : "bg-canvas text-ink-2")}>
                  {m === "parcelas" ? "Nº de parcelas" : "Data da última parcela"}
                </button>
              ))}
            </div>
            {endMode === "parcelas" ? (
              <input
                aria-label="Número de parcelas"
                type="number"
                min={1}
                max={120}
                value={d.installments ?? ""}
                onChange={(e) => setD({ ...d, installments: Math.max(1, Math.min(120, Number(e.target.value) || 1)) })}
                className="input"
              />
            ) : (
              <input aria-label="Data da última parcela" type="date" value={d.end_date ?? ""} onChange={(e) => setD({ ...d, end_date: e.target.value || null })} className="input" />
            )}
            {computedEnd && (
              <p className="text-[12px] text-ink-3">
                Última parcela em <b className="text-ink-2">{monthYear(computedEnd)}</b>
                {parse(amount) > 0 && endMode === "parcelas" && d.installments ? (
                  <>
                    {" "}
                    · total de <b className="text-ink-2">{money(parse(amount) * d.installments)}</b>
                  </>
                ) : null}
              </p>
            )}
          </fieldset>
        ) : (
          <Field label="Termina em (opcional)" htmlFor="rec-end" hint="Deixe em branco se não tem data para acabar.">
            <input id="rec-end" type="date" value={d.end_date ?? ""} onChange={(e) => setD({ ...d, end_date: e.target.value || null })} className="input" />
          </Field>
        )}

        {error && <p className="rounded-xl bg-pink-soft px-3 py-2 text-[13px] text-pink">{error}</p>}

        <div className="flex items-center gap-2 pt-1">
          {onDelete &&
            (confirm ? (
              <span className="flex items-center gap-2 text-[13px]">
                Excluir?
                <button type="button" onClick={onDelete} className="rounded-xl bg-pink px-3 py-2 font-semibold text-white">
                  Sim
                </button>
                <button type="button" onClick={() => setConfirm(false)} className="px-2 py-2 font-semibold text-ink-3">
                  Não
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirm(true)} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-3 hover:bg-pink-soft hover:text-pink">
                <Trash2 size={14} /> Excluir
              </button>
            ))}
          <button disabled={busy} className="ml-auto h-11 rounded-xl bg-lime px-6 text-[14px] font-bold text-ink hover:brightness-95 disabled:opacity-60">
            {busy ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
