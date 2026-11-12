import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/projecao")({
  component: () => <ComingSoon title="Projeção" description="Simule o futuro: quanto você terá em 1, 5 ou 10 anos mantendo o ritmo atual." />,
});
