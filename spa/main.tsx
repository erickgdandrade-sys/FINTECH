/**
 * Build estático (SPA) usado só para gerar um link de demonstração.
 * O app principal continua sendo o TanStack Start em src/.
 */
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { AppShell } from "@/components/app-shell";
import { FinanceProvider } from "@/lib/finance";
import { themeInitScript } from "@/components/theme-switch";
import "@/styles.css";

// Aplica o tema salvo (ou o do sistema) antes de desenhar, como o site completo faz no <head>.
new Function(themeInitScript)();

const root = createRootRoute({
  component: () => (
    <FinanceProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </FinanceProvider>
  ),
});

// Todas as páginas de src/routes entram automaticamente (exceto a raiz e as rotas de API).
const modules = import.meta.glob("../src/routes/*.tsx", { eager: true }) as Record<string, { Route?: { options: { component?: unknown } } }>;
const pages = Object.fromEntries(
  Object.entries(modules)
    .filter(([file]) => !file.endsWith("__root.tsx"))
    .map(([file, mod]) => {
      const name = file.split("/").pop()!.replace(/\.tsx$/, "");
      return [name === "index" ? "/" : `/${name}`, mod.Route] as const;
    })
    .filter(([, r]) => r?.options.component),
);

const routeTree = root.addChildren(
  Object.entries(pages).map(([path, r]) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRoute({ getParentRoute: () => root, path, component: (r as any).options.component }),
  ),
);

const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
