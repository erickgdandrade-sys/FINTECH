import { createFileRoute } from "@tanstack/react-router";
import type { WebhookEventPayload } from "pluggy-sdk";
import { getAdmin } from "@/server/clients";
import { serverEnv } from "@/server/env";
import { ownerOf, syncItem } from "@/server/sync";

/**
 * Recebe eventos da Pluggy (configurado via webhookUrl no connect token).
 * Segurança: exige o segredo na URL e nunca confia no conteúdo do evento —
 * sempre busca o estado real na API da Pluggy antes de gravar.
 */
async function handle(event: WebhookEventPayload) {
  if (!("itemId" in event) || !event.itemId) return;
  const itemId = event.itemId;

  switch (event.event) {
    case "item/deleted":
      await getAdmin().from("pluggy_items").delete().eq("id", itemId);
      return;
    case "transactions/deleted":
      await getAdmin().from("transactions").delete().in("id", event.transactionIds);
      return;
    case "item/created":
    case "item/updated":
    case "item/error":
    case "item/login_succeeded":
    case "item/waiting_user_input":
    case "transactions/created":
    case "transactions/updated": {
      const userId = await ownerOf(itemId);
      if (userId) await syncItem(itemId, userId);
      return;
    }
  }
}

export const Route = createFileRoute("/api/pluggy/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = new URL(request.url).searchParams.get("secret");
        if (!serverEnv.webhookSecret || secret !== serverEnv.webhookSecret) {
          return new Response("unauthorized", { status: 401 });
        }
        const event = (await request.json()) as WebhookEventPayload;
        // A Pluggy espera resposta rápida (2xx); o processamento segue em segundo plano.
        handle(event).catch((err) => console.error("[pluggy webhook]", event.event, err));
        return new Response("ok");
      },
    },
  },
});
