"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { VehicleImage } from "@/types/vehicle";

/**
 * Galeria da ficha de viatura.
 *
 * A imagem principal usa `layoutId="card-media-${slug}"` — o mesmo do
 * `VehicleCard`. Quando o utilizador chega aqui a partir de um card, o Framer
 * Motion morfa o card na imagem grande (o "card a expandir"). Aqui a imagem
 * também recebe uma entrada suave para os casos de acesso direto (deep-link).
 */
export function Gallery({
  slug,
  images,
}: {
  slug: string;
  images: VehicleImage[];
}) {
  const [active, setActive] = useState(0);
  const current = images[active]!;
  const hasMultiple = images.length > 1;

  function step(dir: 1 | -1) {
    setActive((i) => (i + dir + images.length) % images.length);
  }

  return (
    <div>
      <motion.div
        layoutId={`card-media-${slug}`}
        className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-ink-muted"
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
        />

        {/* Setas para percorrer as fotos (esquerda/direita). */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-2xl text-paper backdrop-blur transition-colors hover:bg-ink/80 focus-visible:bg-ink/80 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Foto seguinte"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-2xl text-paper backdrop-blur transition-colors hover:bg-ink/80 focus-visible:bg-ink/80 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              ›
            </button>
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-medium text-paper backdrop-blur">
              {active + 1}/{images.length}
            </div>
          </>
        )}
      </motion.div>

      {images.length > 1 && (
        // Contentor com scroll horizontal PRÓPRIO: as miniaturas nunca
        // transbordam para a página (evita o scroll lateral em mobile).
        // `-mx-1 px-1` dá folga para o anel (ring) do item ativo não ser
        // cortado nas pontas; `snap-x` dá um encaixe suave ao arrastar.
        <div className="mt-4 -mx-1 overflow-x-auto overscroll-x-contain scroll-smooth px-1 pb-1 [scrollbar-width:thin]">
          <ul className="flex snap-x gap-3" role="list">
            {images.map((img, i) => (
              <li key={img.src} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Ver imagem ${i + 1}: ${img.alt}`}
                  aria-pressed={i === active}
                  className={`relative aspect-[4/3] w-20 overflow-hidden rounded-xl transition-all duration-300 md:w-28 ${
                    i === active
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-ink"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
