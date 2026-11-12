import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/patrimonio")({
  component: () => <ComingSoon title="Patrimônio" description="A evolução de tudo o que você tem: contas, investimentos e bens." />,
});
