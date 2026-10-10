"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_START_EVENT } from "@/lib/page-transition";

type Phase = "idle" | "loading" | "done";

/**
 * Barra de progresso de navegação no topo (estilo YouTube/GitHub).
 *
 * As páginas são Server Components: entre o clique e a nova página há um
 * pedido ao servidor. Sem feedback, o clique parece "não ter pegado" e o
 * utilizador clica outra vez. A barra arranca no próprio clique (evento do
 * `PageTransitions`) e completa quando a rota muda.
 *
 *  - `loading`: avança depressa até ~30% e depois abranda até 85% (nunca
 *    chega ao fim sozinha — dá sempre a sensação de progresso).
 *  - `done`: completa a 100% e desvanece.
 *  - Rede de segurança: se a rota não mudar em 8s, fecha-se sozinha.
 *
 * Só usa `transform`/`opacity` (composição na GPU, sem reflow).
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<number[]>([]);
  // Há uma navegação em curso? Evita que o arranque (adiado dois frames)
  // reabra a barra depois de uma navegação instantânea já ter terminado.
  const active = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  // Arranque no clique.
  useEffect(() => {
    function onStart() {
      clearTimers();
      active.current = true;
      setPhase("idle");
      // Dois frames: garante que o estado `idle` (scale 0, sem transição) é
      // pintado antes de animar para `loading`.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (active.current) setPhase("loading");
        }),
      );
      timers.current.push(window.setTimeout(() => finish(), 8000));
    }
    window.addEventListener(NAV_START_EVENT, onStart);
    return () => {
      window.removeEventListener(NAV_START_EVENT, onStart);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    if (!active.current) return;
    active.current = false;
    clearTimers();
    setPhase("done");
    timers.current.push(window.setTimeout(() => setPhase("idle"), 500));
  }

  // Conclusão quando a rota muda.
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const style: React.CSSProperties =
    phase === "loading"
      ? {
          transform: "scaleX(0.85)",
          opacity: 1,
          transition:
            "transform 6s cubic-bezier(0.08, 0.82, 0.17, 1), opacity 150ms ease",
        }
      : phase === "done"
        ? {
            transform: "scaleX(1)",
            opacity: 0,
            transition: "transform 200ms ease-out, opacity 300ms ease 150ms",
          }
        : { transform: "scaleX(0)", opacity: 0, transition: "none" };

  return (
    <div
      aria-hidden
      style={style}
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 origin-left bg-accent shadow-[0_0_10px_var(--accent)]"
    />
  );
}
