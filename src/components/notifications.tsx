import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, CreditCard, PlugZap, Target, TrendingUp, X, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { categories } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { money } from "@/lib/format";

type Alert = {
  id: string;
  tone: "danger" | "warn" | "info" | "good";
  icon: LucideIcon;
  title: string;
  text: string;
  to: string;
};

const READ_KEY = "nivo-notificacoes-lidas";

function daysUntil(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const t = new Date();
  t.setHours(12, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 864e5);
}

/** Gera os alertas a partir dos dados financeiros (nada é enviado para fora). */
function useAlerts(): Alert[] {
  const { summary, recurrences, goals, items } = useFinance();
  return useMemo(() => {
    const out: Alert[] = [];
    const month = summary.monthLabel;

    for (const i of items) {
      if (["LOGIN_ERROR", "OUTDATED", "WAITING_USER_ACTION"].includes(i.status)) {
        out.push({ id: `item-${i.id}-${i.status}`, tone: "danger", icon: PlugZap, title: `${i.connector_name} precisa de atenção`, text: "A conexão parou de atualizar. Reconecte em Contas.", to: "/contas" });
      }
    }

    for (const c of summary.invoices.cards) {
      if (!c.dueDate || c.amount <= 0) continue;
      const d = daysUntil(c.dueDate);
      if (d >= 0 && d <= 5) {
        out.push({
          id: `fatura-${c.id}-${c.dueDate}`,
          tone: d <= 1 ? "danger" : "warn",
          icon: CreditCard,
          title: `Fatura ${c.bank} ${d === 0 ? "vence hoje" : d === 1 ? "vence amanhã" : `vence em ${d} dias`}`,
          text: `Valor de ${money(c.amount)}.`,
          to: "/faturas",
        });
      }
    }

    for (const d of summary.distribution) {
      if (!d.limit) continue;
      const label = categories[d.key].label;
      if (d.value > d.limit) {
        out.push({ id: `orc-${d.key}-${month}-over`, tone: "danger", icon: AlertTriangle, title: `${label} passou do limite`, text: `${money(d.value)} de ${money(d.limit)} (+${money(d.value - d.limit)}).`, to: "/categorias" });
      } else if (d.value / d.limit >= 0.85) {
        out.push({ id: `orc-${d.key}-${month}-near`, tone: "warn", icon: AlertTriangle, title: `${label} perto do limite`, text: `Já foram ${Math.round((d.value / d.limit) * 100)}% do orçamento do mês.`, to: "/categorias" });
      }
    }

    if (summary.pace.diff < 0) {
      out.push({ id: `ritmo-${month}`, tone: "warn", icon: TrendingUp, title: "Gastos acima do ritmo", text: `Você está ${money(-summary.pace.diff)} acima do previsto para hoje.`, to: "/" });
    }

    for (const r of recurrences) {
      const d = daysUntil(r.next);
      if (d >= 0 && d <= 3) {
        out.push({ id: `rec-${r.key}-${r.next}`, tone: "info", icon: CalendarClock, title: `${r.name} ${d === 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d} dias`}`, text: `Cobrança prevista de ${money(r.amount)}.`, to: "/recorrencias" });
      }
    }

    for (const g of goals) {
      const p = g.current / g.target;
      if (p >= 1) out.push({ id: `meta-${g.id}-ok`, tone: "good", icon: CheckCircle2, title: `Meta concluída: ${g.name}`, text: "Parabéns! Você chegou lá.", to: "/metas" });
      else if (p >= 0.9) out.push({ id: `meta-${g.id}-90`, tone: "good", icon: Target, title: `${g.name} quase lá`, text: `Faltam só ${money(g.target - g.current)}.`, to: "/metas" });
    }

    const order = { danger: 0, warn: 1, info: 2, good: 3 };
    return out.sort((a, b) => order[a.tone] - order[b.tone]);
  }, [summary, recurrences, goals, items]);
}

const toneCls: Record<Alert["tone"], string> = {
  danger: "bg-pink-soft text-pink",
  warn: "bg-orange-soft text-orange",
  info: "bg-violet-soft text-violet",
  good: "bg-positive-soft text-positive",
};

export function NotificationsBell({ className }: { className?: string }) {
  const alerts = useAlerts();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setRead(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]"));
    } catch {
      /* sem armazenamento: tudo aparece como não lido */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = alerts.filter((a) => !read.includes(a.id));
  const markAll = () => {
    const ids = [...new Set([...read, ...alerts.map((a) => a.id)])].slice(-200);
    setRead(ids);
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(ids));
    } catch {
      /* ignora */
    }
  };

  return (
    <div ref={ref} className={clsx("relative", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink-2 hover:text-ink"
        aria-label={`Notificações${unread.length ? ` (${unread.length} novas)` : ""}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread.length > 0 && (
          <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold text-white ring-2 ring-surface">
            {unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="rise absolute top-12 right-0 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_48px_-16px_rgb(11_6_48/0.35)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-[14px] font-bold">Notificações</p>
            <div className="flex items-center gap-1">
              {unread.length > 0 && (
                <button onClick={markAll} className="rounded-lg px-2 py-1 text-[12px] font-semibold text-violet hover:bg-violet-soft">
                  Marcar como lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="grid size-7 place-items-center rounded-lg text-ink-3 hover:bg-canvas" aria-label="Fechar">
                <X size={15} />
              </button>
            </div>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto">
            {alerts.length === 0 && <li className="px-4 py-10 text-center text-[13px] text-ink-3">Tudo em dia por aqui. 🎉</li>}
            {alerts.map((a) => {
              const Icon = a.icon;
              const isNew = !read.includes(a.id);
              return (
                <li key={a.id}>
                  <Link
                    to={a.to}
                    onClick={() => setOpen(false)}
                    className={clsx("flex gap-3 px-4 py-3 hover:bg-canvas", isNew && "bg-violet-soft/40")}
                  >
                    <span className={clsx("grid size-9 shrink-0 place-items-center rounded-xl", toneCls[a.tone])}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                        {a.title}
                        {isNew && <span className="size-1.5 rounded-full bg-pink" />}
                      </span>
                      <span className="block text-[12px] text-ink-3">{a.text}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
