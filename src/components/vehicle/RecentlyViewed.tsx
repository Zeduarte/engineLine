"use client";

import { useMemo } from "react";
import type { Vehicle } from "@/types/vehicle";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { useLocalList, RECENT_KEY } from "@/hooks/useLocalList";

/**
 * "Vistas recentemente" — lê os slugs do histórico local e mostra os cards
 * correspondentes. Recebe todas as viaturas do servidor e filtra no cliente.
 * `excludeSlug` remove a viatura atual (na ficha, não faz sentido repeti-la).
 */
export function RecentlyViewed({
  vehicles,
  excludeSlug,
  max = 4,
}: {
  vehicles: Vehicle[];
  excludeSlug?: string;
  max?: number;
}) {
  const { items, ready } = useLocalList(RECENT_KEY);

  const bySlug = useMemo(
    () => new Map(vehicles.map((v) => [v.slug, v])),
    [vehicles],
  );
  const recent = useMemo(
    () =>
      items
        .filter((slug) => slug !== excludeSlug)
        .map((slug) => bySlug.get(slug))
        .filter((v): v is Vehicle => Boolean(v))
        .slice(0, max),
    [items, bySlug, excludeSlug, max],
  );

  if (!ready || recent.length === 0) return null;

  return (
    <section className="mt-24">
      <h2 className="mb-8 text-2xl font-semibold text-paper">
        Vistas recentemente
      </h2>
      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {recent.map((v) => (
          <VehicleCard key={v.slug} vehicle={v} />
        ))}
      </div>
    </section>
  );
}
