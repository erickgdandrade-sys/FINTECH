/**
 * Cliente mínimo da API do Gemini (REST, sem SDK).
 * Chave: GEMINI_API_KEY. Modelo: GEMINI_MODEL (padrão abaixo).
 * Se o modelo configurado não existir mais, escolhe automaticamente um "flash" disponível.
 */
const API = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";

let resolvedModel: string | undefined;

export type ChatTurn = { role: "user" | "model"; text: string };

export class NiviError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "rate_limit" | "upstream",
  ) {
    super(message);
  }
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new NiviError("O Nivi ainda não está configurado (falta GEMINI_API_KEY).", "config");
  return key;
}

async function pickAvailableModel(): Promise<string> {
  const res = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": apiKey() } });
  if (!res.ok) throw new NiviError("Não foi possível listar os modelos do Gemini.", "upstream");
  const data = (await res.json()) as {
    models?: { name: string; supportedGenerationMethods?: string[] }[];
  };
  const usable = (data.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent"));
  const flash =
    usable.find((m) => /flash/.test(m.name) && !/lite|image|tts|live|exp|preview/.test(m.name)) ??
    usable.find((m) => /flash/.test(m.name)) ??
    usable[0];
  if (!flash) throw new NiviError("Nenhum modelo do Gemini disponível para esta chave.", "config");
  return flash.name.replace(/^models\//, "");
}

export async function generate(system: string, turns: ChatTurn[]): Promise<string> {
  let model = resolvedModel ?? process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${API}/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey() },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
        generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
      }),
    });

    if (res.status === 404 && attempt === 0) {
      // Modelo descontinuado/renomeado: descobre um disponível e tenta de novo.
      model = await pickAvailableModel();
      continue;
    }
    if (res.status === 429) {
      throw new NiviError("O Nivi atingiu o limite de uso do plano gratuito. Tente de novo em 1 minuto.", "rate_limit");
    }
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      const body = await res.text();
      console.error("[gemini]", res.status, body.slice(0, 500));
      throw new NiviError("A chave do Gemini foi recusada. Confira GEMINI_API_KEY.", "config");
    }
    if (!res.ok) {
      console.error("[gemini]", res.status, (await res.text()).slice(0, 500));
      throw new NiviError("O Nivi está indisponível agora. Tente novamente em instantes.", "upstream");
    }

    resolvedModel = model;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
    if (!text) throw new NiviError("Não consegui formular uma resposta. Tente perguntar de outro jeito.", "upstream");
    return text;
  }
  throw new NiviError("O Nivi está indisponível agora.", "upstream");
}
