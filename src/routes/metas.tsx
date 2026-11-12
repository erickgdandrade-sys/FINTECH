import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Money, PageHeader } from "@/components/app-shell";
import { Nivi } from "@/components/brand";
import { GoalIcon } from "@/components/icons";
import { Progress } from "@/components/ui";
import { goals } from "@/lib/data";
import { moneyShort } from "@/lib/format";

export const Route = createFileRoute("/metas")({
  component: Goals,
});

function Goals() {
  const saved = goals.reduce((a, g) => a + g.current, 0);
  const target = goals.reduce((a, g) => a + g.target, 0);

  return (
    <>
      <PageHeader title="Metas" subtitle={`${goals.length} metas ativas`} />

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
        <Progress value={(saved / target) * 100} color="#b8ff00" className="mt-4 max-w-lg bg-white/15" />
        <p className="mt-3 max-w-lg text-[13px] text-white/80">
          <b className="text-lime">Dica do Nivi:</b> priorize a Viagem Chile — faltam só R$ 1.000 e ela libera
          R$ 250/semana para as próximas metas.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {goals.map((g, i) => {
          const p = (g.current / g.target) * 100;
          return (
            <article key={g.name} className="card rise p-6" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between">
                <GoalIcon k={g.icon} color={g.color} />
                {g.priority && (
                  <span className="rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-ink">Prioridade</span>
                )}
              </div>
              <h2 className="mt-4 text-[17px] font-bold tracking-[-0.02em]">{g.name}</h2>
              <p className="text-[12px] text-ink-3">Previsão · {g.due}</p>
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
                  Faltam <Money>{moneyShort(g.target - g.current)}</Money>
                </span>
                <span className="font-semibold" style={{ color: g.color }}>
                  {Math.round(p)}%
                </span>
              </div>
            </article>
          );
        })}

        <button className="rise flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-line text-ink-3 transition-colors hover:border-violet hover:text-violet">
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-soft text-violet">
            <Plus size={22} />
          </span>
          <span className="text-[14px] font-semibold">Criar nova meta</span>
        </button>
      </div>
    </>
  );
}
