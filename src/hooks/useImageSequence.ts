"use client";

import { useEffect, useRef } from "react";

/**
 * Pré-carrega uma sequência de imagens em background, sem bloquear o LCP.
 *
 * Estratégia de performance:
 *  - Os `Image()` são criados com `decoding="async"` e carregados por lotes
 *    pequenos, começando pelos primeiros frames (os visíveis no topo do
 *    scroll), para que a rotação inicial esteja pronta cedo.
 *  - Nada disto corre no servidor nem participa no LCP: o hero mostra o
 *    primeiro frame (ou o placeholder) imediatamente; os restantes chegam
 *    silenciosamente.
 *  - Devolve um array mutável (via ref) que o loop de render consulta. Frames
 *    ainda não carregados são `undefined` e o render faz fallback ao frame
 *    carregado mais próximo (sem "buracos" visuais).
 */
export function useImageSequence(
  urls: string[],
  enabled: boolean,
): React.RefObject<Array<HTMLImageElement | undefined>> {
  const framesRef = useRef<Array<HTMLImageElement | undefined>>(
    new Array(urls.length).fill(undefined),
  );

  useEffect(() => {
    if (!enabled || urls.length === 0) return;

    let cancelled = false;
    const frames = framesRef.current;
    const BATCH = 8;
    let next = 0;

    const loadBatch = () => {
      if (cancelled) return;
      const end = Math.min(next + BATCH, urls.length);
      let pending = end - next;
      if (pending <= 0) return;

      for (let i = next; i < end; i++) {
        const img = new Image();
        img.decoding = "async";
        img.src = urls[i]!;
        const done = () => {
          frames[i] = img;
          if (--pending === 0 && !cancelled) {
            next = end;
            if (next < urls.length) {
              // Cede o thread entre lotes para não competir com o LCP.
              requestIdleCallbackSafe(loadBatch);
            }
          }
        };
        img.onload = done;
        img.onerror = done; // não trava a sequência num frame em falta
      }
    };

    // Arranca depois do primeiro paint.
    const id = requestIdleCallbackSafe(loadBatch);
    return () => {
      cancelled = true;
      cancelIdleCallbackSafe(id);
    };
  }, [urls, enabled]);

  return framesRef;
}

type IdleId = number;

// `requestIdleCallback` não existe no Safari; usamos `setTimeout` como fallback.
function requestIdleCallbackSafe(cb: () => void): IdleId {
  const ric = (
    globalThis as typeof globalThis & {
      requestIdleCallback?: (cb: () => void) => number;
    }
  ).requestIdleCallback;
  return typeof ric === "function" ? ric(cb) : window.setTimeout(cb, 1);
}

function cancelIdleCallbackSafe(id: IdleId): void {
  const cic = (
    globalThis as typeof globalThis & {
      cancelIdleCallback?: (id: number) => void;
    }
  ).cancelIdleCallback;
  if (typeof cic === "function") cic(id);
  else clearTimeout(id);
}
