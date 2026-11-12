import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";

export const Route = createFileRoute("/categorias")({
  component: () => <ComingSoon title="Categorias" description="Crie categorias, defina limites e descubra para onde vai o seu dinheiro." />,
});
