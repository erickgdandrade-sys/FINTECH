import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/recorrencias")({
  component: () => <ComingSoon title="Recorrências" description="Acompanhe assinaturas e contas fixas, com alertas antes de cada cobrança." />,
});
