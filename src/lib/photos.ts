import { getSupabase } from "./supabase";

const BUCKET = "fotos";
const MAX_INPUT = 15 * 1024 * 1024; // aceita até 15 MB; reduzimos antes de enviar

/** Reduz a imagem (lado maior até `max` px) e converte para JPEG. */
async function shrink(file: File, max: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Não foi possível processar a imagem."))), "image/jpeg", 0.85),
  );
}

/** Envia uma foto para a pasta do usuário e devolve o caminho salvo. */
export async function uploadPhoto(file: File, folder: "perfil" | "metas", max = 1400): Promise<string> {
  const sb = getSupabase();
  if (!sb) throw new Error("Armazenamento indisponível.");
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error("Entre na sua conta para enviar fotos.");
  if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
  if (file.size > MAX_INPUT) throw new Error("Imagem muito grande (máximo 15 MB).");

  const blob = await shrink(file, max);
  const path = `${data.user.id}/${folder}/${crypto.randomUUID()}.jpg`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(`Falha ao enviar a foto: ${error.message}`);
  return path;
}

export async function removePhoto(path: string | null | undefined) {
  if (!path) return;
  await getSupabase()?.storage.from(BUCKET).remove([path]);
}

/** Gera links temporários (1 hora) para exibir fotos privadas. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const sb = getSupabase();
  const unique = [...new Set(paths.filter(Boolean))];
  if (!sb || unique.length === 0) return {};
  const { data } = await sb.storage.from(BUCKET).createSignedUrls(unique, 3600);
  const out: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  return out;
}
