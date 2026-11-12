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
import { Route as Index } from "@/routes/index";
import { Route as Transacoes } from "@/routes/transacoes";
import { Route as Metas } from "@/routes/metas";
import { Route as Recorrencias } from "@/routes/recorrencias";
import { Route as Fluxo } from "@/routes/fluxo-de-caixa";
import { Route as Faturas } from "@/routes/faturas";
import { Route as Categorias } from "@/routes/categorias";
import { Route as Patrimonio } from "@/routes/patrimonio";
import { Route as Projecao } from "@/routes/projecao";
import { Route as Contas } from "@/routes/contas";
import "@/styles.css";

const root = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const pages = {
  "/": Index,
  "/transacoes": Transacoes,
  "/metas": Metas,
  "/recorrencias": Recorrencias,
  "/fluxo-de-caixa": Fluxo,
  "/faturas": Faturas,
  "/categorias": Categorias,
  "/patrimonio": Patrimonio,
  "/projecao": Projecao,
  "/contas": Contas,
};

const routeTree = root.addChildren(
  Object.entries(pages).map(([path, r]) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createRoute({ getParentRoute: () => root, path, component: (r as any).options.component }),
  ),
);

const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ["/"] }) });

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
