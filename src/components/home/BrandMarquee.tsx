"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { DEFAULT_HOME_CONTENT } from "@/lib/home-content";

/**
 * Faixa de marcas em scroll contínuo (marquee). Duplicamos a lista e animamos
 * −50% em loop infinito para um deslize sem costura. Sob reduced-motion fica
 * estática (sem animação), mas continua legível.
 */
export function BrandMarquee({
  brands = DEFAULT_HOME_CONTENT.brands,
}: {
  brands?: string[];
}) {
  const prefersReduced = usePrefersReducedMotion();
  const items = [...brands, ...brands];

  return (
    <section
      aria-label="Marcas representadas"
      className="overflow-hidden border-y border-white/10 py-8"
    >
      <div className="relative flex">
        <motion.ul
          className="flex shrink-0 items-center gap-16 pr-16"
          animate={prefersReduced ? undefined : { x: ["0%", "-50%"] }}
          transition={{
            duration: 28,
            ease: "linear",
            repeat: Infinity,
          }}
          style={{ willChange: "transform" }}
        >
          {items.map((brand, i) => (
            <li
              key={`${brand}-${i}`}
              aria-hidden={i >= brands.length}
              className="whitespace-nowrap text-2xl font-semibold text-paper/30 transition-colors hover:text-paper/70 md:text-3xl"
            >
              {brand}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
