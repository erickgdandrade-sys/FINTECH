import { createFileRoute, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { useState } from "react";
import { NivoLogo, NivoMark } from "@/components/brand";
import { LoginStage } from "@/components/nivi-stage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/entrar")({
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "entrar") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      } else {
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name } } });
        if (error) throw error;
        if (data.session) navigate({ to: "/contas" });
        else setMsg({ kind: "info", text: "Conta criada! Confirme o e-mail que enviamos e depois entre." });
      }
    } catch (err) {
      const text = err instanceof Error ? err.message : "Não foi possível entrar.";
      setMsg({
        kind: "error",
        text: /invalid login/i.test(text) ? "E-mail ou senha incorretos." : text,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="nivo-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        {/* N gigante ao fundo, como na identidade visual */}
        <NivoMark className="pointer-events-none absolute -top-16 -left-24 w-[120%] opacity-40" color="#3d0099" />
        <NivoLogo dark className="relative" />
        <div className="relative">
          <div className="-mx-12 mb-8">
            <LoginStage />
          </div>
          <h1 className="max-w-md text-[44px] leading-[1.05] font-bold tracking-[-0.04em]">
            Sua vida financeira em <span className="text-lime">outro nível.</span>
          </h1>
          <p className="mt-4 max-w-sm text-white/75">
            Conecte seus bancos pelo Open Finance e deixe o Nivi organizar tudo para você.
          </p>
        </div>
        <p className="relative text-[12px] text-white/50">Conexão segura via Pluggy · regulada pelo Banco Central</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <NivoLogo />
            <div className="nivo-gradient relative mt-5 overflow-hidden rounded-3xl">
              <NivoMark className="pointer-events-none absolute -top-6 -left-10 w-[110%] opacity-40" color="#3d0099" />
              <LoginStage className="h-44" size={80} />
            </div>
          </div>
          <h2 className="text-[26px] font-bold tracking-[-0.03em]">
            {mode === "entrar" ? "Entrar na sua conta" : "Criar sua conta"}
          </h2>
          <p className="mt-1 text-[14px] text-ink-3">
            {mode === "entrar" ? "Que bom te ver de novo." : "Leva menos de um minuto."}
          </p>

          {!isSupabaseConfigured ? (
            <p className="mt-6 rounded-2xl bg-orange-soft p-4 text-[14px] text-ink-2">
              O login ainda não está configurado. Preencha <code>VITE_SUPABASE_URL</code> e{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code>.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              {mode === "criar" && (
                <Field id="name" label="Nome" value={name} onChange={setName} autoComplete="name" />
              )}
              <Field id="email" label="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" />
              <Field
                id="password"
                label="Senha"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                minLength={6}
              />
              {msg && (
                <p
                  className={clsx(
                    "rounded-xl px-3 py-2 text-[13px]",
                    msg.kind === "error" ? "bg-pink-soft text-pink" : "bg-positive-soft text-positive",
                  )}
                >
                  {msg.text}
                </p>
              )}
              <button
                disabled={busy}
                className="h-12 w-full rounded-xl bg-lime text-[15px] font-bold text-ink hover:brightness-95 disabled:opacity-60"
              >
                {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            </form>
          )}

          {isSupabaseConfigured && (
          <p className="mt-6 text-center text-[14px] text-ink-3">
            {mode === "entrar" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "entrar" ? "criar" : "entrar");
                setMsg(null);
              }}
              className="font-semibold text-violet hover:underline"
            >
              {mode === "entrar" ? "Criar conta" : "Entrar"}
            </button>
          </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  ...rest
}: { id: string; label: string; value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
>) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-[13px] font-medium text-ink-2">{label}</span>
      <input
        id={id}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] outline-none focus:border-violet focus:ring-2 focus:ring-violet/20"
        {...rest}
      />
    </label>
  );
}
