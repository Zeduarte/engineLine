"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Vehicle } from "@/types/vehicle";
import { formatKm, priceLabel } from "@/lib/format";

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Prioridade de imagem para os cards acima da dobra (LCP). */
  priority?: boolean;
  /** Índice para a jante do stagger (informativo). */
  index?: number;
}

/**
 * Card de viatura reutilizado na homepage e no inventário.
 *
 * O `layoutId` (`card-media-${slug}`) marca a media para a transição partilhada
 * com a ficha de detalhe — o Framer Motion usa-o para morfar o elemento em vez
 * de fazer um corte seco. As micro-interações (elevação, zoom da imagem) vivem
 * em variantes `whileHover`, respeitando o teclado via `whileFocus`.
 */
export function VehicleCard({ vehicle, priority = false }: VehicleCardProps) {
  const cover = vehicle.images[0]!;

  return (
    <motion.article
      initial={false}
      whileHover="hover"
      whileFocus="hover"
      className="group relative"
    >
      <Link
        href={`/viaturas/${vehicle.slug}`}
        className="block focus:outline-none"
        aria-label={`${vehicle.make} ${vehicle.model} ${vehicle.year} — ${priceLabel(vehicle.price, vehicle.priceOnRequest)}`}
      >
        <motion.div
          layoutId={`card-media-${vehicle.slug}`}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-muted"
        >
          <motion.div
            variants={{ hover: { scale: 1.05 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className="object-cover"
            />
          </motion.div>

          <div className="absolute right-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
            {vehicle.year}
          </div>
        </motion.div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-paper">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="mt-1 text-sm font-light text-paper/50">
              {vehicle.fuel} · {vehicle.transmission} ·{" "}
              {formatKm(vehicle.mileage)}
            </p>
          </div>
          <p className="whitespace-nowrap text-lg font-semibold text-accent">
            {priceLabel(vehicle.price, vehicle.priceOnRequest)}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}
