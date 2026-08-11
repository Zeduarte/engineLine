"use client";

import { useEffect, useRef } from "react";

/**
 * Regista uma visita à ficha da viatura (uma vez por carregamento).
 * Fire-and-forget — não bloqueia nem afeta a renderização.
 */
export function ViewTracker({
  carId,
  slug,
}: {
  carId?: string;
  slug: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const payload = JSON.stringify({ car_id: carId ?? null, slug });
    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/track", blob)) return;
    } catch {
      // cai para o fetch abaixo
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [carId, slug]);

  return null;
}
