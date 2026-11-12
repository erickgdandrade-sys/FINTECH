import clsx from "clsx";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { pace } from "@/lib/data";
import { Nivi } from "./brand";

type Msg = { from: "nivi" | "me"; text: string };

const suggestions = [
  "Quanto posso gastar hoje?",
  "Onde estou gastando mais?",
  "Como bater minha meta?",
];

/** Respostas locais de demonstração — troque por uma chamada ao seu backend de IA. */
function reply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("hoje") || s.includes("gastar"))
    return `Para fechar o mês dentro dos R$ 3.000, você pode gastar até R$ ${pace.perDay} por dia nos próximos ${pace.remainingDays} dias. 💜`;
  if (s.includes("mais") || s.includes("onde"))
    return "Seu maior gasto variável é Delivery: R$ 1.067 (12,5% do total), já R$ 167 acima do limite. Quer que eu crie um alerta?";
  if (s.includes("meta"))
    return "A Viagem Chile está 93% concluída. Com R$ 250 por semana você chega lá em 4 semanas — antes do prazo! ✈️";
  return "Ainda estou aprendendo sobre isso. Tente perguntar sobre seus gastos, metas ou orçamento do mês.";
}

export function NiviFab() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "nivi", text: "Oi! Eu sou o Nivi 👋 Analisei suas finanças. Como posso ajudar?" },
  ]);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "me", text: t }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { from: "nivi", text: reply(t) }]);
    }, 700);
  };

  return (
    <>
      <div
        className={clsx(
          "fixed right-4 bottom-24 z-40 flex w-[min(380px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_60px_-20px_rgb(11_6_48/0.35)] ring-1 ring-line transition-all duration-200 sm:right-6",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0",
        )}
        role="dialog"
        aria-label="Chat com o Nivi"
        aria-hidden={!open}
      >
        <div className="nivo-gradient flex items-center gap-3 px-5 py-4 text-white">
          <Nivi className="size-11" sparkle={false} />
          <div className="flex-1">
            <p className="flex items-center gap-1.5 font-bold">
              Nivi <Sparkles size={14} className="text-lime" />
            </p>
            <p className="text-[12px] text-white/70">Seu assistente financeiro com IA</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Fechar chat"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className="h-[320px] space-y-3 overflow-y-auto bg-canvas px-4 py-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={clsx(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug",
                m.from === "nivi"
                  ? "rounded-tl-md bg-white text-ink shadow-sm"
                  : "ml-auto rounded-tr-md bg-violet text-white",
              )}
            >
              {m.text}
            </div>
          ))}
          {typing && (
            <div className="flex w-14 gap-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-3 shadow-sm">
              {[0, 1, 2].map((d) => (
                <span
                  key={d}
                  className="size-1.5 animate-bounce rounded-full bg-violet"
                  style={{ animationDelay: `${d * 120}ms` }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto border-t border-line px-4 pt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="shrink-0 rounded-full bg-violet-soft px-3 py-1.5 text-[12px] font-medium text-violet hover:bg-violet hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao Nivi…"
            className="h-11 flex-1 rounded-xl bg-canvas px-4 text-[14px] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-violet/30"
          />
          <button
            type="submit"
            className="grid size-11 place-items-center rounded-xl bg-lime text-ink hover:brightness-95 disabled:opacity-40"
            disabled={!input.trim()}
            aria-label="Enviar"
          >
            <ArrowUp size={18} strokeWidth={2.6} />
          </button>
        </form>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="nivo-gradient fixed right-4 bottom-5 z-40 flex h-14 items-center gap-2 rounded-full pr-5 pl-2 text-white shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 sm:right-6"
        aria-expanded={open}
        aria-label="Falar com o Nivi"
      >
        <span className="grid size-11 place-items-center rounded-full bg-white/10">
          <Nivi className="size-9" sparkle={false} />
        </span>
        <span className="text-[14px] font-bold">Nivi</span>
        <Sparkles size={15} className="text-lime" />
      </button>
    </>
  );
}
