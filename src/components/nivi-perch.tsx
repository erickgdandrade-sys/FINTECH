/**
 * O Nivi "mora" em cima do card de saldo: fica ali o tempo todo fazendo uma rotina
 * de ações aleatórias (anda, corre, senta, cochila, embaixadinha, chuta bola, dança,
 * olha em volta, pula, acena e, com saldo alto, joga dinheiro).
 */
import clsx from "clsx";
import { Banknote, Coins, Music2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { NiviVector, type NiviPose } from "./nivi-vector";

type Extra = "ball-kick" | "ball-juggle" | "zzz" | "notes" | "money" | "hop" | null;

type Action = {
  id: number;
  pose: NiviPose;
  ms: number;
  /** Posição de destino (0–100% da largura). Se definida, o Nivi se desloca até lá. */
  to?: number;
  extra?: Extra;
  bubble?: string;
};

const SIZE = 64;
/** Saldo a partir do qual ele joga dinheiro. */
const RICH = 1_000;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

const GREETINGS = ["Oi! Tô de olho no seu saldo 👀", "Bora economizar hoje?", "Tudo sob controle por aqui!", "Me chama se precisar!", "Seu dinheiro, meu jogo ⚽"];

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

function Ball({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={clsx("size-4", className)} aria-hidden>
      <circle cx="10" cy="10" r="9" fill="#fff" stroke="#1d0b5e" strokeWidth="1.6" />
      <path d="M10 5.5 L13.6 8.2 L12.3 12.4 H7.7 L6.4 8.2 Z" fill="#1d0b5e" />
      <path d="M10 1.2 V5.5 M13.6 8.2 L18.4 7 M12.3 12.4 L15 16.8 M7.7 12.4 L5 16.8 M6.4 8.2 L1.6 7" stroke="#1d0b5e" strokeWidth="1.2" />
    </svg>
  );
}

function MoneyBurst() {
  const items = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => ({
        dx: Math.round((Math.random() - 0.5) * 70),
        up: 22 + Math.round(Math.random() * 22),
        delay: i * 380,
        rot: Math.round((Math.random() - 0.5) * 500),
        coin: i % 3 === 0,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2">
      {items.map((p, i) => (
        <span
          key={i}
          className="nivi-particle absolute"
          style={{ "--dx": `${p.dx}px`, "--up": `${p.up}px`, "--rot": `${p.rot}deg`, animationDelay: `${p.delay}ms` } as CSSProperties}
        >
          {p.coin ? <Coins size={18} color="#e08a00" fill="#ffd25a" /> : <Banknote size={20} color="#0e9f5a" fill="#c9f7dc" />}
        </span>
      ))}
    </div>
  );
}

export function NiviPerch({ balance, className }: { balance: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [x, setX] = useState(18);
  const [action, setAction] = useState<Action>({ id: 0, pose: "idle", ms: 1500 });
  const xRef = useRef(x);
  xRef.current = x;
  const rich = balance >= RICH;
  const richRef = useRef(rich);
  richRef.current = rich;
  const lastKind = useRef<string>("");

  useEffect(() => {
    if (reduced) return;
    let t: ReturnType<typeof setTimeout>;
    let n = 0;

    const nextAction = (): Action => {
      const here = xRef.current;
      const options: (() => Action)[] = [
        // anda até outro ponto
        () => {
          const to = Math.round(rand(8, 88));
          return { id: ++n, pose: "walk", to, ms: Math.max(900, Math.abs(to - here) * 45) };
        },
        // passa correndo até a outra ponta
        () => {
          const to = here < 50 ? Math.round(rand(80, 90)) : Math.round(rand(6, 14));
          return { id: ++n, pose: "run", to, ms: Math.max(700, Math.abs(to - here) * 18) };
        },
        () => ({ id: ++n, pose: "sit", ms: 4200 }),
        () => ({ id: ++n, pose: "sleep", ms: 5200, extra: "zzz" }),
        () => ({ id: ++n, pose: "juggle", ms: 4200, extra: "ball-juggle", bubble: "Embaixadinha!" }),
        () => ({ id: ++n, pose: "kick", ms: 4200, extra: "ball-kick" }),
        () => ({ id: ++n, pose: "dance", ms: 3600, extra: "notes" }),
        () => ({ id: ++n, pose: "look", ms: 2600 }),
        () => ({ id: ++n, pose: "cheer", ms: 1700, extra: "hop" }),
        () => ({ id: ++n, pose: "wave", ms: 3000, bubble: pick(GREETINGS) }),
        () => ({ id: ++n, pose: "idle", ms: 2200 }),
      ];
      if (richRef.current) {
        const money = () => ({ id: ++n, pose: "cheer" as NiviPose, ms: 3800, extra: "money" as Extra, bubble: "Tá rico, hein!" });
        options.push(money, money);
      }
      // evita repetir a mesma ação seguida
      let a: Action;
      do a = pick(options)();
      while (`${a.pose}${a.extra}` === lastKind.current && options.length > 1);
      lastKind.current = `${a.pose}${a.extra}`;
      // a kick precisa de espaço à direita para a bola
      if (a.extra === "ball-kick" && here > 62) a = { ...a, pose: "walk", to: 30, ms: Math.abs(30 - here) * 45, extra: null };
      return a;
    };

    const run = (a: Action) => {
      setAction(a);
      if (a.to != null) setX(a.to);
      t = setTimeout(() => run(nextAction()), a.ms + 250);
    };
    // começa jogando dinheiro se o saldo estiver alto, senão acenando
    t = setTimeout(
      () => run(richRef.current ? { id: ++n, pose: "cheer", ms: 3800, extra: "money", bubble: "Tá rico, hein!" } : { id: ++n, pose: "wave", ms: 3000, bubble: "Oi!" }),
      600,
    );
    return () => clearTimeout(t);
  }, [reduced]);

  const moving = action.to != null;
  const extra = reduced ? null : action.extra;

  return (
    <div className={clsx("pointer-events-none relative z-10 h-[60px]", className)} aria-hidden>
      <div
        className="absolute bottom-[-4px]"
        style={{
          left: `calc(${x}% - ${SIZE / 2}px)`,
          width: SIZE,
          transition: moving ? `left ${action.ms}ms ${action.pose === "run" ? "cubic-bezier(.45,0,.55,1)" : "linear"}` : undefined,
        }}
      >
        {extra === "money" && <MoneyBurst key={`m${action.id}`} />}
        {extra === "zzz" && (
          <span className="absolute -top-2 right-0 font-brand text-[13px] font-extrabold text-violet">
            <span className="perch-float absolute">z</span>
            <span className="perch-float absolute left-2 text-[16px]" style={{ animationDelay: "0.7s" }}>
              z
            </span>
            <span className="perch-float absolute left-4 text-[19px]" style={{ animationDelay: "1.4s" }}>
              Z
            </span>
          </span>
        )}
        {extra === "notes" && (
          <span className="absolute -top-1 right-0 text-pink">
            <Music2 size={14} className="perch-float absolute" />
            <Music2 size={12} className="perch-float absolute left-3 text-violet" style={{ animationDelay: "0.9s" }} />
          </span>
        )}
        {extra === "ball-juggle" && (
          <span className="absolute top-[-14px] left-1/2 -ml-2">
            <Ball className="perch-ball-juggle" />
          </span>
        )}
        {extra === "ball-kick" && (
          <span className="absolute right-[-10px] bottom-[2px]">
            <Ball className="perch-ball-kick" />
          </span>
        )}

        <div key={extra === "hop" ? `h${action.id}` : "static"} className={clsx(extra === "hop" && "perch-hop")}>
          <NiviVector pose={reduced ? "idle" : action.pose} className="block w-full drop-shadow-[0_4px_6px_rgb(11_6_48/0.2)]" />
        </div>
      </div>
    </div>
  );
}
