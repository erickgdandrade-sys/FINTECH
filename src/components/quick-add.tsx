import { useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { CalendarPlus, Landmark, Plus, Repeat, Target, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Intenção de ação rápida, lida pela página de destino ao abrir. */
export type QuickIntent = "meta" | "assinatura" | "parcelado" | "banco";
const KEY = "nivo-acao-rapida";

export function takeQuickIntent(expected: QuickIntent[]): QuickIntent | null {
  try {
    const v = sessionStorage.getItem(KEY) as QuickIntent | null;
    if (v && expected.includes(v)) {
      sessionStorage.removeItem(KEY);
      return v;
    }
  } catch {
    /* sem armazenamento */
  }
  return null;
}

const actions: { intent: QuickIntent; to: string; label: string; hint: string; icon: LucideIcon; color: string }[] = [
  { intent: "meta", to: "/metas", label: "Nova meta", hint: "Viagem, reserva, carro…", icon: Target, color: "#ff6b00" },
  { intent: "assinatura", to: "/recorrencias", label: "Assinatura ou conta fixa", hint: "Netflix, academia, aluguel…", icon: Repeat, color: "#6a00ff" },
  { intent: "parcelado", to: "/recorrencias", label: "Compra parcelada", hint: "Com data da última parcela", icon: CalendarPlus, color: "#ff007a" },
  { intent: "banco", to: "/contas", label: "Conectar banco", hint: "Open Finance via Pluggy", icon: Landmark, color: "#0e9f5a" },
];

/** Botão "+" com ações rápidas. */
export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Adicionar"
        className="flex h-10 items-center gap-1.5 rounded-xl bg-lime px-3 text-[14px] font-bold text-ink shadow-[0_6px_16px_-8px_rgb(140_200_0)] hover:brightness-95 sm:px-3.5"
      >
        <Plus size={18} strokeWidth={2.6} className={clsx("transition-transform", open && "rotate-45")} />
        <span className="hidden sm:inline">Adicionar</span>
      </button>
      {open && (
        <div className="rise absolute top-12 right-0 z-50 w-[min(300px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_48px_-16px_rgb(11_6_48/0.35)]">
          {actions.map(({ intent, to, label, hint, icon: Icon, color }) => (
            <button
              key={intent}
              onClick={() => {
                try {
                  sessionStorage.setItem(KEY, intent);
                } catch {
                  /* ignora */
                }
                setOpen(false);
                navigate({ to });
                // Já está na página de destino: avisa para abrir o formulário agora.
                window.dispatchEvent(new Event("nivo:acao-rapida"));
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-canvas"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl" style={{ background: `${color}1f`, color }}>
                <Icon size={18} />
              </span>
              <span>
                <span className="block text-[14px] font-semibold">{label}</span>
                <span className="block text-[12px] text-ink-3">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hook para páginas: executa `fn` quando houver uma ação rápida pendente para elas. */
export function useQuickIntent(expected: QuickIntent[], fn: (intent: QuickIntent) => void, enabled = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const check = () => {
      const i = takeQuickIntent(expected);
      if (i) fnRef.current(i);
    };
    check();
    window.addEventListener("nivo:acao-rapida", check);
    return () => window.removeEventListener("nivo:acao-rapida", check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, expected.join()]);
}
