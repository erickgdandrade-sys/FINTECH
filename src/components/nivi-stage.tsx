/**
 * Palco do Nivi em pixel art: cenas animadas que aparecem na parte de baixo da tela.
 * - Visão geral: alterna cenas (corre, acena, pula e, com saldo alto, joga dinheiro).
 * - Demais páginas: uma cena temática ao entrar na página.
 * Respeita "reduzir movimento" do sistema (não mostra nada).
 */
import { useRouterState } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useFinance } from "@/lib/finance";
import { PROPS, Sprite, POSES, useFrames, type Pose } from "./pixel-nivi";

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

type SceneDef = {
  poses: Pose[];
  ms: number;
  /** Animação do contêiner (keyframes em styles.css). */
  motion: string;
  duration: number;
  prop?: keyof typeof PROPS;
  propMotion?: string;
  bubble?: string;
  particles?: "money" | "coins" | "sparkles" | "hearts";
  /** Posição horizontal inicial (0–1 da largura). */
  x?: number;
};

export const SCENES: Record<SceneName, SceneDef> = {
  run: { poses: ["run1", "run2"], ms: 110, motion: "nivi-run", duration: 4600, x: 0 },
  wave: { poses: ["wave1", "wave2"], ms: 280, motion: "nivi-peek", duration: 4200, bubble: "Oi!", x: 0.08 },
  jump: { poses: ["cheer", "cheer2"], ms: 200, motion: "nivi-hop", duration: 3200, particles: "sparkles", x: 0.42 },
  money: { poses: ["cheer", "cheer2"], ms: 160, motion: "nivi-pop", duration: 5200, particles: "money", bubble: "Tá rico, hein!", x: 0.3 },
  search: { poses: ["run1", "idle", "run2", "idle"], ms: 240, motion: "nivi-patrol", duration: 6000, prop: "magnifier", propMotion: "prop-scan", bubble: "Conferindo cada centavo…", x: 0.1 },
  celebrate: { poses: ["cheer", "cheer2"], ms: 200, motion: "nivi-hop", duration: 4200, prop: "flag", propMotion: "prop-wave", particles: "sparkles", bubble: "Rumo à meta!", x: 0.12 },
  plan: { poses: ["idle", "blink", "idle", "idle"], ms: 400, motion: "nivi-peek", duration: 5000, prop: "clipboard", propMotion: "prop-write", bubble: "Planejando o próximo mês…", x: 0.1 },
  coins: { poses: ["cheer", "cheer2"], ms: 260, motion: "nivi-peek", duration: 5000, particles: "coins", bubble: "Cada real no seu lugar.", x: 0.1 },
  calendar: { poses: ["wave1", "wave2"], ms: 320, motion: "nivi-peek", duration: 4600, prop: "calendar", propMotion: "prop-bob", bubble: "Nada vence sem eu avisar.", x: 0.1 },
  plug: { poses: ["idle", "blink"], ms: 500, motion: "nivi-peek", duration: 4600, prop: "plug", propMotion: "prop-plug", bubble: "Conectando seus bancos…", x: 0.1 },
  build: { poses: ["idle", "idle"], ms: 400, motion: "nivi-peek", duration: 4800, prop: "hammer", propMotion: "prop-hammer", bubble: "Construindo esta tela!", x: 0.1 },
  love: { poses: ["wave1", "wave2"], ms: 260, motion: "nivi-hop", duration: 3600, particles: "hearts", x: 0.5 },
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
const RICH = 10_000;

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
function Particles({ kind, count = 10 }: { kind: NonNullable<SceneDef["particles"]>; count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dx: Math.round((Math.random() - 0.5) * 260),
        up: 90 + Math.round(Math.random() * 110),
        delay: Math.round(i * 160 + Math.random() * 120),
        rot: Math.round((Math.random() - 0.5) * 540),
        prop: kind === "money" ? (i % 3 === 0 ? "coin" : "bill") : kind === "coins" ? "coin" : kind === "hearts" ? "heart" : "sparkle",
      })),
    [kind, count],
  );
  return (
    <div className="pointer-events-none absolute bottom-10 left-1/2">
      {items.map((p, i) => (
        <span
          key={i}
          className="nivi-particle absolute"
          style={{ "--dx": `${p.dx}px`, "--up": `${p.up}px`, "--rot": `${p.rot}deg`, animationDelay: `${p.delay}ms` } as CSSProperties}
        >
          <Sprite rows={PROPS[p.prop]} className="size-6" />
        </span>
      ))}
    </div>
  );
}

/** Um Nivi executando uma cena. Usado no palco e na tela de login. */
export function NiviActor({ scene, size = 64, loop = false }: { scene: SceneName; size?: number; loop?: boolean }) {
  const def = SCENES[scene];
  const pose = useFrames(def.poses, def.ms);
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
      {def.bubble && (
        <span className="nivi-bubble absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md border-2 border-ink bg-surface px-2 py-1 text-[11px] font-bold whitespace-nowrap text-ink shadow-[2px_2px_0_var(--color-ink)]">
          {def.bubble}
        </span>
      )}
      <Sprite rows={POSES[pose]} className="block w-full" />
      {def.prop && (
        <span className={clsx("absolute", def.propMotion)} style={{ width: size * 0.5, right: -size * 0.32, bottom: size * 0.32 }}>
          <Sprite rows={PROPS[def.prop]} className="block w-full" />
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
    if (reduced || pathname === "/entrar") return;
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
      const scene = PAGE_SCENE[pathname] ?? "wave";
      play(scene, 700);
    }

    return () => {
      timers.forEach(clearTimeout);
      timers = [];
      setCurrent(null);
    };
  }, [pathname, rich, reduced]);

  if (!current) return null;
  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-30 h-72 overflow-hidden lg:left-[248px]" aria-hidden>
      <NiviActor key={current.id} scene={current.scene} />
    </div>
  );
}

/** Palco da tela de login: o Nivi passa por várias cenas em sequência, sem parar. */
const LOGIN_SEQUENCE: SceneName[] = ["wave", "run", "money", "celebrate", "search", "jump", "plug", "love", "build"];

export function LoginStage() {
  const reduced = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const scene = LOGIN_SEQUENCE[i % LOGIN_SEQUENCE.length];
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setI((n) => n + 1), SCENES[scene].duration + 400);
    return () => clearTimeout(t);
  }, [i, scene, reduced]);

  return (
    <div className="relative h-56 w-full overflow-hidden" aria-hidden>
      {reduced ? (
        <div className="absolute bottom-3 left-8 w-24">
          <Sprite rows={POSES.wave1} className="block w-full" />
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 bottom-3">
          <NiviActor key={i} scene={scene} size={88} />
        </div>
      )}
      {/* chão em pixel */}
      <div className="absolute inset-x-0 bottom-0 h-3 bg-[repeating-linear-gradient(90deg,#b8ff00_0_12px,#8fd400_12px_24px)]" />
    </div>
  );
}
