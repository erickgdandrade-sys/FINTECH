import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "nivo-theme";

/** Script que roda antes da página aparecer, para não piscar o tema errado. */
export const themeInitScript = `try{var t=localStorage.getItem('${KEY}');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const set = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* navegação privada: só não lembra a escolha */
    }
  };
  return { dark, setDark: set };
}

/** Interruptor estilo "chave": sol de um lado, lua do outro. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { dark, setDark } = useTheme();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      title={dark ? "Tema escuro" : "Tema claro"}
      onClick={() => setDark(!dark)}
      className={clsx(
        "relative inline-flex h-8 w-[60px] shrink-0 items-center justify-between rounded-full px-2 transition-colors duration-300",
        dark ? "bg-[#2b2450]" : "bg-[#ffe9a8]",
        className,
      )}
    >
      <Sun size={14} className={clsx("transition-opacity", dark ? "text-[#8c87ad] opacity-60" : "text-[#ff9f1c] opacity-0")} />
      <Moon size={14} className={clsx("transition-opacity", dark ? "text-[#c3bfdb] opacity-0" : "text-[#b58a1f] opacity-60")} />
      <span
        className={clsx(
          "absolute top-1 left-1 grid size-6 place-items-center rounded-full shadow-md transition-transform duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)]",
          dark ? "translate-x-[28px] bg-[#0c0820]" : "translate-x-0 bg-white",
        )}
      >
        {dark ? <Moon size={14} className="text-[#b8ff00]" fill="currentColor" /> : <Sun size={14} className="text-[#ff9f1c]" fill="currentColor" />}
      </span>
    </button>
  );
}
