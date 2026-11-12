/**
 * Dados de demonstração. Substitua por chamadas à API / banco
 * mantendo os mesmos formatos.
 */
import type { GoalIconKey } from "@/components/icons";

export type CategoryKey =
  | "moradia"
  | "delivery"
  | "compras"
  | "assinaturas"
  | "transporte"
  | "eletronicos"
  | "salario"
  | "investimento"
  | "transferencias"
  | "mercado"
  | "saude"
  | "lazer"
  | "taxas"
  | "outros";

export const categories: Record<
  CategoryKey,
  { label: string; color: string; soft: string }
> = {
  moradia: { label: "Moradia e contas", color: "#6a00ff", soft: "#efe5ff" },
  delivery: { label: "Delivery", color: "#ff007a", soft: "#ffe3f0" },
  compras: { label: "Compras", color: "#00c2d9", soft: "#ddfbff" },
  assinaturas: { label: "Assinaturas", color: "#ff6b00", soft: "#ffeedf" },
  transporte: { label: "Táxi e Apps", color: "#9d5cff", soft: "#f1e8ff" },
  eletronicos: { label: "Eletrônicos", color: "#8fd400", soft: "#f3ffd6" },
  salario: { label: "Salário", color: "#12b76a", soft: "#e3f8ec" },
  investimento: { label: "Investimento", color: "#6a00ff", soft: "#efe5ff" },
  transferencias: { label: "Transferências", color: "#4a4668", soft: "#efeef7" },
  mercado: { label: "Mercado", color: "#00a3b8", soft: "#ddfbff" },
  saude: { label: "Saúde", color: "#e0005f", soft: "#ffe3f0" },
  lazer: { label: "Lazer", color: "#ff8a33", soft: "#ffeedf" },
  taxas: { label: "Taxas e juros", color: "#8b88a6", soft: "#f1f0f8" },
  outros: { label: "Outros", color: "#b3b0c9", soft: "#f1f0f8" },
};

export const month = {
  label: "Novembro 2026",
  spent: 2103.41,
  budget: 3000,
  dayOfMonth: 24,
  daysInMonth: 30,
  income: 2526,
  expenses: 2103,
  result: 2103.41,
  resultChange: 3,
  prevResult: 1438,
  balance: 7520,
  balanceChange: 12,
};

/** Gasto acumulado por dia (real) vs ritmo do orçamento. */
export const spendingCurve = Array.from({ length: month.daysInMonth }, (_, i) => {
  const day = i + 1;
  const ideal = (month.budget / month.daysInMonth) * day;
  const real =
    day <= month.dayOfMonth
      ? Math.round(
          [
            40, 95, 160, 210, 290, 360, 420, 480, 560, 640, 700, 760,
            850, 930, 1010, 1100, 1220, 1340, 1460, 1590, 1720, 1860, 1990, 2103.41,
          ][i] ?? 0,
        )
      : null;
  return { day, ideal: Math.round(ideal), real };
});

/** Ritmo do orçamento: quanto abaixo/acima do ideal e quanto pode gastar por dia. */
export const pace = (() => {
  const ideal = (month.budget / month.daysInMonth) * month.dayOfMonth;
  const remainingDays = month.daysInMonth - month.dayOfMonth;
  return {
    diff: Math.round(ideal - month.spent),
    perDay: Math.floor((month.budget - month.spent) / remainingDays / 5) * 5,
    remainingDays,
  };
})();

export const distribution: {
  key: CategoryKey;
  value: number;
  limit?: number;
  trend?: "up" | "down";
}[] = [
  { key: "moradia", value: 3500 },
  { key: "delivery", value: 1067, limit: 900 },
  { key: "compras", value: 683, trend: "up" },
  { key: "assinaturas", value: 683 },
  { key: "transporte", value: 683, limit: 700 },
  { key: "eletronicos", value: 171, limit: 400, trend: "down" },
];

export const investments = {
  total: 5700,
  change: 3,
  weekGain: 1193,
  series: [
    { m: "Jun", v: 3900 },
    { m: "Jul", v: 4150 },
    { m: "Ago", v: 4380 },
    { m: "Set", v: 4720 },
    { m: "Out", v: 5160 },
    { m: "Nov", v: 5700 },
  ],
};

export const emergency = { current: 6000, target: 18000, monthlyCost: 3000 };

export const recurrences = [
  { name: "Figma", amount: 120, date: "15/11", color: "#0b0630", initial: "F" },
  { name: "Disney+", amount: 64.9, date: "15/11", color: "#113ccf", initial: "D" },
  { name: "Gemini", amount: 24.9, date: "18/11", color: "#4285f4", initial: "G" },
  { name: "Spotify", amount: 21.9, date: "20/11", color: "#1db954", initial: "S" },
];

export const invoices = {
  total: 1423,
  dueDate: "22/11",
  balanceAfter: 2526, // saldo projetado após pagamento
  cards: [
    { name: "Nubank", color: "#8a05be", amount: 812.4 },
    { name: "Inter", color: "#ff7a00", amount: 388.2 },
    { name: "Santander", color: "#ec0000", amount: 222.4 },
  ],
};

export const goals = [
  {
    name: "Viagem Chile 2026",
    current: 14000,
    target: 15000,
    due: "05/03/2027",
    priority: true,
    icon: "viagem" as GoalIconKey,
    color: "#6a00ff",
  },
  {
    name: "Notebook novo",
    current: 4200,
    target: 9000,
    due: "03/2027",
    priority: false,
    icon: "tecnologia" as GoalIconKey,
    color: "#ff007a",
  },
  {
    name: "Entrada do apê",
    current: 22500,
    target: 80000,
    due: "12/2028",
    priority: false,
    icon: "casa" as GoalIconKey,
    color: "#00c2d9",
  },
];

export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: CategoryKey;
  account: string;
  amount: number; // negativo = saída
};

export const transactions: Transaction[] = [
  { id: "t1", date: "2026-11-12", description: "iFood — Restaurante Sabor", category: "delivery", account: "Nubank", amount: -58.9 },
  { id: "t2", date: "2026-11-11", description: "Uber", category: "transporte", account: "Inter", amount: -23.4 },
  { id: "t3", date: "2026-11-10", description: "Mercado Pão de Açúcar", category: "compras", account: "Nubank", amount: -312.75 },
  { id: "t4", date: "2026-11-10", description: "Aporte Tesouro Selic", category: "investimento", account: "Inter", amount: -500 },
  { id: "t5", date: "2026-11-08", description: "Fone Bluetooth", category: "eletronicos", account: "Santander", amount: -171 },
  { id: "t6", date: "2026-11-05", description: "Salário", category: "salario", account: "Inter", amount: 2526 },
  { id: "t7", date: "2026-11-05", description: "Aluguel apartamento", category: "moradia", account: "Inter", amount: -3500 },
  { id: "t8", date: "2026-11-04", description: "Netflix", category: "assinaturas", account: "Nubank", amount: -55.9 },
  { id: "t9", date: "2026-11-03", description: "Rappi — Farmácia", category: "delivery", account: "Nubank", amount: -89.3 },
  { id: "t10", date: "2026-11-02", description: "99 Táxi", category: "transporte", account: "Inter", amount: -31.2 },
  { id: "t11", date: "2026-11-01", description: "Amazon — Livros", category: "compras", account: "Santander", amount: -142.6 },
  { id: "t12", date: "2026-11-01", description: "Freela — Landing page", category: "salario", account: "Inter", amount: 1200 },
];

export const niviInsights = [
  {
    tone: "warn" as const,
    title: "Delivery passou do limite",
    text: "Você já gastou R$ 1.067 com delivery — R$ 167 acima do planejado. Cozinhar 2x na semana te devolve ~R$ 240.",
  },
  {
    tone: "good" as const,
    title: "Ritmo de gastos saudável",
    text: `Você está R$ ${pace.diff} abaixo do ritmo do orçamento. Mantenha até R$ ${pace.perDay}/dia e feche o mês no azul.`,
  },
  {
    tone: "tip" as const,
    title: "Viagem Chile quase lá",
    text: "Faltam só R$ 1.000 para a meta. Um aporte de R$ 250/semana conclui antes do prazo.",
  },
];
