import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { CalendarClock, CreditCard, Lock } from "lucide-react";
import { Money, PageHeader } from "@/components/app-shell";
import { BankLogo } from "@/components/bank-logo";
import { CategoryIcon } from "@/components/icons";
import { Progress } from "@/components/ui";
import { useFinance, type InvoiceCard } from "@/lib/finance";
import { money } from "@/lib/format";

export const Route = createFileRoute("/faturas")({
  component: Invoices,
});

const fmt = (iso: string | null) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—";

function daysUntil(iso: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00`);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 864e5);
}

function Invoices() {
  const { summary, mode, transactions } = useFinance();
  const { cards, total } = summary.invoices;
  const next = [...cards].filter((c) => c.dueDate).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))[0];
  const nextDays = next ? daysUntil(next.dueDate) : null;

  return (
    <>
      <PageHeader title="Faturas" subtitle="Cartões de crédito conectados" />

      {mode === "demo" && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          Exemplo.{" "}
          <Link to="/contas" className="font-semibold underline">
            Conecte seus cartões
          </Link>{" "}
          para ver as faturas reais com o logo de cada banco.
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Total em faturas</p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(total)}</Money>
          <div className="mt-2 flex -space-x-1.5">
            {cards.map((c) => (
              <BankLogo key={c.id} name={c.bank} logo={c.logo} color={c.color} size="xs" />
            ))}
          </div>
        </div>
        <div className={clsx("card rise p-5", nextDays != null && nextDays <= 3 && "ring-2 ring-orange/50")}>
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <CalendarClock size={14} className="text-orange" /> Próximo vencimento
          </p>
          <p className="mt-1 text-[24px] font-bold tracking-[-0.03em]">{next ? fmt(next.dueDate) : "—"}</p>
          <p className="text-[12px] text-ink-3">
            {next ? `${next.bank} · ${nextDays === 0 ? "vence hoje" : nextDays! < 0 ? "vencida" : `em ${nextDays} dias`}` : "sem faturas"}
          </p>
        </div>
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Saldo após pagar tudo</p>
          <Money className={clsx("mt-1 block text-[24px] font-bold tracking-[-0.03em]", summary.invoices.balanceAfter < 0 && "text-pink")}>
            {money(summary.invoices.balanceAfter)}
          </Money>
          <p className="text-[12px] text-ink-3">saldo em conta − faturas</p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="card rise flex flex-col items-center px-6 py-14 text-center">
          <CreditCard size={34} className="text-violet" />
          <p className="mt-3 text-[15px] font-semibold">Nenhum cartão de crédito conectado</p>
          <Link to="/contas" className="mt-4 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-ink">
            Conectar cartão
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {cards.map((c) => (
            <CardInvoice key={c.id} card={c} recent={transactions.filter((t) => t.account === c.name && t.amount < 0).slice(0, 5)} />
          ))}
        </div>
      )}
    </>
  );
}

function CardInvoice({ card, recent }: { card: InvoiceCard; recent: ReturnType<typeof useFinance>["transactions"] }) {
  const days = daysUntil(card.dueDate);
  const used = card.limit ? (card.limit - (card.available ?? card.limit - card.amount)) / card.limit : null;
  return (
    <article className="card rise overflow-hidden">
      <header className="flex items-center gap-3 p-5 pb-4" style={{ background: `linear-gradient(135deg, ${card.color}26, transparent 70%)` }}>
        <BankLogo name={card.bank} logo={card.logo} color={card.color} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-ink-3">{card.bank}</p>
          <h2 className="truncate text-[16px] font-bold">{card.name}</h2>
        </div>
        {days != null && (
          <span
            className={clsx(
              "rounded-full px-2.5 py-1 text-[11px] font-bold",
              days < 0 ? "bg-pink text-white" : days <= 3 ? "bg-orange-soft text-orange" : "bg-canvas text-ink-2",
            )}
          >
            {days < 0 ? "Vencida" : days === 0 ? "Vence hoje" : `Vence em ${days}d`}
          </span>
        )}
      </header>
      <div className="px-5 pb-5">
        <p className="text-[12px] text-ink-3">Fatura atual</p>
        <Money className="block text-[28px] font-bold tracking-[-0.035em]">{money(card.amount)}</Money>
        <dl className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
          <div>
            <dt className="text-ink-3">Fecha</dt>
            <dd className="font-semibold">{fmt(card.closeDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Vence</dt>
            <dd className="font-semibold">{fmt(card.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-3">Mínimo</dt>
            <dd className="font-semibold">{card.minimum != null ? <Money>{money(card.minimum)}</Money> : "—"}</dd>
          </div>
        </dl>
        {card.limit != null && used != null && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[12px] text-ink-3">
              <span className="flex items-center gap-1">
                <Lock size={11} /> Limite usado
              </span>
              <span>
                <Money>{money(card.limit - (card.available ?? 0))}</Money> de <Money>{money(card.limit)}</Money>
              </span>
            </div>
            <Progress value={used * 100} color={used > 0.8 ? "var(--color-pink)" : card.color} />
          </div>
        )}
        {recent.length > 0 && (
          <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
            {recent.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <CategoryIcon k={t.category} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{t.description}</span>
                <Money className="text-[13px] font-semibold">{money(-t.amount)}</Money>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
