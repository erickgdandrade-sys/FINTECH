import clsx from "clsx";

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

/** Nivi — assistente financeiro com IA. */
export function Nivi({ className, sparkle = true }: { className?: string; sparkle?: boolean }) {
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden="true">
      {sparkle && (
        <g stroke="#b8ff00" strokeWidth="6" strokeLinecap="round">
          <path d="M96 10 L90 24" />
          <path d="M110 22 L98 30" />
        </g>
      )}
      {/* antenas */}
      <rect x="38" y="8" width="11" height="20" rx="3" fill="#fff" />
      <rect x="62" y="8" width="11" height="20" rx="3" fill="#fff" />
      {/* braços */}
      <rect x="8" y="50" width="18" height="14" rx="4" fill="#fff" />
      <rect x="86" y="50" width="18" height="14" rx="4" fill="#fff" />
      {/* pés */}
      <rect x="36" y="86" width="13" height="18" rx="3" fill="#fff" />
      <rect x="63" y="86" width="13" height="18" rx="3" fill="#fff" />
      {/* corpo */}
      <rect x="22" y="24" width="68" height="66" rx="20" fill="#fff" />
      <rect x="22" y="24" width="68" height="66" rx="20" fill="url(#niviShade)" />
      {/* visor */}
      <rect x="32" y="38" width="48" height="32" rx="10" fill="#1a0a5c" />
      <g className="nivi-eyes" stroke="#b8ff00" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M41 58 a6 6 0 0 1 12 0" />
        <path d="M59 58 a6 6 0 0 1 12 0" />
      </g>
      <defs>
        <linearGradient id="niviShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#d9d3f5" stopOpacity="0.7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
