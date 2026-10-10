"use client";

import { useEffect } from "react";
import { ARRIVAL_KEY } from "@/lib/world-arrival";

/** Tira a capa de chegada (ver `WorldArrival`) com a animação de saída. */
export function WorldArrivalExit() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(ARRIVAL_KEY);
    } catch {
      // sem sessionStorage não houve capa
    }
    const cover = document.getElementById("world-arrival");
    if (!cover?.hasAttribute("data-show")) return;
    // Uma pausa curta para a página nova assentar por baixo antes de se ver.
    const leave = setTimeout(() => cover.setAttribute("data-leave", ""), 250);
    const done = setTimeout(() => cover.setAttribute("data-done", ""), 250 + 900);
    return () => {
      clearTimeout(leave);
      clearTimeout(done);
    };
  }, []);
  return null;
}
