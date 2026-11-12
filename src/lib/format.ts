const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlShort = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const money = (v: number) => brl.format(v);
export const moneyShort = (v: number) => brlShort.format(v);
export const pct = (v: number, digits = 0) =>
  `${v > 0 ? "+" : ""}${v.toLocaleString("pt-BR", { maximumFractionDigits: digits })}%`;

/** Divide "R$ 2.103,41" em inteiro e centavos para tipografia em dois pesos. */
export function splitMoney(v: number) {
  const s = brl.format(v);
  const i = s.lastIndexOf(",");
  return { main: s.slice(0, i), cents: s.slice(i) };
}
