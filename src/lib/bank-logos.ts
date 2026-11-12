/**
 * Logos de bancos: primeiro a imagem enviada pela Pluggy; se não houver (ou falhar),
 * o ícone oficial do site do banco (via serviço de favicons do Google).
 */
const DOMAINS: [RegExp, string][] = [
  [/nubank|\bnu\b/i, "nubank.com.br"],
  [/ita[uú].*person|personnalit/i, "itau.com.br"],
  [/ita[uú]|iti\b/i, "itau.com.br"],
  [/bradesco|next\b/i, "bradesco.com.br"],
  [/\binter\b|banco inter/i, "bancointer.com.br"],
  [/santander/i, "santander.com.br"],
  [/banco do brasil|\bbb\b|ourocard/i, "bb.com.br"],
  [/caixa/i, "caixa.gov.br"],
  [/\bc6\b|c6 ?bank/i, "c6bank.com.br"],
  [/btg/i, "btgpactual.com"],
  [/\bxp\b|xp investimentos/i, "xpi.com.br"],
  [/rico\b/i, "rico.com.vc"],
  [/clear\b/i, "clear.com.br"],
  [/picpay/i, "picpay.com"],
  [/mercado ?pago/i, "mercadopago.com.br"],
  [/pagbank|pagseguro/i, "pagbank.com.br"],
  [/neon/i, "neon.com.br"],
  [/original/i, "original.com.br"],
  [/sicredi/i, "sicredi.com.br"],
  [/sicoob/i, "sicoob.com.br"],
  [/banrisul/i, "banrisul.com.br"],
  [/safra/i, "safra.com.br"],
  [/will ?bank/i, "willbank.com.br"],
  [/\bpan\b|banco pan/i, "bancopan.com.br"],
  [/bmg/i, "bancobmg.com.br"],
  [/daycoval/i, "daycoval.com.br"],
  [/modal/i, "modalmais.com.br"],
  [/agibank/i, "agibank.com.br"],
  [/banco do nordeste|\bbnb\b/i, "bnb.gov.br"],
  [/banestes/i, "banestes.com.br"],
  [/brb\b/i, "brb.com.br"],
  [/porto ?(seguro|bank)/i, "portoseguro.com.br"],
  [/sofisa/i, "sofisadireto.com.br"],
  [/stone/i, "stone.com.br"],
  [/cora\b/i, "cora.com.br"],
  [/ame digital/i, "amedigital.com"],
  [/nomad/i, "nomadglobal.com"],
  [/wise/i, "wise.com"],
  [/meu ?pluggy|pluggy/i, "pluggy.ai"],
];

export function bankDomain(name: string): string | null {
  for (const [re, domain] of DOMAINS) if (re.test(name)) return domain;
  return null;
}

/** Lista de URLs de logo para tentar em ordem. */
export function bankLogoCandidates(name: string, pluggyImage?: string | null): string[] {
  const out: string[] = [];
  if (pluggyImage) out.push(pluggyImage);
  const domain = bankDomain(name);
  if (domain) out.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
  return out;
}
