import { unwrap } from "@/lib/olx/categories";

/**
 * Estatísticas de um anúncio do OLX (`GET /adverts/{id}/statistics`):
 * visualizações do anúncio, vezes que mostraram o telefone e quantas pessoas o
 * seguem. Função pura: aceita a resposta direta ou dentro de `data`, e o que
 * não for um número inteiro ≥ 0 fica nulo em vez de virar 0.
 */

export interface OlxStats {
  views: number | null;
  phoneViews: number | null;
  observers: number | null;
}

function count(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n >= 0 ? n : null;
}

export function parseStats(body: unknown): OlxStats {
  const s = (unwrap<Record<string, unknown>>(body) ?? {}) as Record<string, unknown>;
  return {
    views: count(s.advert_views),
    phoneViews: count(s.phone_views),
    observers: count(s.users_observing),
  };
}

/** Anúncios com estatísticas: só os que existem no OLX e não foram retirados. */
export function wantsStats(listing: { external_id: string | null; status: string }): boolean {
  return !!listing.external_id && listing.status !== "removed";
}
