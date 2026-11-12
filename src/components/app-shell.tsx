import { Link, useRouterState } from "@tanstack/react-router";
import clsx from "clsx";
import {
  ArrowLeftRight,
  Camera,
  CalendarRange,
  CalendarSync,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  Landmark,
  LayoutGrid,
  LineChart,
  Loader2,
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
import { NivoLogo } from "./brand";
import { NiviFab } from "./nivi-chat";
import { NiviStage } from "./nivi-stage";
import { NotificationsBell } from "./notifications";
import { ThemeSwitch } from "./theme-switch";

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

      <div className="flex items-center justify-between px-6 pb-3">
        <span className="text-[12px] font-medium text-ink-3">Tema</span>
        <ThemeSwitch />
      </div>
      <UserFooter onNavigate={onNavigate} />
    </div>
  );
}

function UserFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { session, configured, signOut, mode, avatarUrl, setAvatar } = useFinance();
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
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
      <label
        className="group relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-pink text-[13px] font-bold text-white"
        title="Trocar foto de perfil"
      >
        {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : initials}
        <span className="absolute inset-0 grid place-items-center bg-ink/55 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Trocar foto de perfil"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setUploading(true);
            setPhotoError(null);
            try {
              await setAvatar(file);
            } catch (err) {
              setPhotoError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
            } finally {
              setUploading(false);
            }
          }}
        />
      </label>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">{name}</span>
        <span className={clsx("block truncate text-[12px]", photoError ? "text-pink" : "text-ink-3")} title={photoError ?? undefined}>
          {photoError ?? `Nivo Pro · ${mode === "live" ? "Open Finance ativo" : "sem banco conectado"}`}
        </span>
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

/** Avatar do topo no celular: abre o menu (perfil, tema, demais seções). */
function TopAvatar({ onOpen }: { onOpen: () => void }) {
  const { session, avatarUrl } = useFinance();
  const name = (session?.user.user_metadata?.name as string | undefined) ?? session?.user.email ?? "";
  return (
    <button
      onClick={onOpen}
      className="grid size-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet to-pink text-[13px] font-bold text-white ring-2 ring-surface"
      aria-label="Abrir menu e perfil"
    >
      {avatarUrl ? <img src={avatarUrl} alt="" className="size-full object-cover" /> : name ? name.charAt(0).toUpperCase() : <Menu size={18} />}
    </button>
  );
}

const bottomItems: NavItem[] = [
  { to: "/", label: "Início", icon: LayoutGrid },
  { to: "/transacoes", label: "Extrato", icon: ArrowLeftRight },
  { to: "/planejamento", label: "Planejar", icon: CalendarRange },
  { to: "/metas", label: "Metas", icon: Target },
];

/** Barra de navegação inferior (celular), como num app. */
function BottomNav({ onMore }: { onMore: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-2 pt-1.5 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      aria-label="Navegação principal"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {bottomItems.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={clsx("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold", active ? "text-violet" : "text-ink-3")}
              >
                <span className={clsx("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-violet-soft")}>
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button onClick={onMore} className="flex w-full flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold text-ink-3">
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <Menu size={19} />
            </span>
            Mais
          </button>
        </li>
      </ul>
    </nav>
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
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-surface lg:block">
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
              "absolute inset-y-0 left-0 w-[280px] bg-surface shadow-2xl transition-transform duration-300",
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
        <header className="sticky top-0 z-20 flex items-center justify-between bg-canvas/85 px-4 pt-3 pb-2 backdrop-blur lg:hidden">
          <Link to="/" aria-label="Nivo — início">
            <NivoLogo />
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <TopAvatar onOpen={() => setDrawer(true)} />
          </div>
        </header>

        <main className="lg:pl-[248px]">
          <div className="mx-auto max-w-[1360px] px-4 pt-3 pb-40 sm:px-6 lg:px-8 lg:pt-8 lg:pb-28">{children}</div>
        </main>

        <BottomNav onMore={() => setDrawer(true)} />

        <NiviStage />
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
            className="h-10 appearance-none rounded-xl border border-line bg-surface pr-9 pl-4 text-[14px] font-medium text-ink-2 hover:border-ink-3/40"
          >
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3" />
        </label>
        <NotificationsBell className="hidden lg:block" />
        <button className="flex h-10 items-center gap-1.5 rounded-xl bg-lime px-3.5 text-[14px] font-bold text-ink shadow-[0_6px_16px_-8px_rgb(140_200_0)] hover:brightness-95">
          <Plus size={18} strokeWidth={2.6} />
          <span className="hidden sm:inline">Nova transação</span>
        </button>
      </div>
    </div>
  );
}
