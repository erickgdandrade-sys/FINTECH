import clsx from "clsx";
import {
  ArrowLeftRight,
  Banknote,
  Bike,
  Car,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  MoreHorizontal,
  PartyPopper,
  PiggyBank,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Ticket,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Baby,
  Gift,
  Headphones,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { categories, type CategoryKey } from "@/lib/data";

const categoryIcons: Record<CategoryKey, LucideIcon> = {
  moradia: Home,
  delivery: UtensilsCrossed,
  compras: ShoppingBag,
  assinaturas: Tv,
  transporte: Car,
  eletronicos: Headphones,
  salario: Briefcase,
  investimento: TrendingUp,
  transferencias: ArrowLeftRight,
  mercado: ShoppingCart,
  saude: HeartPulse,
  lazer: Ticket,
  taxas: Receipt,
  outros: MoreHorizontal,
};

/** Ícone da categoria num quadrado com a cor dela. */
export function CategoryIcon({ k, size = "md", className }: { k: CategoryKey; size?: "sm" | "md" | "lg"; className?: string }) {
  const Icon = categoryIcons[k];
  const c = categories[k];
  const box = { sm: "size-6 rounded-md", md: "size-8 rounded-lg", lg: "size-10 rounded-xl" }[size];
  const px = { sm: 13, md: 16, lg: 19 }[size];
  return (
    <span className={clsx("grid shrink-0 place-items-center", box, className)} style={{ background: c.soft, color: c.color }}>
      <Icon size={px} strokeWidth={2.2} />
    </span>
  );
}

export function categoryIcon(k: CategoryKey): LucideIcon {
  return categoryIcons[k];
}

/** Ícones disponíveis para metas (usados no card e no seletor ao criar uma meta). */
export const goalIcons = {
  viagem: { icon: Plane, label: "Viagem" },
  casa: { icon: Home, label: "Casa" },
  carro: { icon: Car, label: "Carro" },
  tecnologia: { icon: Laptop, label: "Tecnologia" },
  celular: { icon: Smartphone, label: "Celular" },
  reserva: { icon: ShieldCheck, label: "Reserva" },
  poupanca: { icon: PiggyBank, label: "Poupança" },
  investimento: { icon: TrendingUp, label: "Investimento" },
  estudos: { icon: GraduationCap, label: "Estudos" },
  saude: { icon: Dumbbell, label: "Saúde" },
  festa: { icon: PartyPopper, label: "Festa" },
  presente: { icon: Gift, label: "Presente" },
  filhos: { icon: Baby, label: "Filhos" },
  lazer: { icon: Bike, label: "Lazer" },
  dinheiro: { icon: Banknote, label: "Dinheiro" },
  sonho: { icon: Sparkles, label: "Sonho" },
} satisfies Record<string, { icon: LucideIcon; label: string }>;

export type GoalIconKey = keyof typeof goalIcons;

export function GoalIcon({ k, color, className }: { k: GoalIconKey; color: string; className?: string }) {
  const Icon = goalIcons[k].icon;
  return (
    <span
      className={clsx("grid size-12 shrink-0 place-items-center rounded-2xl", className)}
      style={{ background: `${color}18`, color }}
    >
      <Icon size={22} strokeWidth={2.1} />
    </span>
  );
}
