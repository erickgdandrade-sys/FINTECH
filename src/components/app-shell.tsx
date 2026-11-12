import { Link, useRouterState } from "@tanstack/react-router";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Bell,
  CalendarRange,
  CalendarSync,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  LayoutGrid,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  PieChart,
  Plus,
  Target,
  TrendingUp,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useFinance } from "@/lib/finance";
import { NivoAppIcon, NivoLogo } from "./brand";
import { NiviFab } from "./nivi-chat";

type NavItem = { to: string; label: string; icon: LucideIcon };

const nav: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { to: "/", label: "Visão geral", icon: LayoutGrid },
      { to: "/transacoes", label: "Transações", icon: ArrowLeftRight },
      { to: "/recorrencias", label: "Recorrências", icon: CalendarSync },
      { to: "/fluxo-de-caixa", label: "Fluxo de Caixa", icon: LineChart },
      { to: "/faturas", label: "Faturas", icon: CreditCard },
      { to: "/categorias", label: "Categorias", icon: PieChart },
    ],
  },
  {
    title: "Visão Estratégica",
    items: [
      { to: "/planejamento", label: "Planejamento", icon: CalendarRange },
      { to: "/metas", label: "Metas", icon: Target },
      { to: "/patrimonio", label: "Patrimônio", icon: Landmark },
      { to: "/projecao", label: "Projeção", icon: TrendingUp },
      { to: "/contas", label: "Contas", icon: Wallet },
    ],
  },
];

export const allNavItems = nav.flatMap((g) => g.items);

/* ─── Modo privacidade (oculta valores) ─── */
const PrivacyCtx = createContext<{ hidden: boolean; toggle: () => void }>({
  hidden: false,
  toggle: () => {},
});
export const usePrivacy = () => useContext(PrivacyCtx);

export function Money({ children, className }: { children: ReactNode; className?: string }) {
  const { hidden } = usePrivacy();
  return (
    <span className={clsx("tabular transition-[filter]", hidden && "blur-[7px] select-none", className)}>
      {children}
    </span>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { hidden, toggle } = usePrivacy();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-6 pt-7 pb-8">
        <Link to="/" onClick={onNavigate} aria-label="Nivo — início">
          <NivoLogo />
        </Link>
        <button
          onClick={toggle}
          className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink"
          aria-label={hidden ? "Mostrar valores" : "Ocultar valores"}
          title={hidden ? "Mostrar valores" : "Ocultar valores"}
        >
          {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-4">
        {nav.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => {
                const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={onNavigate}
                      className={clsx(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                        active
                          ? "bg-violet-soft text-violet"
                          : "text-ink-2 hover:bg-canvas hover:text-ink",
                      )}
                    >
                      {active && (
                        <span className="absolute top-2 bottom-2 -left-4 w-1 rounded-r-full bg-violet" />
                      )}
                      <Icon size={18} strokeWidth={active ? 2.3 : 1.9} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <UserFooter onNavigate={onNavigate} />
    </div>
  );
}

function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { session, configured, signOut, mode } = useFinance();
  if (!session) {
    return (
      <div className="border-t border-line px-4 py-4">
        <Link
          to={configured ? "/entrar" : "/contas"}
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-[14px] font-semibold text-white hover:bg-ink/90"
        >
          <LogIn size={16} /> Entrar
        </Link>
        <p className="mt-2 text-center text-[11px] text-ink-3">Você está vendo dados de exemplo</p>
      </div>
    );
  }
  const name = (session.user.user_metadata?.name as string | undefined) ?? session.user.email ?? "Você";
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <div className="flex items-center gap-3 border-t border-line px-6 py-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet to-pink text-[13px] font-bold text-white">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{name}</span>
        <span className="block text-[12px] text-ink-3">Nivo Pro · {mode === "live" ? "Open Finance ativo" : "sem banco conectado"}</span>
      </span>
      <button
        onClick={signOut}
        className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-canvas hover:text-ink"
        aria-label="Sair"
        title="Sair"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => setDrawer(false), [pathname]);

  // Telas sem o layout do app (login).
  if (pathname === "/entrar") return <>{children}</>;

  return (
    <PrivacyCtx.Provider value={{ hidden, toggle: () => setHidden((h) => !h) }}>
      <div className="min-h-dvh">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-white lg:block">
          <Sidebar />
        </aside>

        {/* Drawer mobile */}
        <div
          className={clsx(
            "fixed inset-0 z-50 lg:hidden",
            drawer ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!drawer}
        >
          <div
            onClick={() => setDrawer(false)}
            className={clsx(
              "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity",
              drawer ? "opacity-100" : "opacity-0",
            )}
          />
          <aside
            className={clsx(
              "absolute inset-y-0 left-0 w-[280px] bg-white shadow-2xl transition-transform duration-300",
              drawer ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              onClick={() => setDrawer(false)}
              className="absolute top-6 right-4 grid size-8 place-items-center rounded-full bg-canvas"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>
            <Sidebar onNavigate={() => setDrawer(false)} />
          </aside>
        </div>

        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            className="grid size-10 place-items-center rounded-xl bg-canvas"
            aria-label="Abrir menu"
          >
            <Menu size={19} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <NivoAppIcon className="size-8" />
            <span className="text-lg font-extrabold tracking-[-0.04em]">Nivo</span>
          </Link>
          <button className="relative grid size-10 place-items-center rounded-xl bg-canvas" aria-label="Notificações">
            <Bell size={18} />
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-pink ring-2 ring-canvas" />
          </button>
        </header>

        <main className="lg:pl-[248px]">
          <div className="mx-auto max-w-[1360px] px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
        </main>

        <NiviFab />
      </div>
    </PrivacyCtx.Provider>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [period, setPeriod] = useState("Mensal");
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.03em] sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[14px] text-ink-3">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <label className="relative">
          <span className="sr-only">Período</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-line bg-white pr-9 pl-4 text-[14px] font-medium text-ink-2 hover:border-ink-3/40"
          >
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />
        </label>
        <button
          className="relative hidden size-10 place-items-center rounded-xl border border-line bg-white text-ink-2 hover:text-ink lg:grid"
          aria-label="Notificações"
        >
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-pink ring-2 ring-white" />
        </button>
        <button className="flex h-10 items-center gap-1.5 rounded-xl bg-lime px-3.5 text-[14px] font-bold text-ink shadow-[0_6px_16px_-8px_rgb(140_200_0)] hover:brightness-95">
          <Plus size={18} strokeWidth={2.6} />
          <span className="hidden sm:inline">Nova transação</span>
        </button>
      </div>
    </div>
  );
}
