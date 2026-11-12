import { ClientOnly, Link } from "@tanstack/react-router";
import { BarChart3, CalendarDays, CreditCard, Eye, EyeOff, Sparkles, Target, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useFinance } from "@/lib/finance";
import { money } from "@/lib/format";
import { Money, usePrivacy } from "./app-shell";
import { NiviPerch } from "./nivi-perch";

/** Abre o chat do Nivi (o botão flutuante escuta este evento). */
export const openNivi = () => window.dispatchEvent(new Event("nivi:open"));

const shortcuts: { to: string; label: string; icon: LucideIcon; color: string }[] = [
  { to: "/recorrencias", label: "Contas do mês", icon: CalendarDays, color: "#6a00ff" },
  { to: "/faturas", label: "Cartões", icon: CreditCard, color: "#ff007a" },
  { to: "/patrimonio", label: "Investimentos", icon: BarChart3, color: "#7ab800" },
  { to: "/metas", label: "Metas", icon: Target, color: "#ff6b00" },
];

/** Topo da visão geral no celular, como no mockup da identidade visual. */
export function MobileHome() {
  const { summary, transactions, mode } = useFinance();
  const { hidden, toggle } = usePrivacy();

  // Evolução do saldo nos últimos 30 dias (reconstruída a partir das transações).
  const series = useMemo(() => {
    const days = 30;
    const today = new Date();
    const byDay = new Map<string, number>();
    for (const t of transactions) byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount);
    let bal = summary.balance;
    const out: { v: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push({ v: bal });
      bal -= byDay.get(d.toISOString().slice(0, 10)) ?? 0;
    }
    return out.reverse();
  }, [transactions, summary.balance]);

  const first = series[0]?.v ?? 0;
  const change = mode === "demo" ? summary.balanceChange : first ? Math.round(((summary.balance - first) / Math.abs(first)) * 100) : 0;
  const up = change >= 0;

  return (
    <div className="mb-5 space-y-4 lg:hidden">
      <button
        onClick={openNivi}
        className="rise relative flex w-full items-center overflow-hidden rounded-[22px] bg-gradient-to-br from-violet-soft to-surface p-4 pr-24 text-left ring-1 ring-line"
      >
        <span>
          <span className="block text-[17px] font-bold tracking-[-0.02em]">Oi! Eu sou o Nivi 👋</span>
          <span className="mt-1 block text-[13px] leading-snug text-ink-2">Analisei suas finanças e separei alguns insights para você.</span>
        </span>
        <span className="nivo-gradient absolute top-1/2 right-4 grid size-14 -translate-y-1/2 place-items-center rounded-2xl text-lime shadow-[var(--shadow-pop)]">
          <Sparkles size={26} />
        </span>
      </button>

      <div>
      <NiviPerch balance={summary.balance} />
      <div className="card rise overflow-hidden p-5">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-ink-2">Saldo atual</span>
          <button onClick={toggle} className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-canvas" aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}>
            {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <Money className="mt-1 block text-[30px] font-bold tracking-[-0.035em]">{money(summary.balance)}</Money>
        <div className="mt-2 flex items-end justify-between gap-3">
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ${up ? "bg-positive-soft text-positive" : "bg-pink-soft text-pink"}`}
          >
            {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {up ? "+" : ""}
            {change}% este mês
          </span>
          <div className="-mr-5 -mb-5 h-16 min-w-0 flex-1">
            <ClientOnly fallback={null}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="bal-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#12b76a" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#12b76a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#12b76a" strokeWidth={2.5} fill="url(#bal-fill)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          </div>
        </div>
      </div>
      </div>

      <nav className="rise grid grid-cols-4 gap-2.5" aria-label="Atalhos">
        {shortcuts.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-2 px-1 py-3 text-center text-[12px] leading-tight font-medium text-ink-2">
            <span className="grid size-11 place-items-center rounded-2xl" style={{ background: `${color}1f`, color }}>
              <Icon size={21} />
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
