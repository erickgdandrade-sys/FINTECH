import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/faturas")({
  component: () => <ComingSoon title="Faturas" description="Todas as faturas dos seus cartões em um só lugar, com datas de vencimento e limites." />,
});
