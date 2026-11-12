/** Variáveis de ambiente do servidor. Nunca importe este arquivo em código de cliente. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Variável de ambiente ${name} não configurada. Veja .env.example.`);
  return v;
}

export const serverEnv = {
  get supabaseUrl() {
    return required("VITE_SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },
  get pluggyClientId() {
    return required("PLUGGY_CLIENT_ID");
  },
  get pluggyClientSecret() {
    return required("PLUGGY_CLIENT_SECRET");
  },
  /** URL pública do webhook, ou undefined quando o app não está exposto na internet. */
  get webhookUrl(): string | undefined {
    // Netlify preenche URL; Vercel preenche VERCEL_PROJECT_PRODUCTION_URL (sem https://).
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
    const base = process.env.PUBLIC_APP_URL || process.env.URL || (vercel ? `https://${vercel}` : undefined);
    const secret = process.env.PLUGGY_WEBHOOK_SECRET;
    if (!base || !secret || !base.startsWith("https://")) return undefined;
    return `${base.replace(/\/$/, "")}/api/pluggy/webhook?secret=${encodeURIComponent(secret)}`;
  },
  get webhookSecret() {
    return process.env.PLUGGY_WEBHOOK_SECRET;
  },
};
