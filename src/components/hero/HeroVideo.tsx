"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface HeroVideoProps {
  /** Elemento que define a área de scroll (o wrapper alto do hero). */
  triggerRef: React.RefObject<HTMLElement | null>;
  /** Caminho do vídeo em /public. */
  src?: string;
  /** Imagem de cartaz mostrada antes do vídeo carregar (opcional). */
  poster?: string;
}

/**
 * Vídeo do hero "scrubbed" pelo scroll: em vez de reproduzir sozinho, o
 * `currentTime` do vídeo é conduzido pela posição do scroll — descer avança o
 * vídeo, subir recua-o.
 *
 * Decisões:
 *  - `muted` + `playsInline` + `preload="auto"`: requisitos para conseguir
 *    controlar o vídeo por JS (e para o iOS não abrir em ecrã inteiro). Nunca
 *    chamamos `play()`; movemos só o `currentTime`.
 *  - Esperamos por `loadedmetadata` para conhecer a `duration` antes de criar
 *    o ScrollTrigger — sem isso o mapeamento scroll→tempo seria inválido.
 *  - GSAP faz o tween da propriedade `currentTime` com `scrub`, o que suaviza o
 *    seeking (evita saltos bruscos entre frames).
 *  - `prefers-reduced-motion`: não criamos ScrollTrigger nenhum; o vídeo fica
 *    parado num frame inicial (estado final legível).
 *
 * Nota de performance: o scrubbing de vídeo só é fluido se o ficheiro tiver
 * keyframes frequentes. Ver instruções de re-encode no fim (ffmpeg).
 */
export function HeroVideo({
  triggerRef,
  src = "/hero/hero.mp4",
  poster,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const video = videoRef.current;
    const trigger = triggerRef.current;
    if (!video) return;

    let st: ScrollTrigger | undefined;
    let tween: gsap.core.Tween | undefined;

    const setup = () => {
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;

      // Sem movimento: mostra um frame estático e não liga o scroll.
      if (prefersReduced || !trigger) {
        video.currentTime = Math.min(0.1, duration);
        return;
      }

      // Alguns browsers só permitem seeking depois de um play()/pause().
      video.pause();

      tween = gsap.to(video, {
        currentTime: duration,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
        },
      });
      st = tween.scrollTrigger;
    };

    // `duration` pode já estar disponível (cache) ou chegar por evento.
    if (video.readyState >= 1) {
      setup();
    } else {
      video.addEventListener("loadedmetadata", setup, { once: true });
    }

    return () => {
      video.removeEventListener("loadedmetadata", setup);
      st?.kill();
      tween?.kill();
    };
  }, [prefersReduced, src]);

  return (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      src={src}
      poster={poster}
      muted
      playsInline
      preload="auto"
      // O vídeo é decorativo; o significado está no texto do hero.
      aria-hidden="true"
    />
  );
}
