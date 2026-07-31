"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const BRANDS = [
  "BMW",
  "Audi",
  "Porsche",
  "Mercedes-Benz",
  "Volkswagen",
  "Tesla",
  "Land Rover",
  "Volvo",
];

/**
 * Faixa de marcas em scroll contínuo (marquee). Duplicamos a lista e animamos
 * −50% em loop infinito para um deslize sem costura. Sob reduced-motion fica
 * estática (sem animação), mas continua legível.
 */
export function BrandMarquee() {
  const prefersReduced = usePrefersReducedMotion();
  const items = [...BRANDS, ...BRANDS];

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
              aria-hidden={i >= BRANDS.length}
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
