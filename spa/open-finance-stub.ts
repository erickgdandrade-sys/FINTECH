/** Substitui as funções de servidor no build de demonstração (sem backend). */
const unavailable = async (_: unknown): Promise<never> => {
  throw new Error("Conexão com bancos indisponível na demonstração.");
};
export const createConnectToken = unavailable as (a: unknown) => Promise<{ connectToken: string }>;
export const registerItem = unavailable;
export const refreshItem = unavailable;
export const disconnectItem = unavailable;
