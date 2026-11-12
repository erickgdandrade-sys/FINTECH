import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className,
  delay = 0,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section className={clsx("card rise p-5 sm:p-6", className)} style={{ animationDelay: `${delay}ms` }}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-[14px] font-medium text-ink-2">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function Delta({ value, suffix = "%", invert = false }: { value: number; suffix?: string; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular",
        good ? "bg-positive-soft text-positive" : "bg-pink-soft text-pink",
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
      {up ? "+" : ""}
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

export function Progress({ value, color = "var(--color-violet)", className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={clsx("h-2 overflow-hidden rounded-full bg-line", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", className)}>
      {children}
    </span>
  );
}
