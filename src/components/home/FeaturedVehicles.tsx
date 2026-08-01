"use client";

import { useRef } from "react";
import Link from "next/link";
import type { Vehicle } from "@/types/vehicle";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { AnimatedText } from "@/components/ui/AnimatedText";

/**
 * Carrossel de anúncios recentes na homepage.
 *
 * Scroll horizontal com snap (nativo, suave em qualquer dispositivo) + botões
 * de navegação que fazem scroll por "página". Em mobile arrasta-se com o dedo.
 * A ordem vem já do servidor (mais recentes primeiro).
 */
export function FeaturedVehicles({
  vehicles,
  eyebrow = "Em destaque",
  title = "Os anúncios mais recentes",
}: {
  vehicles: Vehicle[];
  eyebrow?: string;
  title?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByPage(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <section className="container-px py-24 md:py-40">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-4">{eyebrow}</p>
          <AnimatedText
            as="h2"
            className="max-w-2xl text-headline font-semibold text-paper"
          >
            {title}
          </AnimatedText>
        </div>

        <div className="flex items-center gap-6">
          {vehicles.length > 0 && (
            <div className="hidden gap-2 md:flex">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label="Anterior"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-paper transition-colors hover:border-white/50"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label="Seguinte"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-paper transition-colors hover:border-white/50"
              >
                →
              </button>
            </div>
          )}
          <Link
            href="/inventario"
            className="group inline-flex items-center gap-2 text-sm font-medium text-paper/70 transition-colors hover:text-paper"
          >
            Ver todo o inventário
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-paper/50">
          Ainda não há anúncios publicados. Os novos aparecem aqui
          automaticamente.
        </p>
      ) : (
        <div
          ref={trackRef}
          className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {vehicles.map((vehicle, i) => (
            <div
              key={vehicle.slug}
              className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31%]"
            >
              <VehicleCard vehicle={vehicle} priority={i < 3} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
