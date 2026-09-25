import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, OlxConnectionRow } from "@/lib/supabase/database.types";

/**
 * Cliente da OLX Partner API.
 *
 * Três coisas que o OLX exige em todos os pedidos e que vivem só aqui:
 * `Authorization: Bearer …`, `Version: 2.0` e a renovação do token. O token de
 * acesso dura 24 horas e o de renovação um mês, e o OLX pode trocar o de
 * renovação a cada utilização — por isso guarda-se sempre o que vier na
 * resposta. Se se perdesse, a conta tinha de ser ligada outra vez à mão.
 *
 * As credenciais da aplicação (OLX_CLIENT_ID/SECRET) só existem nas variáveis
 * de ambiente; os tokens da conta, na tabela `olx_connection`, que só o
 * servidor lê.
 */

type Db = SupabaseClient<Database>;

/** Destino configurável, como o ANTHROPIC_BASE_URL, para os testes. */
export function olxBase(): string {
  return (process.env.OLX_BASE_URL || "https://www.olx.pt").replace(/\/$/, "");
}

export function olxConfigured(): boolean {
  return !!(process.env.OLX_CLIENT_ID && process.env.OLX_CLIENT_SECRET);
}

/** Renova um pouco antes do fim, para nenhum pedido apanhar o token a expirar. */
const MARGIN_MS = 5 * 60 * 1000;

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function tokenRequest(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(`${olxBase()}/api/open/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.OLX_CLIENT_ID,
      client_secret: process.env.OLX_CLIENT_SECRET,
      ...body,
    }),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || typeof json.access_token !== "string") {
    // A descrição do OLX nunca inclui segredos; o pedido sim, por isso não se
    // regista o corpo enviado.
    throw new Error(
      `OLX recusou o token: ${String(json.error_description ?? json.error ?? response.status)}`,
    );
  }
  return json as unknown as TokenResponse;
}

/** Troca o `code` do retorno do OAuth por tokens. */
export function exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
  return tokenRequest({
    grant_type: "authorization_code",
    code,
    scope: "v2 read write",
    redirect_uri: redirectUri,
  });
}

export async function getConnection(db: Db): Promise<OlxConnectionRow | null> {
  const { data } = await db.from("olx_connection").select("*").eq("id", 1).maybeSingle();
  return data ?? null;
}

export async function saveTokens(db: Db, t: TokenResponse): Promise<void> {
  const { error } = await db
    .from("olx_connection")
    .update({
      access_token: t.access_token,
      refresh_token: t.refresh_token,
      expires_at: new Date(Date.now() + t.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(`Não foi possível guardar o token do OLX: ${error.message}`);
}

/** Token válido, renovado se estiver perto do fim. */
async function accessToken(db: Db, force = false): Promise<string> {
  const conn = await getConnection(db);
  if (!conn) throw new Error("A conta do OLX não está ligada.");
  if (!force && Date.parse(conn.expires_at) - Date.now() > MARGIN_MS) return conn.access_token;
  const renewed = await tokenRequest({
    grant_type: "refresh_token",
    refresh_token: conn.refresh_token,
  });
  await saveTokens(db, renewed);
  return renewed.access_token;
}

/** Renovação diária pelo /api/maintenance: mantém o token de renovação vivo. */
export async function refreshIfNeeded(db: Db): Promise<void> {
  const conn = await getConnection(db);
  if (!conn) return;
  // O de renovação morre ao fim de um mês sem uso; renovar uma vez por dia
  // garante que isso nunca acontece mesmo sem anúncios a sincronizar.
  const idade = Date.now() - Date.parse(conn.updated_at);
  if (idade > 20 * 60 * 60 * 1000) await accessToken(db, true);
}

export interface OlxResponse<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  /** Mensagem legível do erro do OLX, com os campos da validação. */
  error: string | null;
}

/** Junta o erro do OLX numa frase: "Data validation error: title — Too short". */
export function describeOlxError(body: unknown, status: number): string {
  const b = (body ?? {}) as Record<string, unknown>;
  const err = (b.error ?? (b.data as Record<string, unknown> | undefined)?.error ?? b) as Record<string, unknown>;
  const partes: string[] = [];
  const principal = err.detail ?? err.title ?? err.message ?? err.error_description;
  if (principal) partes.push(String(principal));
  const validation = err.validation;
  if (Array.isArray(validation)) {
    for (const v of validation as { field?: string; title?: string; detail?: string }[]) {
      partes.push(`${v.field ?? "campo"}: ${v.detail ?? v.title ?? "inválido"}`);
    }
  }
  return partes.length ? partes.join(" — ") : `HTTP ${status}`;
}

export async function olxFetch<T = unknown>(
  db: Db,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<OlxResponse<T>> {
  const call = async (token: string) =>
    fetch(`${olxBase()}/api/partner${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: "2.0",
        Accept: "application/json",
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      signal: AbortSignal.timeout(20000),
      redirect: "error",
    });

  let response = await call(await accessToken(db));
  // Um 401 com um token que ainda parecia válido: renova uma vez e repete.
  if (response.status === 401) response = await call(await accessToken(db, true));

  if (response.status === 204) return { ok: true, status: 204, data: null, error: null };
  const body = await response.json().catch(() => null);
  return response.ok
    ? { ok: true, status: response.status, data: body as T, error: null }
    : { ok: false, status: response.status, data: null, error: describeOlxError(body, response.status) };
}
