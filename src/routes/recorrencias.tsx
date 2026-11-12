import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Repeat } from "lucide-react";
import { Money, PageHeader } from "@/components/app-shell";
import { CategoryIcon } from "@/components/icons";
import { categories } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { money } from "@/lib/format";

export const Route = createFileRoute("/recorrencias")({
  component: Recurrences,
});

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

function Recurrences() {
  const { recurrences, mode } = useFinance();
  const monthly = recurrences.reduce((a, r) => a + r.amount, 0);
  const next7 = recurrences.filter((r) => (new Date(`${r.next}T12:00:00`).getTime() - Date.now()) / 864e5 <= 7);

  return (
    <>
      <PageHeader title="Recorrências" subtitle="Assinaturas e contas fixas detectadas nas suas transações" />

      {mode === "demo" && (
        <p className="rise mb-4 rounded-2xl bg-violet-soft px-4 py-3 text-[14px] text-violet">
          Exemplo.{" "}
          <Link to="/contas" className="font-semibold underline">
            Conecte um banco
          </Link>{" "}
          para o Nivo detectar suas recorrências automaticamente.
        </p>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="card rise p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <Repeat size={14} className="text-violet" /> Por mês
          </p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(monthly)}</Money>
          <p className="text-[12px] text-ink-3">{recurrences.length} cobranças fixas</p>
        </div>
        <div className="card rise p-5">
          <p className="text-[13px] font-medium text-ink-2">Por ano</p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(monthly * 12)}</Money>
          <p className="text-[12px] text-ink-3">se nada mudar</p>
        </div>
        <div className="card rise p-5">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2">
            <CalendarClock size={14} className="text-orange" /> Próximos 7 dias
          </p>
          <Money className="mt-1 block text-[24px] font-bold tracking-[-0.03em]">{money(next7.reduce((a, r) => a + r.amount, 0))}</Money>
          <p className="text-[12px] text-ink-3">{next7.length} cobranças</p>
        </div>
      </div>

      <div className="card rise px-4 sm:px-6">
        {recurrences.length === 0 ? (
          <p className="py-12 text-center text-[14px] text-ink-3">
            Nenhuma recorrência detectada ainda. Elas aparecem quando o mesmo gasto se repete em 2 meses ou mais.
          </p>
        ) : (
          <ul className="divide-y divide-line/70">
            {recurrences.map((r) => (
              <li key={r.key} className="flex items-center gap-3 py-4">
                <CategoryIcon k={r.category} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold">{r.name}</p>
                  <p className="text-[12px] text-ink-3">
                    {categories[r.category].label} · todo dia {r.day} · visto em {r.months} meses
                  </p>
                </div>
                <div className="text-right">
                  <Money className="block text-[15px] font-bold">{money(r.amount)}</Money>
                  <span className="text-[12px] text-ink-3">próxima {when(r.next)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
