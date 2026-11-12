/**
 * Nivi em pixel art (16×16). Cada pose é uma grade de caracteres:
 *   . transparente  K contorno  W corpo  S sombra  V visor  L olho (lima)
 */
import { useEffect, useState } from "react";

const PALETTE: Record<string, string> = {
  K: "#1a0a5c",
  W: "#ffffff",
  S: "#d9d3f5",
  V: "#1a0a5c",
  L: "#b8ff00",
  G: "#12b76a", // nota de dinheiro
  g: "#7be3a8",
  Y: "#ffc83d", // moeda
  y: "#ff9f1c",
  P: "#ff007a",
  C: "#00e5ff",
  O: "#ff6b00",
  B: "#8b5a2b", // cabo de madeira
  M: "#9aa0b5", // metal
};

const HEAD = [
  ".....KK..KK.....",
  "....KWWKKWWK....",
  "...KKKKKKKKKK...",
  "..KWWWWWWWWWWK..",
  "..KWVVVVVVVVWK..",
];
const EYES_OPEN = ["..KWVVLVVLVVWK..", "..KWVLVLLVLVWK.."];
const EYES_SHUT = ["..KWVVVVVVVVWK..", "..KWVLLLLLLLWK.."];
const VISOR_BOTTOM = "..KWVVVVVVVVWK..";

const ARMS_DOWN = ["KWKWWWWWWWWWWKWK", "KWKSWWWWWWWWSKWK", ".KKSSSSSSSSSSKK."];
const ARM_R_UP_TOP = ["..............KK", ".............KWK", "............KWK."]; // sobreposto nas linhas 5-7
const ARMS_R_UP = ["KWKWWWWWWWWWWK..", "KWKSWWWWWWWWSK..", ".KKSSSSSSSSSSK.."];
const ARMS_UP = ["..KWWWWWWWWWWK..", "..KSWWWWWWWWSK..", "..KSSSSSSSSSSK.."];
const BODY_BOTTOM = "...KKKKKKKKKK...";

const LEGS_STAND = ["....KWK..KWK....", "....KWK..KWK....", "...KKKK..KKKK...", "................"];
const LEGS_RUN_A = ["...KWK....KWK...", "..KWK......KWK..", "..KKK......KKK..", "................"];
const LEGS_RUN_B = ["....KWKKWK......", "....KWKKWK......", "...KKKKKKKK.....", "................"];
const LEGS_JUMP = ["....KWK..KWK....", "...KKK....KKK...", "................", "................"];

/** Sobrepõe `layer` a partir da linha `at`, sem apagar o que existe. */
function overlay(rows: string[], at: number, layer: string[]) {
  const out = [...rows];
  layer.forEach((line, i) => {
    const base = out[at + i].split("");
    line.split("").forEach((c, x) => {
      if (c !== ".") base[x] = c;
    });
    out[at + i] = base.join("");
  });
  return out;
}

function build(opts: { eyes?: "open" | "shut"; arms?: "down" | "rUp" | "up"; legs?: string[] }) {
  const eyes = opts.eyes === "shut" ? EYES_SHUT : EYES_OPEN;
  const arms = opts.arms === "up" ? ARMS_UP : opts.arms === "rUp" ? ARMS_R_UP : ARMS_DOWN;
  let rows = [...HEAD, ...eyes, VISOR_BOTTOM, ...arms, BODY_BOTTOM, ...(opts.legs ?? LEGS_STAND)];
  if (opts.arms === "rUp") rows = overlay(rows, 2, ARM_R_UP_TOP);
  if (opts.arms === "up") {
    rows = overlay(rows, 2, ARM_R_UP_TOP);
    rows = overlay(rows, 2, ARM_R_UP_TOP.map((l) => l.split("").reverse().join("")));
  }
  return rows;
}

export const POSES = {
  idle: build({}),
  blink: build({ eyes: "shut" }),
  wave1: build({ arms: "rUp" }),
  wave2: build({}),
  run1: build({ legs: LEGS_RUN_A }),
  run2: build({ legs: LEGS_RUN_B }),
  cheer: build({ arms: "up", legs: LEGS_JUMP }),
  cheer2: build({ arms: "up" }),
};
export type Pose = keyof typeof POSES;

/** Acessórios 8×8 desenhados ao lado da mão. */
export const PROPS: Record<string, string[]> = {
  bill: ["........", "GGGGGGGG", "GgggGggG", "GgGGGGgG", "GgggGggG", "GGGGGGGG", "........", "........"],
  coin: ["..yyyy..", ".yYYYYy.", "yYYyYYYy", "yYYyYYYy", "yYYyYYYy", ".yYYYYy.", "..yyyy..", "........"],
  magnifier: ["..KKK...", ".KCCCK..", "KCCWCCK.", "KCCCCCK.", ".KCCCK..", "..KKKBB.", "......BB", ".......B"],
  flag: ["KPPPP...", "KPPPPPP.", "KPPPP...", "K.......", "K.......", "K.......", "K.......", "K......."],
  clipboard: [".KKKK...", "KMMMMK..", "KWWWWK..", "KWKKWK..", "KWWWWK..", "KWKKWK..", "KWWWWK..", "KKKKKK.."],
  plug: ["..K..K..", "..K..K..", ".KKKKKK.", ".KOOOOK.", ".KOOOOK.", "..KKKK..", "...KK...", "...KK..."],
  calendar: ["KPKKPKK.", "KPPPPPK.", "KWWWWWK.", "KWKWKWK.", "KWWWWWK.", "KWKWLWK.", "KWWWWWK.", "KKKKKKK."],
  hammer: ["KMMMMK..", "KMMMMK..", "..KBK...", "..KBK...", "..KBK...", "..KBK...", "..KBK...", "..KKK..."],
  heart: [".PP.PP..", "PPPPPPP.", "PPPPPPP.", ".PPPPP..", "..PPP...", "...P....", "........", "........"],
  sparkle: ["...L....", "...L....", ".L.L.L..", "..LLL...", "LLLLLLL.", "..LLL...", ".L.L.L..", "...L...."],
};

export function Sprite({
  rows,
  className,
  title,
}: {
  rows: string[];
  className?: string;
  title?: string;
}) {
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      shapeRendering="crispEdges"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rows.flatMap((line, y) =>
        line.split("").map((c, x) =>
          c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={PALETTE[c] ?? c} />,
        ),
      )}
    </svg>
  );
}

/** Alterna entre poses num intervalo (animação quadro a quadro). */
export function useFrames(poses: Pose[], ms = 220, active = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active || poses.length < 2) return;
    const id = setInterval(() => setI((n) => (n + 1) % poses.length), ms);
    return () => clearInterval(id);
  }, [poses.length, ms, active]);
  return poses[i % poses.length];
}

/** Nivi parado, piscando de vez em quando. */
export function PixelNivi({ className, pose }: { className?: string; pose?: Pose }) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (pose) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2500 + Math.random() * 2500);
    };
    loop();
    return () => clearTimeout(t);
  }, [pose]);
  return <Sprite rows={POSES[pose ?? (blink ? "blink" : "idle")]} className={className} />;
}
