import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { Nivi } from "@/components/brand";
import { GoalIcon, goalIcons, type GoalIconKey } from "@/components/icons";
import { Progress } from "@/components/ui";
import { useFinance, type Goal, type GoalInput } from "@/lib/finance";
import { money, moneyShort } from "@/lib/format";
import { removePhoto, uploadPhoto } from "@/lib/photos";

export const Route = createFileRoute("/metas")({
  component: Goals,
});

const COLORS = ["#6a00ff", "#ff007a", "#ff6b00", "#00a3b8", "#12b76a", "#7ab800", "#0b0630"];

const fmtDate = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "Sem prazo";

/** Quanto guardar por mês para chegar no prazo. */
function monthlyNeeded(g: Goal) {
  if (!g.due_date || g.current >= g.target) return null;
  const now = new Date();
  const due = new Date(`${g.due_date}T12:00:00`);
  const months = Math.max(1, (due.getFullYear() - now.getFullYear()) * 12 + due.getMonth() - now.getMonth());
  return (g.target - g.current) / months;
}

function Goals() {
  const { goals, canEdit, saveGoal, deleteGoal } = useFinance();
  const [editing, setEditing] = useState<GoalInput | null>(null);
  const [deposit, setDeposit] = useState<Goal | null>(null);

  const saved = goals.reduce((a, g) => a + g.current, 0);
  const target = goals.reduce((a, g) => a + g.target, 0);
  const focus = goals.find((g) => g.priority && g.current < g.target) ?? goals.find((g) => g.current < g.target);
  const focusMonthly = focus ? monthlyNeeded(focus) : null;

  const newGoal = (): GoalInput => ({
    name: "",
    target: 0,
    current: 0,
    due_date: null,
    icon: "sonho",
    color: COLORS[goals.length % COLORS.length],
    priority: goals.length === 0,
  });

  return (
    <>
      <PageHeader
        title="Metas"
        subtitle={goals.length ? `${goals.length} ${goals.length === 1 ? "meta ativa" : "metas ativas"}` : "Comece sua primeira meta"}
        actions={
          canEdit && (
            <button
              onClick={() => setEditing(newGoal())}
              className="flex h-10 items-center gap-1.5 rounded-xl bg-violet px-3.5 text-[14px] font-bold text-white hover:brightness-110"
            >
              <Plus size={17} /> Nova meta
            </button>
          )
        }
      />

      {!canEdit && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          Estas são metas de exemplo.{" "}
          <Link to="/entrar" className="font-semibold underline">
            Entre na sua conta
          </Link>{" "}
          para criar as suas.
        </p>
      )}

      {goals.length > 0 && (
        <div className="nivo-gradient rise relative mb-5 overflow-hidden rounded-[22px] p-6 text-white">
          <Nivi className="absolute -right-2 -bottom-4 hidden size-36 opacity-95 sm:block" />
          <p className="text-[13px] text-white/70">Total guardado em metas</p>
          <p className="mt-1 text-[32px] font-bold tracking-[-0.035em]">
            <Money>{moneyShort(saved)}</Money>
            <span className="text-[16px] font-medium text-white/60">
              {" "}
              de <Money>{moneyShort(target)}</Money>
            </span>
          </p>
          <Progress value={(saved / target) * 100} color="#b8ff00" className="mt-4 max-w-lg bg-surface/15" />
          {focus && (
            <p className="mt-3 max-w-lg text-[13px] text-white/80">
              <b className="text-lime">Dica do Nivi:</b> foque em <b>{focus.name}</b>. Faltam{" "}
              <Money>{moneyShort(focus.target - focus.current)}</Money>
              {focusMonthly ? (
                <>
                  {" "}
                  — guardando <Money>{moneyShort(Math.ceil(focusMonthly))}</Money> por mês você chega no prazo.
                </>
              ) : (
                "."
              )}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((g, i) => {
          const p = Math.min(100, (g.current / g.target) * 100);
          const done = g.current >= g.target;
          const perMonth = monthlyNeeded(g);
          return (
            <article key={g.id} className="card rise flex flex-col overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
              {g.photo_url && (
                <div className="relative h-36">
                  <img src={g.photo_url} alt="" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
              <div className="flex items-start justify-between gap-2">
                <GoalIcon k={g.icon} color={g.color} />
                <div className="flex items-center gap-1">
                  {done ? (
                    <span className="rounded-full bg-positive-soft px-2.5 py-0.5 text-[11px] font-bold text-positive">Concluída</span>
                  ) : (
                    g.priority && <span className="rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-ink">Prioridade</span>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setEditing(g)}
                      className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink"
                      aria-label={`Editar ${g.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                </div>
              </div>
              <h2 className="mt-4 text-[17px] font-bold tracking-[-0.02em]">{g.name}</h2>
              <p className="text-[12px] text-ink-3">Prazo · {fmtDate(g.due_date)}</p>
              <p className="mt-4 text-[22px] font-bold tracking-[-0.03em]">
                <Money>{moneyShort(g.current)}</Money>
                <span className="text-[13px] font-medium text-ink-3">
                  {" "}
                  / <Money>{moneyShort(g.target)}</Money>
                </span>
              </p>
              <Progress value={p} color={g.color} className="mt-3" />
              <div className="mt-2 flex justify-between text-[12px]">
                <span className="text-ink-3">
                  {done ? (
                    "Meta alcançada!"
                  ) : (
                    <>
                      Faltam <Money>{moneyShort(g.target - g.current)}</Money>
                    </>
                  )}
                </span>
                <span className="font-semibold" style={{ color: g.color }}>
                  {Math.round(p)}%
                </span>
              </div>
              {perMonth && (
                <p className="mt-2 text-[12px] text-ink-2">
                  Guarde <Money className="font-semibold">{money(Math.ceil(perMonth))}</Money> por mês
                </p>
              )}
              {canEdit && !done && (
                <button
                  onClick={() => setDeposit(g)}
                  className="mt-4 rounded-xl bg-canvas py-2 text-[13px] font-semibold text-ink-2 hover:bg-violet-soft hover:text-violet"
                >
                  + Guardar dinheiro
                </button>
              )}
              </div>
            </article>
          );
        })}

        {canEdit && (
          <button
            onClick={() => setEditing(newGoal())}
            className="rise flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-line text-ink-3 transition-colors hover:border-violet hover:text-violet"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-soft text-violet">
              <Plus size={22} />
            </span>
            <span className="text-[14px] font-semibold">Criar nova meta</span>
          </button>
        )}
      </div>

      {editing && (
        <GoalModal
          goal={editing}
          onClose={() => setEditing(null)}
          onSave={async (g) => {
            await saveGoal(g);
            setEditing(null);
          }}
          onDelete={
            editing.id
              ? async () => {
                  await deleteGoal(editing.id!);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
      {deposit && (
        <DepositModal
          goal={deposit}
          onClose={() => setDeposit(null)}
          onSave={async (amount) => {
            const { id, ...rest } = deposit;
            await saveGoal({ ...rest, id, current: Math.max(0, deposit.current + amount) });
            setDeposit(null);
          }}
        />
      )}
    </>
  );
}

/* ───────── Modais ───────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="rise relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[19px] font-bold tracking-[-0.02em]">{title}</h2>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full bg-canvas" aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const parseMoney = (v: string) => Number(v.replace(/\./g, "").replace(",", ".")) || 0;
const showMoney = (n: number) => (n ? n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : "");

function GoalModal({
  goal,
  onClose,
  onSave,
  onDelete,
}: {
  goal: GoalInput;
  onClose: () => void;
  onSave: (g: GoalInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [g, setG] = useState(goal);
  const [target, setTarget] = useState(showMoney(goal.target));
  const [current, setCurrent] = useState(showMoney(goal.current));
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(goal.photo_url ?? null);
  const [dropPhoto, setDropPhoto] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = parseMoney(target);
    if (!g.name.trim()) return setError("Dê um nome para a meta.");
    if (t <= 0) return setError("Informe quanto você quer juntar.");
    setBusy(true);
    setError(null);
    try {
      const oldPath = goal.photo_path ?? null;
      let photo_path = oldPath;
      if (photoFile) photo_path = await uploadPhoto(photoFile, "metas");
      else if (dropPhoto) photo_path = null;
      await onSave({ ...g, name: g.name.trim(), target: t, current: parseMoney(current), photo_path });
      if (oldPath && oldPath !== photo_path) await removePhoto(oldPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }

  return (
    <Modal title={goal.id ? "Editar meta" : "Nova meta"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nome da meta" htmlFor="goal-name">
          <input
            id="goal-name"
            autoFocus
            value={g.name}
            maxLength={80}
            onChange={(e) => setG({ ...g, name: e.target.value })}
            placeholder="Ex.: Viagem para o Chile"
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quero juntar (R$)" htmlFor="goal-target">
            <input id="goal-target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="15.000" className="input" />
          </Field>
          <Field label="Já tenho (R$)" htmlFor="goal-current">
            <input id="goal-current" inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" className="input" />
          </Field>
        </div>

        <Field label="Prazo (opcional)" htmlFor="goal-due">
          <input
            id="goal-due"
            type="date"
            value={g.due_date ?? ""}
            onChange={(e) => setG({ ...g, due_date: e.target.value || null })}
            className="input"
          />
        </Field>

        <div>
          <span className="mb-1 block text-[13px] font-medium text-ink-2">Foto de capa (opcional)</span>
          {preview ? (
            <div className="relative h-32 overflow-hidden rounded-xl">
              <img src={preview} alt="Prévia da capa" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setPhotoFile(null);
                  setDropPhoto(true);
                }}
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/55 text-white hover:bg-black/70"
                aria-label="Remover foto"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line text-[13px] text-ink-3 hover:border-violet hover:text-violet">
              <ImagePlus size={20} />
              Escolher foto (ex.: o lugar da viagem)
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setPhotoFile(f);
                  setPreview(URL.createObjectURL(f));
                  setDropPhoto(false);
                }}
              />
            </label>
          )}
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Ícone</legend>
          <div className="grid grid-cols-8 gap-2">
            {(Object.keys(goalIcons) as GoalIconKey[]).map((k) => {
              const Icon = goalIcons[k].icon;
              const active = g.icon === k;
              return (
                <button
                  type="button"
                  key={k}
                  title={goalIcons[k].label}
                  aria-label={goalIcons[k].label}
                  aria-pressed={active}
                  onClick={() => setG({ ...g, icon: k })}
                  className={clsx(
                    "grid aspect-square place-items-center rounded-xl transition-colors",
                    active ? "text-white" : "bg-canvas text-ink-2 hover:bg-line",
                  )}
                  style={active ? { background: g.color } : undefined}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Cor</legend>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={`Cor ${c}`}
                aria-pressed={g.color === c}
                onClick={() => setG({ ...g, color: c })}
                className={clsx("size-8 rounded-full ring-offset-2 transition", g.color === c && "ring-2 ring-ink")}
                style={{ background: c }}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-canvas px-4 py-3">
          <input type="checkbox" checked={g.priority} onChange={(e) => setG({ ...g, priority: e.target.checked })} className="size-4 accent-violet" />
          <Star size={16} className="text-violet" />
          <span className="text-[14px] font-medium">Meta prioritária</span>
        </label>

        {error && <p className="rounded-xl bg-pink-soft px-3 py-2 text-[13px] text-pink">{error}</p>}

        <div className="flex items-center gap-2 pt-1">
          {onDelete &&
            (confirmDelete ? (
              <span className="flex items-center gap-2 text-[13px]">
                Excluir?
                <button type="button" onClick={onDelete} className="rounded-xl bg-pink px-3 py-2 font-semibold text-white">
                  Sim, excluir
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-2 font-semibold text-ink-3">
                  Não
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-3 hover:bg-pink-soft hover:text-pink"
              >
                <Trash2 size={14} /> Excluir
              </button>
            ))}
          <button disabled={busy} className="ml-auto h-11 rounded-xl bg-lime px-6 text-[14px] font-bold text-ink hover:brightness-95 disabled:opacity-60">
            {busy ? "Salvando…" : "Salvar meta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DepositModal({ goal, onClose, onSave }: { goal: Goal; onClose: () => void; onSave: (amount: number) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [withdraw, setWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const missing = goal.target - goal.current;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseMoney(value);
    if (v <= 0) return setError("Informe um valor.");
    setBusy(true);
    try {
      await onSave(withdraw ? -v : v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setBusy(false);
    }
  }

  return (
    <Modal title={goal.name} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex rounded-xl bg-canvas p-1">
          {[false, true].map((w) => (
            <button
              type="button"
              key={String(w)}
              onClick={() => setWithdraw(w)}
              className={clsx("flex-1 rounded-lg py-2 text-[13px] font-semibold", withdraw === w ? "bg-surface text-violet shadow-sm" : "text-ink-3")}
            >
              {w ? "Retirar" : "Guardar"}
            </button>
          ))}
        </div>
        <Field label="Valor (R$)" htmlFor="deposit-value">
          <input id="deposit-value" autoFocus inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="250" className="input" />
        </Field>
        {!withdraw && missing > 0 && (
          <div className="flex flex-wrap gap-2">
            {[50, 100, 250, 500].filter((v) => v < missing).map((v) => (
              <button type="button" key={v} onClick={() => setValue(String(v))} className="rounded-full bg-violet-soft px-3 py-1.5 text-[12px] font-semibold text-violet">
                R$ {v}
              </button>
            ))}
            <button type="button" onClick={() => setValue(showMoney(missing))} className="rounded-full bg-lime-soft px-3 py-1.5 text-[12px] font-semibold text-lime-ink">
              Completar ({moneyShort(missing)})
            </button>
          </div>
        )}
        {error && <p className="rounded-xl bg-pink-soft px-3 py-2 text-[13px] text-pink">{error}</p>}
        <button disabled={busy} className="h-11 w-full rounded-xl bg-lime text-[14px] font-bold text-ink hover:brightness-95 disabled:opacity-60">
          {busy ? "Salvando…" : withdraw ? "Retirar da meta" : "Guardar na meta"}
        </button>
      </form>
    </Modal>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
      {children}
    </label>
  );
}
