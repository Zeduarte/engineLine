"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Vehicle } from "@/types/vehicle";
import { formatKm, priceLabel } from "@/lib/format";
import { CompareButton } from "@/components/inventory/CompareButton";

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
/** Badges derivados dos dados da viatura (estado + heurísticas). */
function vehicleBadges(vehicle: Vehicle): { label: string; tone: string }[] {
  const badges: { label: string; tone: string }[] = [];

  if (vehicle.status === "reserved")
    badges.push({ label: "Reservado", tone: "bg-amber-500 text-ink" });
  if (vehicle.status === "sold")
    badges.push({ label: "Vendido", tone: "bg-red-500 text-white" });

  if (
    vehicle.previousPrice != null &&
    vehicle.price > 0 &&
    vehicle.previousPrice > vehicle.price
  ) {
    badges.push({ label: "Baixa de preço", tone: "bg-rose-500 text-white" });
  }
  if (vehicle.national) {
    badges.push({ label: "Nacional", tone: "bg-sky-500 text-ink" });
  }
  if (vehicle.createdAt) {
    const days =
      (Date.now() - new Date(vehicle.createdAt).getTime()) / 86_400_000;
    if (days <= 14) badges.push({ label: "Novidade", tone: "bg-accent text-ink" });
  }
  if (vehicle.mileage > 0 && vehicle.mileage < 30_000) {
    badges.push({ label: "Poucos km", tone: "bg-emerald-500 text-ink" });
  }
  return badges.slice(0, 3);
}

export function VehicleCard({ vehicle, priority = false }: VehicleCardProps) {
  const images = vehicle.images.length ? vehicle.images : [];
  const badges = vehicleBadges(vehicle);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0]!;
  const hasMultiple = images.length > 1;

  // As setas mudam a foto sem navegar para a ficha (o card é um Link).
  function step(e: React.MouseEvent, dir: 1 | -1) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + images.length) % images.length);
  }

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
              key={current.src}
              src={current.src}
              alt={current.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className="object-cover"
            />
          </motion.div>

          <div className="absolute right-4 top-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
            {vehicle.year}
          </div>

          {badges.length > 0 && (
            <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${b.tone}`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {/* Setas de navegação entre fotos */}
          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => step(e, -1)}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper opacity-0 backdrop-blur transition-opacity hover:bg-ink/80 group-hover:opacity-100 focus:opacity-100"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => step(e, 1)}
                aria-label="Foto seguinte"
                className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-ink/60 text-paper opacity-0 backdrop-blur transition-opacity hover:bg-ink/80 group-hover:opacity-100 focus:opacity-100"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-paper" : "w-1.5 bg-paper/40"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Comparar */}
          <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <CompareButton slug={vehicle.slug} />
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
