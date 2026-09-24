/**
 * Leitura do "sim".
 *
 * A confirmação NÃO volta a passar pelo modelo: compara-se o texto com um
 * conjunto fechado de respostas contra a proposta já guardada. É mais barato,
 * é determinístico e — o que importa — torna o modelo estruturalmente incapaz
 * de mudar o valor entre a pergunta e o registo.
 *
 * A correspondência é por IGUALDADE, não por "contém". "sim, mas muda para 500"
 * não é uma confirmação: é um pedido novo, e tem de voltar a ser interpretado.
 */

export type Confirmation = "yes" | "no" | "other";

const YES = new Set([
  "sim", "s", "ok", "okay", "claro", "confirmo", "confirmado", "certo",
  "exato", "exacto", "isso", "pode ser", "avanca", "podes avancar", "vai",
  "positivo", "afirmativo", "👍", "👌", "✅",
]);

const NO = new Set([
  "nao", "n", "cancela", "cancelar", "esquece", "deixa", "deixa estar",
  "errado", "negativo", "para", "anula", "anular", "❌",
]);

/** Minúsculas, sem acentos, sem pontuação, espaços colapsados. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function readConfirmation(text: string): Confirmation {
  const t = normalize(text);
  if (!t) return "other";
  if (YES.has(t)) return "yes";
  if (NO.has(t)) return "no";
  return "other";
}

/** Uma proposta só vale enquanto está pendente e dentro do prazo. */
export function isUsable(
  pending: { status: string; expires_at: string },
  now: Date,
): boolean {
  return (
    pending.status === "pending" && Date.parse(pending.expires_at) > now.getTime()
  );
}
