import type { CategoryKey } from "./data";

/**
 * Converte a categoria da Pluggy (texto, normalmente em inglês) para as categorias do Nivo.
 * Regras por palavra-chave; o que não casar vira "outros".
 */
const rules: [CategoryKey, RegExp][] = [
  ["salario", /salary|salár|income|renda|remunera|wage|proventos/i],
  ["investimento", /invest|aplica|savings|poupan|fixed income|tesouro/i],
  ["transferencias", /transfer|pix|ted\b|doc\b|same person|credit card payment|pagamento de fatura|pagto fatura/i],
  ["moradia", /rent|aluguel|housing|moradia|condom|mortgage|utilities|electric|water|gas\b|energia|internet|telecom|telefon|phone/i],
  ["delivery", /delivery|food deliver|ifood|eating out|restaurant|restaura|bar\b|food and drink|alimenta/i],
  ["mercado", /grocer|supermarket|supermerc|mercado/i],
  ["assinaturas", /subscri|streaming|digital service|assinatura|software|video|music/i],
  ["transporte", /taxi|ride|uber|transport|gas station|fuel|combust|parking|estaciona|toll|ped[aá]gio|mobility/i],
  ["eletronicos", /electronic|eletr[oô]n|tech|gadget/i],
  ["saude", /health|sa[uú]de|pharma|farm[aá]c|drug|hospital|dentist|medic|gym|fitness|academia/i],
  ["compras", /shopping|compras|online|clothing|vestu|store|department|ecommerce/i],
  ["lazer", /leisure|lazer|entertain|travel|viage|hotel|airline|ticket|cinema|game/i],
  ["taxas", /fee|tarifa|tax|imposto|interest|juros|iof|bank fee/i],
];

export function mapCategory(pluggyCategory: string | null, description = ""): CategoryKey {
  const text = `${pluggyCategory ?? ""} ${description}`;
  for (const [key, re] of rules) if (re.test(text)) return key;
  return "outros";
}
