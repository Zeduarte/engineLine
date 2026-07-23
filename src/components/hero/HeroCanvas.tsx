"use client";

import { useRef } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useImageSequence } from "@/hooks/useImageSequence";
import { drawPlaceholderFrame } from "./drawPlaceholderFrame";
import {
  FRAME_COUNT,
  USE_PROCEDURAL_PLACEHOLDER,
  framePath,
} from "./frames";
import { site } from "@/lib/site";

interface HeroCanvasProps {
  /** Elemento que define a área de scroll (o wrapper alto do hero). */
  triggerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Canvas 360º controlado pelo scroll.
 *
 * Porquê `<canvas>` e não 90 `<img>` empilhados: um único canvas evita 90 nós
 * no DOM e deixa-nos redesenhar apenas quando o índice de frame muda,
 * mantendo a memória e a árvore de layout mínimas. O ScrollTrigger com `scrub`
 * mapeia o progresso do scroll para um índice de frame (arredondado com
 * `snap`), e só nesse `onUpdate` é que redesenhamos.
 *
 * Preload: em modo real, `useImageSequence` carrega os frames em background
 * sem tocar no LCP. Em modo placeholder, desenhamos proceduralmente — zero
 * pedidos de rede.
 */
export function HeroCanvas({ triggerRef }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  const urls = USE_PROCEDURAL_PLACEHOLDER
    ? []
    : Array.from({ length: FRAME_COUNT }, (_, i) => framePath(i));
  const framesRef = useImageSequence(urls, !USE_PROCEDURAL_PLACEHOLDER);

  useIsomorphicLayoutEffect(() => {
    const canvas = canvasRef.current;
    const trigger = triggerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Sizing responsivo com Device Pixel Ratio ──────────────────────────
    let cssW = 0;
    let cssH = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(currentFrame);
    };

    // ── Render de um frame ────────────────────────────────────────────────
    let currentFrame = 0;
    const render = (frame: number) => {
      const idx = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(frame)));
      currentFrame = idx;

      if (USE_PROCEDURAL_PLACEHOLDER) {
        drawPlaceholderFrame(ctx, idx, FRAME_COUNT, cssW, cssH, site.accent);
        return;
      }

      const img = nearestLoaded(framesRef.current, idx);
      ctx.clearRect(0, 0, cssW, cssH);
      if (img) drawCover(ctx, img, cssW, cssH);
    };

    resize();
    window.addEventListener("resize", resize);

    // ── Ligação ao scroll ────────────────────────────────────────────────
    // Sem movimento: mostramos um frame de perfil fixo (estado final legível)
    // e não criamos ScrollTrigger nenhum.
    if (prefersReduced || !trigger) {
      render(Math.round(FRAME_COUNT * 0.25));
      return () => window.removeEventListener("resize", resize);
    }

    const state = { frame: 0 };
    const st = ScrollTrigger.create({
      trigger,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => {
        state.frame = self.progress * (FRAME_COUNT - 1);
        render(state.frame);
      },
    });

    // Redesenha quando novos frames terminam de carregar (só modo real).
    let raf = 0;
    if (!USE_PROCEDURAL_PLACEHOLDER) {
      const poll = () => {
        render(currentFrame);
        raf = requestAnimationFrame(poll);
      };
      raf = requestAnimationFrame(poll);
      // Para o poll assim que a sequência estiver completa.
      const stop = window.setTimeout(() => cancelAnimationFrame(raf), 15000);
      return () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(raf);
        clearTimeout(stop);
        st.kill();
      };
    }

    return () => {
      window.removeEventListener("resize", resize);
      st.kill();
    };
  }, [prefersReduced]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      role="img"
      aria-label="Vista 360º da viatura em destaque, controlada pelo scroll"
    />
  );
}

/** Frame carregado mais próximo, para evitar buracos durante o preload. */
function nearestLoaded(
  frames: Array<HTMLImageElement | undefined>,
  idx: number,
): HTMLImageElement | undefined {
  if (frames[idx]) return frames[idx];
  for (let d = 1; d < frames.length; d++) {
    if (frames[idx - d]) return frames[idx - d];
    if (frames[idx + d]) return frames[idx + d];
  }
  return undefined;
}

/** Desenha a imagem em modo "cover" centrado. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
