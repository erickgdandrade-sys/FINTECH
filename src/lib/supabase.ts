import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Sem Supabase configurado o app roda em modo demonstração. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, anonKey!);
  return client;
}
