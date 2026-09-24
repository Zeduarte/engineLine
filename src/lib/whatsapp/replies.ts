/**
 * As frases fixas do canal, num sítio só.
 *
 * Nunca se devolve ao WhatsApp a mensagem de erro do Postgres nem do modelo: o
 * erro real vai para o log e para `wa_messages.error`, e a pessoa lê uma destas.
 */
export const REPLIES = {
  semSecao: (secao: string) =>
    `Não tem acesso a ${secao}. Fale com o responsável.`,
  soTexto: "Por agora só entendo mensagens de texto.",
  semAssistente: "O assistente não está configurado.",
  falhou: "Não consegui processar agora. Tente daqui a pouco.",
  demasiadas: "Demasiadas mensagens em pouco tempo. Aguarde uns minutos.",
  expirou: "Esse pedido já expirou. Repita, por favor.",
  nadaPendente: "Não tenho nada à espera de confirmação.",
  cancelado: "Cancelado. Não registei nada.",
  jaNaoDa: "Já não foi possível: a viatura deixou de existir.",
  naoEncontrei: "Não encontrei essa viatura. Indique a matrícula.",
  foraDoAmbito: "Isso não dá para fazer por aqui. Use o backoffice.",
} as const;

/** Nome da secção como aparece no menu, para as mensagens de recusa. */
export const SECTION_LABEL: Record<string, string> = {
  oficina: "Oficina",
  financeiro: "Custos e margens",
};
