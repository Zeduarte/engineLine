"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Barra fina de progresso de scroll no topo. Usa `useScroll` (progresso do
 * documento) suavizado por uma spring — dá feedback de posição sem ruído
 * visual. O Framer Motion respeita `prefers-reduced-motion` (a barra passa a
 * saltar em vez de deslizar, mas mantém-se funcional).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-accent"
    />
  );
}
