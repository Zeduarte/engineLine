"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Hero de topo com vídeo em fundo.
 *
 * O vídeo (`/public/hero/hero.mp4`) passa em loop, silenciado, atrás de uma
 * vinheta que garante contraste do texto. Com `prefers-reduced-motion` o vídeo
 * não arranca sozinho — mostra apenas o primeiro frame (poster).
 *
 * Para trocar o vídeo: substituir `public/hero/hero.mp4` (mp4/H.264 é o mais
 * compatível). Opcionalmente adicionar `public/hero/hero.webm` para melhor
 * compressão — já está previsto no segundo `<source>`.
 */
export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = usePrefersReducedMotion();

  return (
    <section
      className="relative h-dvh w-full overflow-hidden"
      aria-label="Viatura em destaque"
    >
      {/* Vídeo de fundo */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay={!reduce}
        muted
        loop
        playsInline
        preload="metadata"
        poster="/placeholder-car.svg"
        aria-hidden
      >
        <source src="/hero/hero.webm" type="video/webm" />
        <source src="/hero/hero.mp4" type="video/mp4" />
      </video>

      {/* Vinheta para contraste AA do texto sobre o vídeo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/30 to-ink"
      />

      {/* Conteúdo */}
      <div className="container-px pointer-events-none relative z-10 flex h-full flex-col items-center justify-center text-center">
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
          Uma seleção rigorosa de automóveis premium.
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
    </section>
  );
}
