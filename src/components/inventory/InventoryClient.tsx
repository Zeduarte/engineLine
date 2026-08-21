"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Vehicle, VehicleFilters, SortKey } from "@/types/vehicle";
import {
  applyFilters,
  sortVehicles,
  emptyFilters,
  distinctValues,
} from "@/lib/vehicles";
import { Filters } from "./Filters";
import { VehicleCard } from "@/components/vehicle/VehicleCard";

/**
 * Ilha cliente do inventário.
 *
 * Recebe TODAS as viaturas do servidor e faz a filtragem/ordenação em memória
 * — adequado a um stand (dezenas a centenas de viaturas). Quando a fonte passar
 * a API paginada, `applyFilters`/`sortVehicles` migram para query params sem
 * alterar este componente.
 *
 * Animação: `AnimatePresence` + `layout` fazem os cards reorganizarem-se com
 * transição ao filtrar/ordenar (entrada/saída em stagger via `delay` por
 * índice). O Framer Motion respeita `prefers-reduced-motion` do sistema.
 */
export function InventoryClient({
  vehicles,
  initialFilters,
}: {
  vehicles: Vehicle[];
  initialFilters?: Partial<VehicleFilters>;
}) {
  const [filters, setFilters] = useState<VehicleFilters>(() => ({
    ...emptyFilters(),
    ...initialFilters,
  }));
  const [sort, setSort] = useState<SortKey>("relevance");

  const options = useMemo(
    () => ({
      makes: distinctValues(vehicles, "make") as string[],
      // Os modelos acompanham a marca selecionada, se houver.
      models: distinctValues(
        filters.make ? vehicles.filter((v) => v.make === filters.make) : vehicles,
        "model",
      ) as string[],
      fuels: distinctValues(vehicles, "fuel"),
      transmissions: distinctValues(vehicles, "transmission"),
      bodies: distinctValues(vehicles, "body"),
    }),
    [vehicles, filters.make],
  );

  const results = useMemo(
    () => sortVehicles(applyFilters(vehicles, filters), sort),
    [vehicles, filters, sort],
  );

  return (
    <div className="space-y-10">
      <Filters
        filters={filters}
        sort={sort}
        options={options}
        resultCount={results.length}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        onSort={setSort}
        onReset={() => {
          setFilters(emptyFilters());
          setSort("relevance");
        }}
      />

      {results.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center text-paper/60">
          Nenhuma viatura corresponde aos filtros. Experimente alargar os
          critérios.
        </p>
      ) : (
        <motion.div
          layout
          className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {results.map((vehicle, i) => (
              <motion.div
                key={vehicle.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: Math.min(i * 0.05, 0.3),
                }}
              >
                <VehicleCard vehicle={vehicle} priority={i < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
