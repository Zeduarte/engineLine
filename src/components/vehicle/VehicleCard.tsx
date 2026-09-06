"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Vehicle } from "@/types/vehicle";
import { formatKm, priceLabel } from "@/lib/format";
import { CompareButton } from "@/components/inventory/CompareButton";
import { FavoriteButton } from "@/components/inventory/FavoriteButton";

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Prioridade de imagem para os cards acima da dobra (LCP). */
  priority?: boolean;
  /** Índice para a jante do stagger (informativo). */
  index?: number;
  /**
   * Ativa a transição partilhada (morph card → galeria). Deve ser `true` só
   * para a grelha "fonte" (homepage/stock). Em listas secundárias da mesma
   * página (relacionadas, vistas recentemente) tem de ser `false`, senão dois
   * cards com o mesmo `layoutId` colidem e a imagem desaparece.
   */
  morph?: boolean;
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

export function VehicleCard({
  vehicle,
  priority = false,
  morph = true,
}: VehicleCardProps) {
  const images = vehicle.images.length ? vehicle.images : [];
  const badges = vehicleBadges(vehicle);
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0]!;
  const hasMultiple = images.length > 1;

  // Em listas secundárias (relacionadas, vistas recentemente) desligamos por
  // completo o framer-motion do media: evita qualquer colisão de layout
  // partilhado que deixava a imagem em branco. O zoom no hover passa a ser CSS.
  const Media: React.ElementType = morph ? motion.div : "div";
  const Zoom: React.ElementType = morph ? motion.div : "div";
  const mediaProps = morph ? { layoutId: `card-media-${vehicle.slug}` } : {};
  const zoomProps = morph
    ? {
        variants: { hover: { scale: 1.05 } },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
      }
    : {};

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
      className="group relative rounded-3xl border border-white/10 bg-ink-soft p-3 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.04]"
    >
      <Link
        href={`/viaturas/${vehicle.slug}`}
        className="block focus:outline-none"
        aria-label={`${vehicle.make} ${vehicle.model} ${vehicle.year} — ${priceLabel(vehicle.price, vehicle.priceOnRequest)}`}
      >
        <Media
          {...mediaProps}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-ink-muted"
        >
          <Zoom
            {...zoomProps}
            className={
              morph
                ? "absolute inset-0"
                : "absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105"
            }
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
          </Zoom>

          <div className="absolute right-4 top-4 flex items-center gap-2">
            <FavoriteButton slug={vehicle.slug} />
            <span className="rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
              {vehicle.year}
            </span>
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

          {/* Comparar — sempre visível no mobile (sem hover); no desktop
              aparece ao passar o rato. Tocar aqui alterna a comparação;
              tocar na foto (o Link) abre o anúncio. */}
          <div className="absolute bottom-3 right-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
            <CompareButton slug={vehicle.slug} />
          </div>
        </Media>

        <div className="mt-4 px-1 pb-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-paper">
              {vehicle.make} {vehicle.model}
            </h3>
            <p className="whitespace-nowrap text-lg font-semibold text-accent">
              {priceLabel(vehicle.price, vehicle.priceOnRequest)}
            </p>
          </div>

          {vehicle.variant && (
            <p className="mt-0.5 text-sm font-light text-paper/60">
              {vehicle.variant}
            </p>
          )}

          {/* Chips de especificações (ano, km, combustível, caixa). */}
          <div className="mt-3 flex flex-wrap gap-2">
            <SpecChip icon={<CalIcon />}>{vehicle.year}</SpecChip>
            <SpecChip icon={<GaugeIcon />}>{formatKm(vehicle.mileage)}</SpecChip>
            <SpecChip icon={<FuelIcon />}>{vehicle.fuel}</SpecChip>
            <SpecChip icon={<GearIcon />}>{vehicle.transmission}</SpecChip>
          </div>

          {vehicle.warrantyMonths ? (
            <p className="mt-3 text-sm text-paper/60">
              Garantia:{" "}
              <span className="font-semibold text-accent">
                {vehicle.warrantyMonths} meses
              </span>
            </p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}

/** Pílula com ícone + valor para os destaques do card. */
function SpecChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-paper/80">
      <span className="text-paper/60">{icon}</span>
      {children}
    </span>
  );
}

const ic = {
  className: "h-3.5 w-3.5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};
function CalIcon() {
  return (
    <svg {...ic}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </svg>
  );
}
function GaugeIcon() {
  return (
    <svg {...ic}>
      <path d="M12 13l4-3" />
      <path d="M4 18a8 8 0 1116 0" />
    </svg>
  );
}
function FuelIcon() {
  return (
    <svg {...ic}>
      <path d="M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16H5z" />
      <path d="M15 8h2.5A1.5 1.5 0 0119 9.5V16a1.5 1.5 0 003 0V9l-3-3" />
      <path d="M7 9h6" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg {...ic}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </svg>
  );
}
