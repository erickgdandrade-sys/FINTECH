import clsx from "clsx";
import { useId } from "react";
import { NiviVector } from "./nivi-vector";

/**
 * Marca "N" da Nivo: três traços inclinados (/ \ /) grossos, com cortes retos
 * em cima e embaixo e junções arredondadas, como na identidade visual.
 */
export function NivoMark({ className, color = "currentColor" }: { className?: string; color?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 112 64" className={className} aria-hidden="true">
      <defs>
        <clipPath id={`nm-${id}`}>
          <rect x="0" y="0" width="112" height="64" rx="3" />
        </clipPath>
      </defs>
      <path
        d="M5.5 77 L35.5 16.9 Q40 8 46 16 L65.5 42 Q71.5 50 76 41 L106 -19"
        fill="none"
        stroke={color}
        strokeWidth="24"
        strokeLinejoin="round"
        clipPath={`url(#nm-${id})`}
      />
    </svg>
  );
}

/** Ícone do app: quadrado arredondado limão com o N escuro. */
export function NivoAppIcon({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-grid place-items-center rounded-[26%] bg-lime shadow-[0_8px_18px_-8px_rgb(140_200_0/0.9)]",
        className,
      )}
    >
      <NivoMark className="w-[64%]" color="#1d0b5e" />
    </span>
  );
}

/** Logotipo: marca N limão + "Nivo" na fonte da marca. */
export function NivoLogo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <NivoMark className="h-[22px] w-auto" color="#b8ff00" />
      <span className={clsx("font-brand text-[29px] leading-none font-extrabold tracking-[-0.03em]", dark ? "text-white" : "text-ink")}>
        Nivo
      </span>
    </span>
  );
}

/** Nivi — assistente financeiro com IA (vetorial, pisca e respira). */
export function Nivi({ className, sparkle = true }: { className?: string; sparkle?: boolean }) {
  return <NiviVector pose="idle" sparkle={sparkle} className={className} />;
}
