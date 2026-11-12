import { Link, createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, CreditCard, Landmark, Loader2, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Money, PageHeader } from "@/components/app-shell";
import { BankLogo } from "@/components/bank-logo";
import { Nivi } from "@/components/brand";
import { useQuickIntent } from "@/components/quick-add";
import { useFinance, type ItemRow } from "@/lib/finance";
import { money } from "@/lib/format";
import { createConnectToken, disconnectItem, refreshItem, registerItem } from "@/lib/open-finance";

// O widget da Pluggy só funciona no navegador: carregamos sob demanda.
const PluggyConnect = lazy(() => import("react-pluggy-connect").then((m) => ({ default: m.PluggyConnect })));

const includeSandbox = import.meta.env.VITE_PLUGGY_SANDBOX === "true";

export const Route = createFileRoute("/contas")({
  component: Accounts,
});

const statusInfo: Record<string, { label: string; tone: "ok" | "busy" | "warn" }> = {
  UPDATED: { label: "Atualizado", tone: "ok" },
  UPDATING: { label: "Sincronizando…", tone: "busy" },
  MERGING: { label: "Sincronizando…", tone: "busy" },
  WAITING_USER_INPUT: { label: "Aguardando você", tone: "warn" },
  WAITING_USER_ACTION: { label: "Ação necessária no banco", tone: "warn" },
  LOGIN_ERROR: { label: "Erro de login — reconecte", tone: "warn" },
  OUTDATED: { label: "Desatualizado", tone: "warn" },
};

function Accounts() {
  const { configured, session, items, accounts, reload } = useFinance();
  const [connect, setConnect] = useState<{ token: string; updateItem?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const token = session?.access_token ?? "";

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
      await reload();
      if (ok) setNotice({ kind: "ok", text: ok });
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
            ? String((err as { message: unknown }).message)
            : "Algo deu errado.";
      setNotice({ kind: "error", text });
    } finally {
      setBusy(null);
    }
  }

  const openConnect = (itemId?: string) =>
    run("connect", async () => {
      const { connectToken } = await createConnectToken({ data: { accessToken: token, itemId } });
      setConnect({ token: connectToken, updateItem: itemId });
    });

  useQuickIntent(["banco"], () => openConnect(), Boolean(configured && session));

  if (!configured || !session) {
    return (
      <>
        <PageHeader title="Contas" />
        <div className="card rise flex flex-col items-center px-6 py-14 text-center">
          <span className="nivo-gradient grid size-20 place-items-center rounded-[24px]">
            <Nivi className="size-16" />
          </span>
          <h2 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">Conecte seus bancos com o Open Finance</h2>
          <p className="mt-2 max-w-md text-[14px] text-ink-2">
            {configured
              ? "Entre na sua conta para conectar bancos e cartões. Seus dados chegam automaticamente, sem planilhas."
              : "O Open Finance ainda não está configurado neste ambiente. Preencha o arquivo .env (veja .env.example)."}
          </p>
          {configured && (
            <Link to="/entrar" className="mt-6 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-ink hover:brightness-95">
              Entrar ou criar conta
            </Link>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Contas"
        subtitle="Bancos e cartões conectados pelo Open Finance"
        actions={
          <button
            onClick={() => openConnect()}
            disabled={busy === "connect"}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-violet px-3.5 text-[14px] font-bold text-white hover:brightness-110 disabled:opacity-60"
          >
            {busy === "connect" ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
            Conectar banco
          </button>
        }
      />

      {notice && (
        <p
          className={clsx(
            "rise mb-4 rounded-2xl px-4 py-3 text-[14px]",
            notice.kind === "ok" ? "bg-positive-soft text-positive" : "bg-pink-soft text-pink",
          )}
        >
          {notice.text}
        </p>
      )}

      {items.length === 0 ? (
        <div className="card rise flex flex-col items-center px-6 py-14 text-center">
          <Landmark size={36} className="text-violet" />
          <h2 className="mt-4 text-[18px] font-bold">Nenhum banco conectado ainda</h2>
          <p className="mt-1 max-w-md text-[14px] text-ink-2">
            Conecte sua conta e seus cartões para o Nivo importar saldos e transações dos últimos 12 meses.
          </p>
          <button
            onClick={() => openConnect()}
            className="mt-6 rounded-xl bg-lime px-5 py-2.5 text-[14px] font-bold text-ink hover:brightness-95"
          >
            Conectar meu primeiro banco
          </button>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              accounts={accounts.filter((a) => a.item_id === item.id)}
              busy={busy}
              onRefresh={() =>
                run(`refresh:${item.id}`, () => refreshItem({ data: { accessToken: token, itemId: item.id } }), "Dados atualizados.")
              }
              onReconnect={() => openConnect(item.id)}
              onRemove={() =>
                run(`remove:${item.id}`, () => disconnectItem({ data: { accessToken: token, itemId: item.id } }), "Banco desconectado.")
              }
            />
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-2 text-[12px] text-ink-3">
        <ShieldCheck size={14} className="text-positive" />
        O Nivo só tem acesso de leitura. Nenhuma movimentação pode ser feita pelo app.
      </p>

      {connect && (
        <Suspense fallback={null}>
          <PluggyConnect
            connectToken={connect.token}
            includeSandbox={includeSandbox}
            updateItem={connect.updateItem}
            language="pt"
            countries={["BR"]}
            onSuccess={async ({ item }) => {
              setConnect(null);
              await run(
                "register",
                () => registerItem({ data: { accessToken: token, itemId: item.id } }),
                `${item.connector.name} conectado! Importando suas transações…`,
              );
            }}
            onError={({ message }) => setNotice({ kind: "error", text: message })}
            onClose={() => setConnect(null)}
          />
        </Suspense>
      )}
    </>
  );
}

function ItemCard({
  item,
  accounts,
  busy,
  onRefresh,
  onReconnect,
  onRemove,
}: {
  item: ItemRow;
  accounts: ReturnType<typeof useFinance>["accounts"];
  busy: string | null;
  onRefresh: () => void;
  onReconnect: () => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const st = statusInfo[item.status] ?? { label: item.status, tone: "warn" as const };
  return (
    <article className="card rise p-5 sm:p-6">
      <header className="flex items-center gap-3">
        <BankLogo name={item.connector_name} logo={item.connector_image} color={item.primary_color ?? "#6a00ff"} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[16px] font-bold">{item.connector_name}</h2>
          <p
            className={clsx(
              "flex items-center gap-1 text-[12px] font-medium",
              st.tone === "ok" && "text-positive",
              st.tone === "busy" && "text-violet",
              st.tone === "warn" && "text-orange",
            )}
          >
            {st.tone === "ok" && <CheckCircle2 size={13} />}
            {st.tone === "busy" && <Loader2 size={13} className="animate-spin" />}
            {st.tone === "warn" && <AlertTriangle size={13} />}
            {st.label}
            {item.last_synced_at && (
              <span className="font-normal text-ink-3">
                {" "}
                · {new Date(item.last_synced_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </p>
        </div>
      </header>

      <ul className="mt-4 divide-y divide-line/70">
        {accounts.length === 0 && <li className="py-3 text-[13px] text-ink-3">Importando contas…</li>}
        {accounts.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <span className="grid size-9 place-items-center rounded-xl bg-canvas text-ink-2">
              {a.type === "CREDIT" ? <CreditCard size={17} /> : <Landmark size={17} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{a.name}</p>
              <p className="text-[12px] text-ink-3">
                {a.type === "CREDIT"
                  ? a.available_credit_limit != null
                    ? `Limite disponível ${money(a.available_credit_limit)}`
                    : "Cartão de crédito"
                  : a.subtype === "SAVINGS_ACCOUNT"
                    ? "Poupança"
                    : "Conta corrente"}
              </p>
            </div>
            <div className="text-right">
              <Money className="block text-[15px] font-bold">{money(a.balance)}</Money>
              {a.type === "CREDIT" && <span className="text-[11px] text-ink-3">fatura atual</span>}
            </div>
          </li>
        ))}
      </ul>

      <footer className="mt-4 flex flex-wrap gap-2">
        {st.tone === "warn" ? (
          <button onClick={onReconnect} className="rounded-xl bg-orange px-3 py-2 text-[13px] font-semibold text-white">
            Reconectar
          </button>
        ) : (
          <button
            onClick={onRefresh}
            disabled={busy === `refresh:${item.id}`}
            className="flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-2 text-[13px] font-semibold text-ink-2 hover:text-ink disabled:opacity-60"
          >
            <RefreshCw size={14} className={clsx(busy === `refresh:${item.id}` && "animate-spin")} />
            Atualizar
          </button>
        )}
        {confirming ? (
          <span className="ml-auto flex items-center gap-2 text-[13px]">
            Desconectar e apagar os dados?
            <button onClick={onRemove} className="rounded-xl bg-pink px-3 py-2 font-semibold text-white">
              Sim, desconectar
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-xl px-3 py-2 font-semibold text-ink-3">
              Cancelar
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-3 hover:bg-pink-soft hover:text-pink"
          >
            <Trash2 size={14} /> Desconectar
          </button>
        )}
      </footer>
    </article>
  );
}
