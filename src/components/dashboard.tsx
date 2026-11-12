import { ClientOnly, Link } from "@tanstack/react-router";
import clsx from "clsx";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plane,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  categories,
  distribution,
  emergency,
  goals,
  investments,
  invoices,
  month,
  niviInsights,
  pace,
  recurrences,
  spendingCurve,
} from "@/lib/data";
import { money, moneyShort, splitMoney } from "@/lib/format";
import { Money } from "./app-shell";
import { Nivi } from "./brand";
import { Card, Delta, Progress } from "./ui";

const ChartFallback = ({ h }: { h: number }) => <div style={{ height: h }} className="animate-pulse rounded-xl bg-canvas" />;

function BigMoney({ value, className }: { value: number; className?: string }) {
  const { main, cents } = splitMoney(value);
  return (
    <Money className={clsx("font-bold tracking-[-0.035em]", className)}>
      {main}
      <span className="opacity-60">{cents}</span>
    </Money>
  );
}

/* ───────────────── Gastos no mês + Resumo (Nivi) ───────────────── */
export function SpendingCard() {
  const { diff, perDay } = pace;
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % niviInsights.length), 6000);
    return () => clearInterval(id);
  }, []);

  const insight = niviInsights[slide];

  return (
    <section className="rise flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[var(--shadow-card)] ring-2 ring-violet">
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="text-[14px] font-medium text-ink-2">Gastos no mês</h2>
        <p className="mt-1 flex items-baseline gap-1.5">
          <BigMoney value={month.spent} className="text-[30px]" />
          <Money className="text-[15px] font-medium text-ink-3">/ {moneyShort(month.budget)}</Money>
        </p>

        <div className="relative mt-2 min-h-[132px] flex-1">
          <ClientOnly fallback={<ChartFallback h={132} />}>
            <ResponsiveContainer width="100%" height="100%" minHeight={132}>
              <LineChart data={spendingCurve} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
                <defs>
                  <linearGradient id="spendStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#12b76a" />
                    <stop offset="70%" stopColor="#8fd400" />
                    <stop offset="100%" stopColor="#ff6b00" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <Tooltip
                  cursor={{ stroke: "#e9e8f5" }}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e9e8f5", fontSize: 12 }}
                  labelFormatter={(d) => `Dia ${d}`}
                  formatter={(v, n) => [money(Number(v)), n === "real" ? "Gasto" : "Orçamento"]}
                />
                <Line dataKey="ideal" stroke="#c9c6dc" strokeDasharray="4 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                <Line dataKey="real" stroke="url(#spendStroke)" strokeWidth={3.5} dot={false} connectNulls={false} strokeLinecap="round" />
                <ReferenceDot x={month.dayOfMonth} y={month.spent} r={6} fill="#fff" stroke="#12b76a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ClientOnly>
          <span
            className={clsx(
              "absolute top-[22%] -translate-x-full whitespace-nowrap rounded-lg px-2 py-1 text-[12px] font-semibold text-white shadow-md",
              diff >= 0 ? "bg-positive" : "bg-pink",
            )}
            style={{ left: `${(month.dayOfMonth / month.daysInMonth) * 100 - 6}%` }}
          >
            <Money>{moneyShort(Math.abs(diff))}</Money> {diff >= 0 ? "abaixo" : "acima"}
          </span>
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2">
          Mantenha os gastos em até
          <span className="inline-flex items-center gap-1 rounded-lg bg-violet-soft px-2 py-0.5 font-semibold text-violet">
            <CalendarDays size={13} />
            <Money>{money(perDay)}</Money>
          </span>
          por dia
        </p>
      </div>

      {/* Resumo do mês — carrossel de insights do Nivi */}
      <div className="nivo-gradient px-5 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
            <Nivi className="size-8" sparkle={false} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Resumo do Mês</p>
            <p key={slide} className="rise truncate text-[12px] text-white/75" title={insight.text}>
              {insight.title}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSlide((s) => (s - 1 + niviInsights.length) % niviInsights.length)}
              className="grid size-6 place-items-center rounded-full hover:bg-white/15"
              aria-label="Insight anterior"
            >
              <ChevronLeft size={15} />
            </button>
            {niviInsights.map((_, i) => (
              <span
                key={i}
                className={clsx("h-1.5 rounded-full transition-all", i === slide ? "w-5 bg-lime" : "w-1.5 bg-white/40")}
              />
            ))}
            <button
              onClick={() => setSlide((s) => (s + 1) % niviInsights.length)}
              className="grid size-6 place-items-center rounded-full hover:bg-white/15"
              aria-label="Próximo insight"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────── Distribuição de gastos ───────────────── */
function Donut({ data, size = 200, stroke = 26 }: { data: { value: number; color: string }[]; size?: number; stroke?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 4;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f0f8" strokeWidth={stroke} />
      {data.map((d, i) => {
        const len = (d.value / total) * c;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
}

export function DistributionCard() {
  const total = distribution.reduce((a, d) => a + d.value, 0);
  return (
    <Card title="Distribuição de Gastos" delay={60} className="h-full">
      <div className="grid items-center gap-6 sm:grid-cols-[200px_1fr] md:gap-8">
        <div className="relative mx-auto size-[200px]">
          <Donut data={distribution.map((d) => ({ value: d.value, color: categories[d.key].color }))} />
          <div className="absolute inset-0 grid place-content-center text-center">
            <span className="text-[12px] text-ink-3">Gasto total</span>
            <Money className="text-[22px] font-bold tracking-[-0.03em]">{moneyShort(total)}</Money>
          </div>
        </div>

        <ul className="divide-y divide-line/70">
          {distribution.map((d) => {
            const cat = categories[d.key];
            const share = (d.value / total) * 100;
            const over = d.limit !== undefined && d.value > d.limit;
            const near = d.limit !== undefined && !over && d.value / d.limit > 0.9;
            return (
              <li key={d.key} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg text-[15px]" style={{ background: cat.soft }}>
                  {cat.emoji}
                </span>
                <span className="text-[14px] font-medium">{cat.label}</span>
                <span className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-3 tabular">
                  {share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                </span>
                <span className="ml-auto flex items-center gap-1 text-[14px] font-semibold">
                  <Money className={clsx(over && "text-pink", near && "text-orange")}>{moneyShort(d.value)}</Money>
                  {d.limit !== undefined && (
                    <Money className="font-normal text-ink-3">/ {moneyShort(d.limit)}</Money>
                  )}
                  {d.trend === "up" && <TrendingUp size={15} className="text-pink" />}
                  {d.trend === "down" && <TrendingDown size={15} className="text-positive" />}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Card>
  );
}

/* ───────────────── Resultado parcial ───────────────── */
export function ResultCard() {
  return (
    <Card title="Resultado Parcial" delay={120}>
      <p className="flex items-center gap-2">
        <BigMoney value={month.result} className="text-[26px]" />
        <Delta value={month.resultChange} />
      </p>
      <p className="mt-0.5 text-[13px] text-ink-3">
        vs <Money>{moneyShort(month.prevResult)}</Money> mês anterior
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-positive-soft/60 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-positive">
            <ArrowDownCircle size={15} /> Entradas
          </p>
          <Money className="mt-1 block text-[15px] font-bold">{moneyShort(month.income)}</Money>
        </div>
        <div className="rounded-2xl bg-pink-soft/60 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-pink">
            <ArrowUpCircle size={15} /> Saídas
          </p>
          <Money className="mt-1 block text-[15px] font-bold">{moneyShort(month.expenses)}</Money>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────── Investimentos ───────────────── */
export function InvestmentsCard() {
  return (
    <Card title="Investimentos" delay={160} className="flex flex-col">
      <p className="flex items-center gap-2">
        <Money className="text-[26px] font-bold tracking-[-0.035em]">{moneyShort(investments.total)}</Money>
        <Delta value={investments.change} />
      </p>
      <div className="-mx-2 mt-3 h-[150px]">
        <ClientOnly fallback={<ChartFallback h={150} />}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={investments.series} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="invFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6a00ff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#6a00ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" axisLine={false} tickLine={false} interval={0} padding={{ left: 12, right: 12 }} tick={{ fontSize: 11, fill: "#8b88a6" }} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e9e8f5", fontSize: 12 }}
                formatter={(v) => [money(Number(v)), "Patrimônio"]}
              />
              <Area type="monotone" dataKey="v" stroke="#6a00ff" strokeWidth={3} fill="url(#invFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </ClientOnly>
      </div>
      <p className="mt-3 text-[13px] text-ink-2">
        Patrimônio <Money className="font-semibold text-positive">+{moneyShort(investments.weekGain)}</Money> esta semana
      </p>
    </Card>
  );
}

/* ───────────────── Reserva de emergência ───────────────── */
function Gauge({ value }: { value: number }) {
  // arco de 240°
  const r = 42;
  const c = 2 * Math.PI * r;
  const arc = c * (240 / 360);
  return (
    <svg viewBox="0 0 100 100" className="size-full rotate-[150deg]">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#efeef7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${arc} ${c}`} />
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${arc * value} ${c}`}
      />
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b8ff00" />
          <stop offset="1" stopColor="#12b76a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function EmergencyCard() {
  const months = emergency.current / emergency.monthlyCost;
  const ratio = emergency.current / emergency.target;
  return (
    <Card title="Reserva de Emergência" delay={200}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] text-ink-3">
            <ShieldCheck size={14} className="text-positive" /> Proteção
          </p>
          <p className="text-[28px] font-bold tracking-[-0.035em]">
            {months} {months === 1 ? "Mês" : "Meses"}
          </p>
          <p className="text-[12px] text-ink-3">
            <Money>{moneyShort(emergency.current)}</Money> / <Money>{moneyShort(emergency.target)}</Money>
          </p>
        </div>
        <div className="relative size-[104px] shrink-0">
          <Gauge value={ratio} />
          <span className="absolute inset-0 grid place-items-center text-[18px] font-bold text-ink">
            {Math.round(ratio * 100)}%
          </span>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────── Próximas recorrências ───────────────── */
export function RecurrencesCard() {
  return (
    <Card
      title="Próximas recorrências"
      delay={240}
      action={
        <Link to="/recorrencias" className="text-[12px] font-semibold text-violet hover:underline">
          Ver todas
        </Link>
      }
    >
      <ul className="divide-y divide-line/70">
        {recurrences.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-2.5">
            <ArrowUpCircle size={16} className="shrink-0 text-pink" />
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold text-white"
              style={{ background: r.color }}
            >
              {r.initial}
            </span>
            <span className="flex-1 text-[14px] font-medium">{r.name}</span>
            <Money className="text-[14px] font-semibold">{money(r.amount)}</Money>
            <span className="w-11 text-right text-[12px] text-ink-3 tabular">{r.date}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ───────────────── Faturas ───────────────── */
export function InvoicesCard() {
  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Faturas
          <span className="grid size-4 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">!</span>
        </span>
      }
      delay={280}
      action={<span className="text-[12px] text-ink-3">vence {invoices.dueDate}</span>}
    >
      <div className="flex items-center gap-3">
        <BigMoney value={invoices.total} className="text-[26px]" />
        <div className="flex -space-x-1.5">
          {invoices.cards.map((c) => (
            <span
              key={c.name}
              title={`${c.name}: ${money(c.amount)}`}
              className="grid h-5 w-7 place-items-center rounded-[5px] text-[9px] font-bold text-white ring-2 ring-white"
              style={{ background: c.color }}
            >
              {c.name[0]}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full">
        {invoices.cards.map((c) => (
          <span key={c.name} style={{ flex: c.amount, background: c.color }} />
        ))}
      </div>
      <p className="mt-3 text-[13px] text-ink-2">
        Saldo após pagamento <Money className="font-semibold text-ink">{money(invoices.balanceAfter)}</Money>
      </p>
    </Card>
  );
}

/* ───────────────── Metas ───────────────── */
export function GoalsCard() {
  const g = goals[0];
  const pctDone = (g.current / g.target) * 100;
  return (
    <Card
      title="Metas"
      delay={320}
      className="flex flex-col"
      action={
        <Link to="/metas" className="text-[12px] font-semibold text-violet hover:underline">
          Ver todas
        </Link>
      }
    >
      <div className="relative mb-4 flex-1 overflow-hidden rounded-2xl nivo-gradient p-4 text-white">
        {/* montanhas decorativas */}
        <svg viewBox="0 0 300 120" className="absolute inset-x-0 bottom-0 w-full opacity-90" preserveAspectRatio="none" aria-hidden>
          <path d="M0 120 L60 55 L95 85 L150 30 L205 80 L245 50 L300 95 L300 120 Z" fill="#8b2bff" opacity=".55" />
          <path d="M0 120 L45 85 L110 110 L170 70 L230 105 L300 80 L300 120 Z" fill="#b8ff00" opacity=".9" />
        </svg>
        <Plane className="absolute top-4 right-4 rotate-12 text-lime" size={26} />
        <div className="relative">
          {g.priority && (
            <span className="rounded-full bg-lime px-2.5 py-0.5 text-[11px] font-bold text-ink">Prioridade</span>
          )}
          <p className="mt-3 text-[18px] font-bold tracking-[-0.02em]">{g.name}</p>
          <p className="text-[12px] text-white/75">Previsão de conclusão · {g.due}</p>
          <div className="h-12" />
        </div>
      </div>
      <Progress value={pctDone} color="linear-gradient(90deg,#6a00ff,#9d5cff)" />
      <div className="mt-2 flex justify-between text-[12px] text-ink-3">
        <Money>{moneyShort(g.current)}</Money>
        <span className="font-semibold text-violet">{Math.round(pctDone)}%</span>
        <Money>{moneyShort(g.target)}</Money>
      </div>
    </Card>
  );
}

/* ───────────────── Saudação do Nivi ───────────────── */
export function NiviGreeting() {
  return (
    <div className="rise relative mb-5 flex items-center gap-4 overflow-hidden rounded-[22px] bg-gradient-to-r from-violet-soft via-white to-lime-soft p-4 pr-5 ring-1 ring-line sm:p-5">
      <span className="nivo-gradient grid size-14 shrink-0 place-items-center rounded-2xl">
        <Nivi className="size-12" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold tracking-[-0.02em]">Oi, Richard! Eu sou o Nivi 👋</p>
        <p className="text-[13px] text-ink-2">
          Analisei suas finanças: você está{" "}
          <b className="text-positive">
            <Money>{moneyShort(pace.diff)}</Money> abaixo
          </b>{" "}
          do ritmo do orçamento, mas o delivery já passou do limite.
        </p>
      </div>
      <div className="hidden text-right md:block">
        <p className="text-[12px] text-ink-3">Saldo atual</p>
        <p className="flex items-center gap-2">
          <BigMoney value={month.balance} className="text-[22px]" />
          <Delta value={month.balanceChange} />
        </p>
      </div>
    </div>
  );
}
