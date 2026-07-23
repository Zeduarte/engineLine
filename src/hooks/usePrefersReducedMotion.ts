"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Fonte da verdade para acessibilidade de movimento.
 *
 * Devolve `true` quando o utilizador pediu menos movimento. Começa em `false`
 * (assunção segura no SSR) e reconcilia no cliente. Todos os hooks de animação
 * consultam este valor para, quando ativo, saltar para o estado final.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    setPrefersReduced(mql.matches);

    const onChange = (event: MediaQueryListEvent) =>
      setPrefersReduced(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return prefersReduced;
}
