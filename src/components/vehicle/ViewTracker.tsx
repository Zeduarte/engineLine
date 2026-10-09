"use client";

import { useEffect, useRef } from "react";
import { useLocalList, RECENT_KEY } from "@/hooks/useLocalList";

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
  // Histórico local "vistos recentemente" (máx. 8, mais recente primeiro).
  const { add: addRecent } = useLocalList(RECENT_KEY, { max: 8, prepend: true });

  useEffect(() => {
    addRecent(slug);
  }, [slug, addRecent]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // Recarregar a página ou voltar atrás no mesmo separador não conta outra vez.
    const key = `viewed:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage bloqueado (modo privado restrito): conta na mesma
    }
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
