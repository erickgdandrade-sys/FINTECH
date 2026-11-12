import clsx from "clsx";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Fragment, type ReactNode } from "react";
import { pace } from "@/lib/data";
import { useFinance } from "@/lib/finance";
import { chatWithNivi } from "@/lib/nivi-api";
import { Nivi } from "./brand";

type Msg = { from: "nivi" | "me"; text: string; error?: boolean };

const demoSuggestions = ["Quanto posso gastar hoje?", "Onde estou gastando mais?", "Como bater minha meta?"];
const liveSuggestions = [
  "Quanto posso gastar por dia até o fim do mês?",
  "Onde estou gastando mais?",
  "Quais assinaturas eu pago?",
  "Como economizar R$ 500 por mês?",
];

/** Formata a resposta: **negrito**, listas com "- " e quebras de linha. */
function Rich({ text }: { text: string }) {
  const inline = (line: string): ReactNode[] =>
    line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
    );
  const lines = text.split("\n").filter((l, i, a) => l.trim() || (i > 0 && a[i - 1].trim()));
  return (
    <>
      {lines.map((l, i) => {
        const bullet = /^\s*[-*•]\s+/.test(l);
        return bullet ? (
          <span key={i} className="flex gap-1.5 pl-1">
            <span className="text-violet">•</span>
            <span>{inline(l.replace(/^\s*[-*•]\s+/, ""))}</span>
          </span>
        ) : (
          <span key={i} className="block">
            {inline(l.replace(/^#+\s*/, ""))}
          </span>
        );
      })}
    </>
  );
}

/** Respostas locais do modo demonstração (sem login). */
function demoReply(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("hoje") || s.includes("gastar"))
    return `Para fechar o mês dentro dos R$ 3.000, você pode gastar até R$ ${pace.perDay} por dia nos próximos ${pace.remainingDays} dias.`;
  if (s.includes("mais") || s.includes("onde"))
    return "Seu maior gasto variável é Delivery: R$ 1.067 (12,5% do total), já R$ 167 acima do limite. Quer que eu crie um alerta?";
  if (s.includes("meta"))
    return "A Viagem Chile está 93% concluída. Com R$ 250 por semana você chega lá em 4 semanas, antes do prazo.";
  return "Ainda estou aprendendo sobre isso. Tente perguntar sobre seus gastos, metas ou orçamento do mês.";
}

export function NiviFab() {
  const { session, mode } = useFinance();
  const live = Boolean(session);
  const suggestions = live ? liveSuggestions : demoSuggestions;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "nivi", text: "Oi! Eu sou o Nivi. Pergunte qualquer coisa sobre seus gastos, contas e metas." },
  ]);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("nivi:open", open);
    return () => window.removeEventListener("nivi:open", open);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    const next = [...msgs, { from: "me" as const, text: t }];
    setMsgs(next);
    setInput("");
    setTyping(true);

    if (!live || !session) {
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => [...m, { from: "nivi", text: demoReply(t) }]);
      }, 700);
      return;
    }

    try {
      // Envia o histórico (sem a saudação inicial e sem mensagens de erro).
      const history = next
        .slice(1)
        .filter((m) => !m.error)
        .map((m) => ({ role: m.from === "me" ? ("user" as const) : ("model" as const), text: m.text }));
      const res = await chatWithNivi({ data: { accessToken: session.access_token, history } });
      setMsgs((m) => [
        ...m,
        "reply" in res && res.reply
          ? { from: "nivi", text: res.reply }
          : { from: "nivi", text: ("error" in res && res.error) || "Algo deu errado.", error: true },
      ]);
    } catch {
      setMsgs((m) => [...m, { from: "nivi", text: "Não consegui me conectar agora. Tente de novo.", error: true }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      <div
        className={clsx(
          "fixed right-4 bottom-40 z-40 flex h-[min(540px,calc(100dvh-12rem))] w-[min(380px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-surface shadow-[0_30px_60px_-20px_rgb(11_6_48/0.35)] ring-1 ring-line transition-all duration-200 sm:right-6 lg:bottom-24 lg:h-[min(540px,calc(100dvh-8rem))]",
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
            <p className="text-[12px] text-white/70">
              {live ? (mode === "live" ? "Analisando seus dados reais" : "Conecte um banco para análises") : "Modo demonstração"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-full bg-surface/15 hover:bg-surface/25"
            aria-label="Fechar chat"
          >
            <X size={16} />
          </button>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={clsx(
                "max-w-[85%] space-y-1 rounded-2xl px-3.5 py-2.5 text-[14px] leading-snug",
                m.from === "nivi"
                  ? m.error
                    ? "rounded-tl-md bg-pink-soft text-pink"
                    : "rounded-tl-md bg-surface text-ink shadow-sm"
                  : "ml-auto rounded-tr-md bg-violet text-white",
              )}
            >
              {m.from === "nivi" ? <Rich text={m.text} /> : m.text}
            </div>
          ))}
          {typing && (
            <div className="flex w-14 gap-1 rounded-2xl rounded-tl-md bg-surface px-3.5 py-3 shadow-sm">
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
            disabled={!input.trim() || typing}
            aria-label="Enviar"
          >
            <ArrowUp size={18} strokeWidth={2.6} />
          </button>
        </form>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="nivo-gradient fixed right-4 bottom-24 z-40 flex h-12 items-center gap-2 rounded-full pr-1.5 pl-1.5 lg:h-14 lg:pl-2 lg:bottom-5 lg:pr-5 text-white shadow-[var(--shadow-pop)] transition-transform hover:-translate-y-0.5 sm:right-6"
        aria-expanded={open}
        aria-label="Falar com o Nivi"
      >
        <span className="grid size-11 place-items-center rounded-full bg-surface/10">
          <Nivi className="size-9" sparkle={false} />
        </span>
        <span className="hidden text-[14px] font-bold lg:inline">Nivi</span>
        <Sparkles size={15} className="hidden text-lime lg:inline" />
      </button>
    </>
  );
}
