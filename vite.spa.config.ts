import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Build estático para demonstração: npm run build:demo → dist-demo/
export default defineConfig({
  root: "spa",
  base: "./",
  resolve: {
    alias: [
      // Sem servidor na demo: troca as funções de servidor por um stub.
      { find: /^@\/lib\/open-finance$/, replacement: fileURLToPath(new URL("./spa/open-finance-stub.ts", import.meta.url)) },
    ],
  },
  plugins: [tsconfigPaths({ root: ".." }), tailwindcss(), viteReact()],
  build: { outDir: "../dist-demo", emptyOutDir: true },
});
