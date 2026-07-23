"use client";

import { gsap } from "@/lib/gsap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Intensidade do deslocamento como fração da altura do elemento.
   * Limitado a 0.15 por requisito de design (parallax subtil, nunca >15%).
   */
  amount?: number;
}

/**
 * Parallax vertical subtil, ligado ao scroll com `scrub`. O conteúdo desloca-se
 * no máximo `amount` (fração da própria altura) entre entrar e sair do
 * viewport — o suficiente para dar profundidade sem "flutuar".
 *
 * Requisito: nunca ultrapassar 15% de deslocamento.
 */
export function Parallax({
  children,
  className,
  amount = 0.12,
}: ParallaxProps) {
  const clamped = Math.min(Math.max(amount, 0), 0.15);

  const ref = useScrollAnimation<HTMLDivElement>((root) => {
    gsap.fromTo(
      root,
      { yPercent: -clamped * 100 },
      {
        yPercent: clamped * 100,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
  }, [clamped]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
