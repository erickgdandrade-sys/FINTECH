import clsx from "clsx";
import { PROPS, PixelNivi, Sprite } from "./pixel-nivi";

/** Marca "N" da Nivo — traço em zigue-zague ascendente (nível). */
export function NivoMark({ className, color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 64 44" className={className} aria-hidden="true">
      <path
        d="M6 38 L20 8 L36 34 L52 6"
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NivoAppIcon({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-grid place-items-center rounded-[28%] bg-lime shadow-[0_6px_16px_-6px_rgb(184_255_0/0.9)]",
        className,
      )}
    >
      <NivoMark className="w-[62%]" color="#1a0a5c" />
    </span>
  );
}

export function NivoLogo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <NivoMark className="h-6 w-auto" color="#b8ff00" />
      <span className={clsx("text-[22px] font-extrabold tracking-[-0.04em]", dark ? "text-white" : "text-ink")}>
        Nivo
      </span>
    </span>
  );
}

/** Nivi — assistente financeiro com IA, em pixel art (pisca sozinho). */
export function Nivi({ className, sparkle = true }: { className?: string; sparkle?: boolean }) {
  return (
    <span
      className={clsx(
        "inline-block [image-rendering:pixelated]",
        !/\b(absolute|fixed)\b/.test(className ?? "") && "relative",
        className,
      )}
      aria-hidden="true"
    >
      <PixelNivi className="absolute inset-[6%] size-[88%]" />
      {sparkle && <Sprite rows={PROPS.sparkle} className="absolute -top-[4%] -right-[6%] size-[30%] nivi-twinkle" />}
    </span>
  );
}
