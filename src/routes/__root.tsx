/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { FinanceProvider } from "@/lib/finance";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#6a00ff" },
      { title: "Nivo — Sua vida financeira em outro nível" },
      {
        name: "description",
        content: "Nivo: controle de gastos, metas e investimentos com o Nivi, seu assistente financeiro com IA.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootDocument,
  component: () => (
    <FinanceProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </FinanceProvider>
  ),
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
