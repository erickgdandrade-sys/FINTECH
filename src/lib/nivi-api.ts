import { createServerFn } from "@tanstack/react-start";
import { requireUser } from "@/server/clients";
import { NiviError, type ChatTurn } from "@/server/gemini";
import { askNivi } from "@/server/nivi";

type Input = { accessToken: string; history: ChatTurn[] };

/** Conversa com o Nivi. Responde { reply } ou { error } (mensagem pronta para mostrar). */
export const chatWithNivi = createServerFn({ method: "POST" })
  .validator((input: unknown): Input => {
    const d = input as Input;
    if (!d || typeof d.accessToken !== "string" || !Array.isArray(d.history)) throw new Error("Entrada inválida.");
    const history = d.history
      .filter((t) => (t?.role === "user" || t?.role === "model") && typeof t.text === "string")
      .slice(-12)
      .map((t) => ({ role: t.role, text: t.text.slice(0, 2000) }));
    // O Gemini exige que a conversa comece pelo usuário.
    while (history.length && history[0].role !== "user") history.shift();
    if (!history.length || history[history.length - 1].role !== "user") throw new Error("Envie uma pergunta.");
    return { accessToken: d.accessToken, history };
  })
  .handler(async ({ data }) => {
    const user = await requireUser(data.accessToken);
    const name = ((user.user_metadata?.name as string | undefined) ?? user.email ?? "você").split(/[\s@]/)[0];
    try {
      return { reply: await askNivi(user.id, name, data.history) };
    } catch (err) {
      if (err instanceof NiviError) return { error: err.message };
      console.error("[nivi]", err);
      return { error: "Tive um problema para analisar seus dados agora. Tente de novo em instantes." };
    }
  });
