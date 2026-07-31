"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ScrollTrigger } from "@/lib/gsap";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { AnimatedText } from "@/components/ui/AnimatedText";

/**
 * Hero de topo com vídeo controlado pelo scroll (scrub).
 *
 * Arquitetura do pin: a secção exterior tem 180vh de altura, dando "pista" ao
 * scroll. Lá dentro, um wrapper `sticky top-0 h-dvh` fica colado no ecrã. O
 * ScrollTrigger mapeia o progresso do scroll DESTA secção para o `currentTime`
 * do vídeo — rodar a roda faz o vídeo avançar/recuar, tal como o antigo 360º.
 *
 * O vídeo não faz autoplay: nós controlamos o tempo. Com `prefers-reduced-motion`
 * mostramos apenas um frame fixo e não criamos ScrollTrigger.
 *
 * Trocar o vídeo: substituir `public/hero/hero.mp4`. (mp4/H.264 é o mais
 * compatível; opcionalmente juntar `public/hero/hero.webm`.)
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!video) return;

    video.pause();

    // Sem movimento: frame fixo, sem scroll-scrub.
    if (reduce || !section) return;

    let st: ScrollTrigger | null = null;

    const wire = () => {
      const duration = video.duration;
      if (!duration || Number.isNaN(duration)) return;
      st?.kill();
      st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          // Mapeia 0→1 do scroll para 0→duração do vídeo.
          const t = self.progress * duration;
          if (Math.abs(video.currentTime - t) > 0.01) {
            video.currentTime = t;
          }
        },
      });
      ScrollTrigger.refresh();
    };

    if (video.readyState >= 1 && video.duration) {
      wire();
    } else {
      video.addEventListener("loadedmetadata", wire, { once: true });
    }

    return () => {
      st?.kill();
      video.removeEventListener("loadedmetadata", wire);
    };
  }, [reduce]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[180vh]"
      aria-label="Viatura em destaque"
    >
      <div className="sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden">
        {/* Vídeo controlado pelo scroll */}
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          poster="/placeholder-car.svg"
          aria-hidden
        >
          <source src="/hero/hero.webm" type="video/webm" />
          <source src="/hero/hero.mp4" type="video/mp4" />
        </video>

        {/* Vinheta para contraste AA do texto sobre o vídeo. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink"
        />

        {/* Conteúdo */}
        <div className="container-px pointer-events-none relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow mb-6"
          >
            Stand premium · Portugal
          </motion.p>

          <AnimatedText
            as="h1"
            splitBy="word"
            className="mx-auto max-w-5xl text-display font-bold text-paper"
          >
            Cada viatura conta uma história de precisão
          </AnimatedText>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mx-auto mt-8 max-w-xl text-lg font-light text-paper/70"
          >
            Uma seleção rigorosa de automóveis premium. Roda para explorar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="pointer-events-auto mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/inventario"
              className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 ease-premium hover:scale-[1.03]"
            >
              Ver inventário
            </Link>
            <Link
              href="/sobre"
              className="rounded-full border border-paper/20 px-8 py-3.5 text-sm font-medium text-paper transition-colors duration-300 hover:border-paper/60"
            >
              Conhecer o stand
            </Link>
          </motion.div>
        </div>

        {/* Indicador de scroll. */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        >
          <div className="flex h-10 w-6 items-start justify-center rounded-full border border-paper/30 p-1.5">
            <motion.span
              className="block h-2 w-1 rounded-full bg-paper/60"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
