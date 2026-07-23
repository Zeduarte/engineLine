"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * `template.tsx` (ao contrário de `layout.tsx`) re-monta a cada navegação, o
 * que o torna o sítio certo para transições de página. Fazemos um fade + subida
 * curta com clip, que dá a sensação do conteúdo a "abrir" — o complemento à
 * expansão do card na ficha de viatura.
 *
 * `useReducedMotion` (Framer Motion) corta a animação quando o utilizador pede
 * menos movimento: o conteúdo aparece instantaneamente no estado final.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
