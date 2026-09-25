import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * O `state` do OAuth do OLX.
 *
 * Sem ele, qualquer pessoa podia fazer o site ligar-se à conta do OLX DELA —
 * bastava enviar a um administrador um link de retorno com um `code` seu, e os
 * anúncios do stand passavam a ser publicados na conta errada. A própria
 * documentação do OLX avisa para não o omitir.
 *
 * O `state` é assinado (HMAC) e expira, e vai também num cookie: o retorno só
 * é aceite no mesmo navegador que iniciou a ligação.
 */

const TTL_MS = 10 * 60 * 1000;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createState(secret: string, now = Date.now()): string {
  const payload = `${randomBytes(16).toString("base64url")}.${now + TTL_MS}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyState(
  state: string | null,
  cookie: string | null,
  secret: string,
  now = Date.now(),
): boolean {
  if (!state || !cookie || !secret) return false;
  // Tem de ser exactamente o que este navegador recebeu ao iniciar.
  const a = Buffer.from(state);
  const b = Buffer.from(cookie);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, exp, sig] = parts as [string, string, string];
  const expected = sign(`${nonce}.${exp}`, secret);
  const s = Buffer.from(sig);
  const e = Buffer.from(expected);
  if (s.length !== e.length || !timingSafeEqual(s, e)) return false;
  return Number(exp) > now;
}
