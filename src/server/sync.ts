import type { Account, Item, Transaction } from "pluggy-sdk";
import { getAdmin, getPluggy } from "./clients";

/** Quantos meses de histórico importar na primeira sincronização. */
const HISTORY_MONTHS = 12;
const CHUNK = 500;

const isoDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 10) : null;

async function upsertChunks(table: string, rows: Record<string, unknown>[]) {
  const db = getAdmin();
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`Erro ao salvar ${table}: ${error.message}`);
  }
}

function itemRow(item: Item, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    connector_id: item.connector.id,
    connector_name: item.connector.name,
    connector_image: item.connector.imageUrl,
    primary_color: item.connector.primaryColor ? `#${item.connector.primaryColor.replace("#", "")}` : null,
    status: item.status,
    execution_status: item.executionStatus,
    error_message: item.error?.message ?? null,
  };
}

function accountRow(a: Account, userId: string) {
  return {
    id: a.id,
    item_id: a.itemId,
    user_id: userId,
    type: a.type,
    subtype: a.subtype,
    name: a.marketingName ?? a.name,
    number: a.number,
    balance: a.balance,
    currency_code: a.currencyCode,
    credit_limit: a.creditData?.creditLimit ?? null,
    available_credit_limit: a.creditData?.availableCreditLimit ?? null,
    balance_due_date: isoDate(a.creditData?.balanceDueDate),
    balance_close_date: isoDate(a.creditData?.balanceCloseDate),
    minimum_payment: a.creditData?.minimumPayment ?? null,
    updated_at: new Date().toISOString(),
  };
}

function transactionRow(t: Transaction, itemId: string, userId: string) {
  // Normaliza o sinal: saída sempre negativa, entrada sempre positiva.
  const abs = Math.abs(t.amount);
  const meta = t.creditCardMetadata;
  return {
    id: t.id,
    account_id: t.accountId,
    item_id: itemId,
    user_id: userId,
    date: isoDate(t.date),
    description: t.description,
    amount: t.type === "DEBIT" ? -abs : abs,
    type: t.type,
    category: t.category,
    category_id: t.categoryId,
    status: t.status ?? null,
    merchant_name: t.merchant?.name ?? t.merchant?.businessName ?? null,
    installment:
      meta?.installmentNumber && meta.totalInstallments
        ? `${meta.installmentNumber}/${meta.totalInstallments}`
        : null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Busca item, contas e transações na Pluggy e grava no banco.
 * A Pluggy é sempre a fonte da verdade: nada vindo do cliente ou do webhook é gravado direto.
 */
export async function syncItem(itemId: string, userId: string) {
  const pluggy = getPluggy();
  const item = await pluggy.fetchItem(itemId);

  if (item.clientUserId && item.clientUserId !== userId) {
    throw new Error("Esta conexão pertence a outro usuário.");
  }

  await upsertChunks("pluggy_items", [itemRow(item, userId)]);

  // Enquanto a Pluggy ainda está coletando, só atualizamos o status.
  if (item.status !== "UPDATED") return { item, accounts: 0, transactions: 0 };

  const { results: accounts } = await pluggy.fetchAccounts(itemId);
  await upsertChunks("accounts", accounts.map((a) => accountRow(a, userId)));

  const from = new Date();
  from.setMonth(from.getMonth() - HISTORY_MONTHS);
  let total = 0;
  for (const account of accounts) {
    const txs = await pluggy.fetchAllTransactions(account.id, { dateFrom: isoDate(from)! });
    await upsertChunks("transactions", txs.map((t) => transactionRow(t, itemId, userId)));
    total += txs.length;
  }

  await getAdmin()
    .from("pluggy_items")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", itemId);

  return { item, accounts: accounts.length, transactions: total };
}

/** Remove a conexão na Pluggy e todos os dados dela no banco (cascade). */
export async function removeItem(itemId: string, userId: string) {
  const db = getAdmin();
  const { data } = await db.from("pluggy_items").select("user_id").eq("id", itemId).maybeSingle();
  if (!data || data.user_id !== userId) throw new Error("Conexão não encontrada.");
  await getPluggy()
    .deleteItem(itemId)
    .catch(() => undefined); // já removido na Pluggy: segue e limpa o banco
  await db.from("pluggy_items").delete().eq("id", itemId);
}

/** Descobre o dono de um item (pelo banco ou pelo clientUserId que definimos no connect token). */
export async function ownerOf(itemId: string): Promise<string | null> {
  const { data } = await getAdmin().from("pluggy_items").select("user_id").eq("id", itemId).maybeSingle();
  if (data?.user_id) return data.user_id as string;
  const item = await getPluggy().fetchItem(itemId);
  return item.clientUserId ?? null;
}
