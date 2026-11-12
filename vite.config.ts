import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  // Disponibiliza as variáveis do .env (inclusive as sem prefixo VITE_) para o código de servidor.
  Object.assign(process.env, { ...loadEnv(mode, process.cwd(), ""), ...process.env });
  return {
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    // Adaptador de hospedagem: cada serviço define sua variável durante o build.
    process.env.VERCEL ? nitro({ preset: "vercel" }) : null,
    process.env.NETLIFY ? netlify() : null,
    viteReact(),
  ],
  };
});
