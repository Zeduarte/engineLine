"use client";

import { gsap } from "@/lib/gsap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Quando os filhos diretos devem entrar em cascata. */
  stagger?: number;
  y?: number;
  delay?: number;
  /** Selecionar filhos a animar; por defeito os filhos diretos. */
  childSelector?: string;
}

/**
 * Revela filhos com um fade-up ao entrar no viewport. Usa-se para blocos de
 * conteúdo genéricos (cards, parágrafos, listas). Para stagger de grelhas,
 * passar `stagger` > 0. Sob reduced-motion o conteúdo aparece de imediato.
 */
export function Reveal({
  children,
  className,
  stagger = 0,
  y = 24,
  delay = 0,
  childSelector,
}: RevealProps) {
  const ref = useScrollAnimation<HTMLDivElement>((root) => {
    const targets: gsap.TweenTarget = childSelector
      ? root.querySelectorAll(childSelector)
      : stagger > 0
        ? root.children
        : root;

    gsap.from(targets, {
      opacity: 0,
      y,
      duration: 0.8,
      ease: "power3.out",
      stagger,
      delay,
      scrollTrigger: { trigger: root, start: "top 85%", once: true },
    });
  });

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
