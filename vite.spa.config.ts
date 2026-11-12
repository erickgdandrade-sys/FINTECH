import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Build estático para demonstração: npm run build:demo → dist-demo/
export default defineConfig({
  root: "spa",
  base: "./",
  plugins: [tsconfigPaths({ root: ".." }), tailwindcss(), viteReact()],
  build: { outDir: "../dist-demo", emptyOutDir: true },
});
