/** Substitui o Nivi com IA no build de demonstração (sem backend). */
export const chatWithNivi = async (_: unknown): Promise<{ reply?: string; error?: string }> => ({
  error: "O Nivi com IA não está disponível na demonstração.",
});
