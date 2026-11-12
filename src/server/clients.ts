import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PluggyClient } from "pluggy-sdk";
import { serverEnv } from "./env";

let pluggy: PluggyClient | undefined;
let admin: SupabaseClient | undefined;

/** Cliente da API Pluggy (o SDK cuida do login e da renovação da API key). */
export function getPluggy() {
  pluggy ??= new PluggyClient({
    clientId: serverEnv.pluggyClientId,
    clientSecret: serverEnv.pluggyClientSecret,
  });
  return pluggy;
}

/** Supabase com service role: ignora RLS. Só para o servidor. */
export function getAdmin() {
  admin ??= createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Valida o token de sessão do Supabase enviado pelo app e devolve o usuário. */
export async function requireUser(accessToken: string) {
  const { data, error } = await getAdmin().auth.getUser(accessToken);
  if (error || !data.user) throw new Error("Sessão inválida. Entre novamente.");
  return data.user;
}
