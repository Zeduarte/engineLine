import type { VehicleType } from "@/lib/vehicle-categories";

/**
 * Sinal entre a página antiga e a nova numa troca de mundo (carros ↔ motas).
 *
 * A troca é uma navegação completa (a rota grava o cookie e redireciona), por
 * isso a animação passa de uma página para a outra por sessionStorage: a antiga
 * marca a chegada e a nova, ao abrir, começa tapada pela mesma imagem e
 * revela-se. A marca expira depressa para nunca tapar uma visita mais tarde.
 */
export const ARRIVAL_KEY = "world-arrival";
export const ARRIVAL_TTL_MS = 20_000;

export function markWorldArrival(type: VehicleType) {
  try {
    sessionStorage.setItem(ARRIVAL_KEY, JSON.stringify({ type, t: Date.now() }));
  } catch {
    // sessionStorage bloqueado: a página nova abre sem a revelação
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
