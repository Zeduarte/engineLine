"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Orquestra o smooth scroll (Lenis) e sincroniza-o com o ScrollTrigger.
 *
 * Decisões-chave:
 *  - Uma única fonte de tempo: desligamos o RAF interno do Lenis
 *    (`autoRaf: false`) e conduzimos o Lenis a partir do ticker do GSAP.
 *    Ter dois loops de animação (o do Lenis e o do GSAP) provoca "jitter"
 *    porque leem o scroll em momentos ligeiramente diferentes.
 *  - `lenis.on("scroll", ScrollTrigger.update)`: cada frame do smooth scroll
 *    reavalia os triggers, mantendo scrubs e pins perfeitamente colados.
 *  - `prefers-reduced-motion`: não instanciamos o Lenis de todo — o browser
 *    usa o seu scroll nativo instantâneo e nenhuma animação é adicionada.
 *  - Só quando o movimento é permitido é que marcamos <html> com `.js-anim`,
 *    que ativa os estados iniciais "escondidos" no CSS. Sem JS ou com
 *    reduced-motion, o conteúdo permanece sempre visível.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const root = document.documentElement;

    if (prefersReduced) {
      root.classList.remove("js-anim");
      return;
    }

    root.classList.add("js-anim");

    const lenis = new Lenis({
      duration: 1.1,
      // Curva de saída suave, próxima do "momentum" da Apple.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: false,
      touchMultiplier: 1.4,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => {
      // GSAP fornece o tempo em segundos; o Lenis espera milissegundos.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Depois do primeiro paint, recalcular posições (fontes/imagens podem
    // ter alterado a altura da página).
    const refresh = () => ScrollTrigger.refresh();
    requestAnimationFrame(refresh);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      root.classList.remove("js-anim");
    };
  }, [prefersReduced]);

  return <>{children}</>;
}
