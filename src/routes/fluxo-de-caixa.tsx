import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/fluxo-de-caixa")({
  component: () => <ComingSoon title="Fluxo de Caixa" description="Veja entradas e saídas dia a dia e antecipe meses apertados." />,
});
