import clsx from "clsx";
import { useState } from "react";
import { bankLogoCandidates } from "@/lib/bank-logos";

/**
 * Logo do banco num quadrado branco arredondado.
 * Tenta a imagem da Pluggy, depois o ícone oficial do site do banco; sem logo, mostra a inicial na cor do banco.
 */
export function BankLogo({
  name,
  bank,
  logo,
  color,
  size = "md",
  className,
}: {
  /** Texto do tooltip. */
  name: string;
  /** Nome do banco usado para achar o logo (padrão: `name`). */
  bank?: string;
  logo: string | null;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const candidates = bankLogoCandidates(bank ?? name, logo);
  const [i, setI] = useState(0);
  const src = candidates[i];
  const box = {
    xs: "size-6 rounded-md text-[10px]",
    sm: "size-8 rounded-lg text-[12px]",
    md: "size-10 rounded-xl text-[14px]",
    lg: "size-12 rounded-2xl text-[16px]",
  }[size];
  return (
    <span
      className={clsx(
        "grid shrink-0 place-items-center overflow-hidden font-bold text-white ring-2 ring-surface",
        src ? "bg-white" : "",
        box,
        className,
      )}
      style={src ? { boxShadow: "inset 0 0 0 1px rgb(11 6 48 / 0.08)" } : { background: color }}
      title={name}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={bank ?? name}
          className="size-[74%] object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setI((n) => n + 1)}
        />
      ) : (
        (bank ?? name).charAt(0).toUpperCase()
      )}
    </span>
  );
}
