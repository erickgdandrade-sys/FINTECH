/**
 * Funções de servidor do Open Finance. São chamadas pelo app como funções comuns,
 * mas o corpo de cada handler roda só no servidor (as chaves nunca vão para o navegador).
 */
import { createServerFn } from "@tanstack/react-start";
import { getPluggy, requireUser } from "@/server/clients";
import { serverEnv } from "@/server/env";
import { removeItem, syncItem } from "@/server/sync";

type Auth = { accessToken: string };

const withAuth = <T extends object>(input: unknown) => {
  const d = input as Auth & T;
  if (!d || typeof d.accessToken !== "string") throw new Error("Sessão ausente.");
  return d;
};

/** Gera o token temporário que o widget Pluggy Connect usa no navegador. */
export const createConnectToken = createServerFn({ method: "POST" })
  .validator((input: unknown) => withAuth<{ itemId?: string }>(input))
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    const { accessToken } = await getPluggy().createConnectToken(data.itemId, {
      clientUserId: user.id,
      webhookUrl: serverEnv.webhookUrl,
      avoidDuplicates: true,
    });
    return { connectToken: accessToken };
  });

/** Chamada quando o widget termina com sucesso: salva a conexão e importa os dados. */
export const registerItem = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    const d = withAuth<{ itemId: string }>(input);
    if (typeof d.itemId !== "string") throw new Error("itemId inválido.");
    return d;
  })
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    const r = await syncItem(data.itemId, user.id);
    return { status: r.item.status, accounts: r.accounts, transactions: r.transactions };
  });

/** Pede para a Pluggy buscar dados novos no banco e sincroniza o que já estiver pronto. */
export const refreshItem = createServerFn({ method: "POST" })
  .validator((input: unknown) => withAuth<{ itemId: string }>(input))
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    await getPluggy().updateItem(data.itemId);
    const r = await syncItem(data.itemId, user.id);
    return { status: r.item.status };
  });

export const disconnectItem = createServerFn({ method: "POST" })
  .validator((input: unknown) => withAuth<{ itemId: string }>(input))
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    await removeItem(data.itemId, user.id);
    return { ok: true };
  });
