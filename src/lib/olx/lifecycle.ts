/**
 * O que fazer ao anúncio do OLX, dado o estado da viatura no site.
 *
 * Função pura, e o único sítio onde esta regra vive — a sincronização limita-se
 * a executar o que aqui se decide.
 *
 *  - publicada e com OLX marcado → cria o anúncio, ou atualiza-o (e reativa-o
 *    se tinha sido desativado ou expirou);
 *  - reservada → o anúncio mantém-se e continua atualizado, mas não se cria um
 *    anúncio novo para uma viatura que já está reservada;
 *  - vendida → desativa, a dizer ao OLX que foi vendida (`is_success: true`);
 *  - rascunho, ou OLX desmarcado → desativa sem venda.
 */

export type OlxAction =
  | "create"
  | "update"
  | "update_and_activate"
  | "deactivate_sold"
  | "deactivate"
  | "none";

/** Estados do OLX em que o anúncio está (ou pode estar) visível. */
const LIVE = new Set(["new", "active", "limited", "unconfirmed", "unpaid"]);
/** Estados de onde se pode reativar com `activate`. */
const REACTIVATABLE = new Set(["removed_by_user", "outdated"]);

export function desiredAction(input: {
  status: string;
  channels: readonly string[];
  externalId: string | null;
  remoteStatus: string | null;
}): OlxAction {
  const querOlx = input.channels.includes("olx");
  const existe = !!input.externalId;
  const vivo = existe && (input.remoteStatus === null || LIVE.has(input.remoteStatus));

  if (!querOlx) return vivo ? "deactivate" : "none";

  switch (input.status) {
    case "published":
      if (!existe) return "create";
      return input.remoteStatus && REACTIVATABLE.has(input.remoteStatus)
        ? "update_and_activate"
        : "update";
    case "reserved":
      return vivo ? "update" : "none";
    case "sold":
      return vivo ? "deactivate_sold" : "none";
    default:
      return vivo ? "deactivate" : "none";
  }
}

/** Texto do estado do OLX para o backoffice. */
export const REMOTE_STATUS_LABEL: Record<string, string> = {
  new: "em moderação",
  active: "ativo",
  limited: "precisa de pacote pago",
  removed_by_user: "desativado",
  outdated: "expirado",
  unconfirmed: "por confirmar",
  unpaid: "por pagar",
  moderated: "recusado pela moderação",
  blocked: "bloqueado pela moderação",
  disabled: "suspenso pela moderação",
  removed_by_moderator: "removido pela moderação",
};
