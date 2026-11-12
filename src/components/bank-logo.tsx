import clsx from "clsx";
import { useState } from "react";

/** Logo do banco (vindo da Pluggy) num quadrado com a cor do banco; sem logo, mostra a inicial. */
export function BankLogo({
  name,
  logo,
  color,
  size = "md",
  className,
}: {
  name: string;
  logo: string | null;
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const box = { xs: "size-6 rounded-md text-[10px]", sm: "size-8 rounded-lg text-[12px]", md: "size-10 rounded-xl text-[14px]", lg: "size-12 rounded-2xl text-[16px]" }[size];
  return (
    <span
      className={clsx("grid shrink-0 place-items-center overflow-hidden font-bold text-white ring-2 ring-surface", box, className)}
      style={{ background: color }}
      title={name}
    >
      {logo && !failed ? (
        <img src={logo} alt={name} className="size-[70%] object-contain" onError={() => setFailed(true)} loading="lazy" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
