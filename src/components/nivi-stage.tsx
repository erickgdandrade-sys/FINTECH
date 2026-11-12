/**
 * Palco do Nivi: cenas animadas que aparecem na parte de baixo da tela.
 * - Visão geral: alterna cenas (corre, acena, pula, coração e, com saldo alto, joga dinheiro).
 * - Demais páginas: uma cena temática ao entrar na página.
 * Respeita "reduzir movimento" do sistema (não mostra nada).
 */
import { useRouterState } from "@tanstack/react-router";
import clsx from "clsx";
import {
  Banknote,
  CalendarDays,
  ClipboardList,
  Coins,
  Flag,
  Hammer,
  Heart,
  Plug,
  Search,
  Sparkle,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useFinance } from "@/lib/finance";
import { NiviVector, type NiviPose } from "./nivi-vector";

export type SceneName =
  | "run"
  | "wave"
  | "jump"
  | "money"
  | "search"
  | "celebrate"
  | "plan"
  | "coins"
  | "calendar"
  | "plug"
  | "build"
  | "love";

type Prop = { icon: LucideIcon; color: string; fill?: string };

const PROPS: Record<string, Prop> = {
  magnifier: { icon: Search, color: "#00b8d4" },
  flag: { icon: Flag, color: "#ff007a", fill: "#ff007a" },
  clipboard: { icon: ClipboardList, color: "#6a00ff" },
  plug: { icon: Plug, color: "#ff6b00" },
  calendar: { icon: CalendarDays, color: "#6a00ff" },
  hammer: { icon: Hammer, color: "#4a4668" },
};

const PARTICLES: Record<"money" | "coins" | "sparkles" | "hearts", Prop[]> = {
  money: [
    { icon: Banknote, color: "#0e9f5a", fill: "#c9f7dc" },
    { icon: Banknote, color: "#0e9f5a", fill: "#c9f7dc" },
    { icon: Coins, color: "#e08a00", fill: "#ffd25a" },
  ],
  coins: [{ icon: Coins, color: "#e08a00", fill: "#ffd25a" }],
  sparkles: [{ icon: Sparkle, color: "#8fd400", fill: "#b8ff00" }],
  hearts: [{ icon: Heart, color: "#ff007a", fill: "#ff007a" }],
};

type SceneDef = {
  pose: NiviPose;
  /** Animação do contêiner (keyframes em styles.css). */
  motion: string;
  duration: number;
  prop?: keyof typeof PROPS;
  propMotion?: string;
  bubble?: string;
  particles?: keyof typeof PARTICLES;
  /** Posição horizontal inicial (0–1 da largura). */
  x?: number;
};

export const SCENES: Record<SceneName, SceneDef> = {
  run: { pose: "run", motion: "nivi-run", duration: 4600, x: 0 },
  wave: { pose: "wave", motion: "nivi-peek", duration: 4200, bubble: "Oi!", x: 0.08 },
  jump: { pose: "cheer", motion: "nivi-hop", duration: 3200, particles: "sparkles", x: 0.42 },
  money: { pose: "cheer", motion: "nivi-pop", duration: 5200, particles: "money", bubble: "Tá rico, hein!", x: 0.3 },
  search: { pose: "run", motion: "nivi-patrol", duration: 6000, prop: "magnifier", propMotion: "prop-scan", bubble: "Conferindo cada centavo…", x: 0.1 },
  celebrate: { pose: "cheer", motion: "nivi-hop", duration: 4200, prop: "flag", propMotion: "prop-wave", particles: "sparkles", bubble: "Rumo à meta!", x: 0.12 },
  plan: { pose: "think", motion: "nivi-peek", duration: 5000, prop: "clipboard", propMotion: "prop-write", bubble: "Planejando o próximo mês…", x: 0.1 },
  coins: { pose: "cheer", motion: "nivi-peek", duration: 5000, particles: "coins", bubble: "Cada real no seu lugar.", x: 0.1 },
  calendar: { pose: "wave", motion: "nivi-peek", duration: 4600, prop: "calendar", propMotion: "prop-bob", bubble: "Nada vence sem eu avisar.", x: 0.1 },
  plug: { pose: "think", motion: "nivi-peek", duration: 4600, prop: "plug", propMotion: "prop-plug", bubble: "Conectando seus bancos…", x: 0.1 },
  build: { pose: "think", motion: "nivi-peek", duration: 4800, prop: "hammer", propMotion: "prop-hammer", bubble: "Construindo esta tela!", x: 0.1 },
  love: { pose: "wave", motion: "nivi-hop", duration: 3600, particles: "hearts", x: 0.5 },
};

const PAGE_SCENE: Record<string, SceneName> = {
  "/transacoes": "search",
  "/metas": "celebrate",
  "/planejamento": "plan",
  "/categorias": "coins",
  "/recorrencias": "calendar",
  "/contas": "plug",
  "/faturas": "coins",
  "/fluxo-de-caixa": "build",
  "/patrimonio": "build",
  "/projecao": "build",
};

/** Saldo a partir do qual o Nivi aparece jogando dinheiro. */
const RICH = 1_000;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Partículas (dinheiro, moedas, brilhos, corações) que sobem e caem. */
function Particles({ kind, count = 4 }: { kind: keyof typeof PARTICLES; count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dx: Math.round((Math.random() - 0.5) * 70),
        up: 22 + Math.round(Math.random() * 24),
        delay: Math.round(i * 380 + Math.random() * 120),
        rot: Math.round((Math.random() - 0.5) * 540),
        prop: PARTICLES[kind][i % PARTICLES[kind].length],
      })),
    [kind, count],
  );
  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2">
      {items.map((p, i) => {
        const Icon = p.prop.icon;
        return (
          <span
            key={i}
            className="nivi-particle absolute"
            style={{ "--dx": `${p.dx}px`, "--up": `${p.up}px`, "--rot": `${p.rot}deg`, animationDelay: `${p.delay}ms` } as CSSProperties}
          >
            <Icon size={24} color={p.prop.color} fill={p.prop.fill ?? "none"} strokeWidth={2.2} />
          </span>
        );
      })}
    </div>
  );
}

/** Um Nivi executando uma cena. Usado no palco e na tela de login. */
export function NiviActor({ scene, size = 72, loop = false }: { scene: SceneName; size?: number; loop?: boolean }) {
  const def = SCENES[scene];
  const prop = def.prop ? PROPS[def.prop] : null;
  const PropIcon = prop?.icon;
  return (
    <div
      className={clsx("nivi-actor absolute bottom-0", def.motion)}
      style={
        {
          left: `${(def.x ?? 0) * 100}%`,
          animationDuration: `${def.duration}ms`,
          animationIterationCount: loop ? "infinite" : 1,
          width: size,
        } as CSSProperties
      }
    >
      {def.particles && <Particles kind={def.particles} />}
      <NiviVector pose={def.pose} className="block w-full drop-shadow-[0_6px_10px_rgb(11_6_48/0.25)]" />
      {prop && PropIcon && (
        <span
          className={clsx("absolute grid place-items-center rounded-full bg-surface shadow-md ring-1 ring-line", def.propMotion)}
          style={{ width: size * 0.42, height: size * 0.42, right: -size * 0.3, bottom: size * 0.42 }}
        >
          <PropIcon size={size * 0.24} color={prop.color} fill={prop.fill ?? "none"} strokeWidth={2.4} />
        </span>
      )}
    </div>
  );
}

export function NiviStage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { summary } = useFinance();
  const reduced = usePrefersReducedMotion();
  const [current, setCurrent] = useState<{ scene: SceneName; id: number } | null>(null);
  const rich = summary.balance >= RICH;

  useEffect(() => {
    // Na visão geral o Nivi mora em cima do saldo (NiviPerch); o palco do rodapé fica para as outras páginas.
    if (reduced || pathname === "/entrar" || pathname === "/") return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const play = (scene: SceneName, after = 0) => {
      timers.push(
        setTimeout(() => {
          setCurrent({ scene, id: Date.now() });
          timers.push(setTimeout(() => setCurrent(null), SCENES[scene].duration + 100));
        }, after),
      );
    };

    if (pathname === "/") {
      const pool: SceneName[] = ["run", "wave", "jump", "love", ...(rich ? (["money", "money"] as SceneName[]) : [])];
      let last: SceneName | null = null;
      const next = () => {
        const options = pool.filter((s) => s !== last);
        const scene = options[Math.floor(Math.random() * options.length)];
        last = scene;
        play(scene);
        timers.push(setTimeout(next, SCENES[scene].duration + 6000 + Math.random() * 6000));
      };
      // Primeira cena: dinheiro se o saldo estiver alto, senão um aceno.
      const first: SceneName = rich ? "money" : "wave";
      last = first;
      play(first, 1200);
      timers.push(setTimeout(next, 1200 + SCENES[first].duration + 7000));
    } else {
      play(PAGE_SCENE[pathname] ?? "wave", 700);
    }

    return () => {
      timers.forEach(clearTimeout);
      timers = [];
      setCurrent(null);
    };
  }, [pathname, rich, reduced]);

  if (!current) return null;
  return (
    <div className="pointer-events-none fixed right-0 bottom-[68px] left-0 z-30 h-72 overflow-hidden lg:bottom-0 lg:left-[248px]" aria-hidden>
      <NiviActor key={current.id} scene={current.scene} />
    </div>
  );
}

/** Palco da tela de login: o Nivi passa por várias cenas em sequência, sem parar. */
const LOGIN_SEQUENCE: SceneName[] = ["wave", "run", "money", "celebrate", "search", "jump", "plug", "love", "build"];

export function LoginStage({ className = "h-60", size = 104 }: { className?: string; size?: number }) {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const scene = LOGIN_SEQUENCE[i % LOGIN_SEQUENCE.length];
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setI((n) => n + 1), SCENES[scene].duration + 400);
    return () => clearTimeout(t);
  }, [i, scene, reduced]);

  return (
    <div className={clsx("relative w-full overflow-hidden", className)} aria-hidden>
      {reduced ? (
        <div className="absolute bottom-0 left-12 w-28">
          <NiviVector pose="wave" sparkle />
        </div>
      ) : (
        <div className="absolute inset-x-12 top-0 bottom-0">
          <NiviActor key={i} scene={scene} size={size} />
        </div>
      )}
    </div>
  );
}
