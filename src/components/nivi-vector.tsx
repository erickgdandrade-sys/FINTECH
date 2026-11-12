/**
 * Nivi vetorial (fiel à identidade visual), com partes animáveis:
 * antenas, corpo, visor, olhos, braços e pernas.
 * Poses: idle (pisca), wave (acena), run (corre), cheer (comemora), think (pensa).
 */
import clsx from "clsx";
import { useId } from "react";

export type NiviPose = "idle" | "wave" | "run" | "cheer" | "think";

const INK = "#1d0b5e";
const LIME = "#b8ff00";

export function NiviVector({
  pose = "idle",
  sparkle = false,
  className,
  title,
}: {
  pose?: NiviPose;
  sparkle?: boolean;
  className?: string;
  title?: string;
}) {
  // IDs únicos por instância: um <svg> escondido (display:none) não pode "emprestar" o degradê aos outros.
  const uid = useId().replace(/:/g, "");
  const body = `nvb-${uid}`;
  const visor = `nvv-${uid}`;
  return (
    <svg
      viewBox="0 0 116 110"
      className={clsx("nv", `nv-${pose}`, className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.72" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e4def7" />
        </linearGradient>
        <linearGradient id={visor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26107a" />
          <stop offset="1" stopColor={INK} />
        </linearGradient>
      </defs>

      {sparkle && (
        <g className="nv-sparks" stroke={LIME} strokeWidth="4.6" strokeLinecap="round">
          <path d="M92 6 L88 18.5" />
          <path d="M106.5 11.5 L95.5 23" />
          <path d="M112 24.5 L98.5 29.5" />
        </g>
      )}

      {/* sombra no chão */}
      <ellipse className="nv-shadow" cx="58" cy="107" rx="26" ry="3" fill="#0b0630" opacity="0.18" />

      <g className="nv-bodywrap">
        {/* pernas */}
        <g fill={`url(#${body})`}>
          <rect className="nv-leg-l" x="33" y="82" width="12" height="22" rx="2.5" />
          <rect className="nv-leg-r" x="60" y="82" width="12" height="22" rx="2.5" />
        </g>
        {/* braços (as "orelhas" laterais) */}
        <rect className="nv-arm-l" x="4" y="63" width="17" height="12" rx="2.5" fill="#fff" />
        <rect className="nv-arm-r" x="94" y="63" width="17" height="12" rx="2.5" fill="#fff" />
        {/* antenas */}
        <g className="nv-antennas" fill="#fff">
          <rect x="41" y="18" width="7.5" height="18" rx="2" />
          <rect x="60" y="18" width="7.5" height="18" rx="2" />
        </g>
        {/* corpo */}
        <rect x="18" y="32" width="77" height="56" rx="13" fill={`url(#${body})`} />
        {/* visor */}
        <rect x="27" y="43" width="59" height="34" rx="7" fill={`url(#${visor})`} />
        {/* olhos ^ ^ */}
        <g className="nv-eyes" fill="none" stroke={LIME} strokeWidth="3.6" strokeLinecap="round">
          <path d="M37 64 a7 7 0 0 1 14 0" />
          <path d="M62 64 a7 7 0 0 1 14 0" />
        </g>
      </g>
    </svg>
  );
}
