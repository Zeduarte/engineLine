/**
 * Decide se uma visita à ficha de uma viatura entra nas estatísticas.
 *
 * Puro (sem dependências de servidor) para poder ser testado. A ideia é que o
 * painel mostre só visitantes reais: ficam de fora robôs, a equipa (quem tem
 * sessão iniciada no backoffice), o desenvolvimento local e as pré-visualizações
 * de deploy do Netlify.
 */

/** Robôs que correm JavaScript (os outros nunca chegam a chamar /api/track). */
const BOT_UA =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|facebookexternalhit|whatsapp|telegram|discord|semrush|ahrefs|bytespider|python|curl|wget|axios|node-fetch|go-http/i;

export type SkipReason = "dev" | "preview" | "bot" | "staff";

export interface ViewContext {
  userAgent: string;
  /** Host do pedido, sem porta relevante (ex.: "supermotas.com"). */
  host: string;
  nodeEnv: string | undefined;
  /** Nomes dos cookies do pedido. */
  cookieNames: string[];
}

export function isBot(userAgent: string): boolean {
  return !userAgent.trim() || BOT_UA.test(userAgent);
}

/** Devolve o motivo para NÃO contar a visita, ou `null` se é para contar. */
export function viewSkipReason(ctx: ViewContext): SkipReason | null {
  const host = ctx.host.toLowerCase();
  if (
    ctx.nodeEnv !== "production" ||
    host.startsWith("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("[::1]")
  ) {
    return "dev";
  }
  // Deploy previews e branch deploys do Netlify: "deploy-preview-12--site.netlify.app".
  if (host.includes("--")) return "preview";
  if (isBot(ctx.userAgent)) return "bot";
  // Sessão do Supabase (cookie "sb-<projeto>-auth-token", às vezes em partes .0/.1).
  if (ctx.cookieNames.some((n) => n.startsWith("sb-") && n.includes("-auth-token"))) {
    return "staff";
  }
  return null;
}
