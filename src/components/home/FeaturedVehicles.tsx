import Link from "next/link";
import type { Vehicle } from "@/types/vehicle";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";

export function FeaturedVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <section className="container-px py-24 md:py-40">
      <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-4">Em destaque</p>
          <AnimatedText
            as="h2"
            className="max-w-2xl text-headline font-semibold text-paper"
          >
            Uma seleção que fala por si
          </AnimatedText>
        </div>
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

      {/* Stagger de entrada nos cards. */}
      <Reveal
        stagger={0.12}
        y={40}
        className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        {vehicles.map((vehicle, i) => (
          <VehicleCard key={vehicle.slug} vehicle={vehicle} priority={i < 3} />
        ))}
      </Reveal>
    </section>
  );
}
