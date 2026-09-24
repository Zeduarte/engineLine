import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Autenticidade dos pedidos da Meta.
 *
 * Só a assinatura distingue um pedido da Meta de um pedido de qualquer pessoa
 * que descubra o endereço — e este endereço escreve na base de dados. Por isso
 * a verificação é a primeira coisa que a rota faz, antes de ler o corpo como
 * JSON.
 */

/** Tamanho máximo do corpo aceite. Acima disto nem se calcula o HMAC. */
export const MAX_BODY_BYTES = 100_000;

/**
 * O HMAC é sobre os BYTES EXACTOS que a Meta enviou, nunca sobre o JSON
 * reserializado — a ordem das chaves e os espaços mudariam e a assinatura nunca
 * bateria. Daí a rota usar `request.text()` e não `request.json()`.
 */
export function verifySignature(
  rawBody: string,
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return false;
  const expected =
    "sha256=" + createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // `timingSafeEqual` rebenta com comprimentos diferentes, por isso compara-se
  // primeiro — e um comprimento errado já é assinatura errada.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Aperto de mão de subscrição. A Meta chama o endereço uma vez com um desafio e
 * espera que ele seja devolvido em texto simples — é assim que prova que quem
 * controla o URL também conhece o token combinado.
 */
export function verifyChallenge(
  params: URLSearchParams,
  token: string,
): string | null {
  if (!token) return null;
  if (params.get("hub.mode") !== "subscribe") return null;
  const given = params.get("hub.verify_token") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return params.get("hub.challenge");
}
