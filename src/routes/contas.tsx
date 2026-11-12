import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/contas")({
  component: () => <ComingSoon title="Contas" description="Conecte bancos e carteiras para sincronizar saldos automaticamente." />,
});
