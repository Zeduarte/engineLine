import type { Vehicle, VehicleFilters, SortKey } from "@/types/vehicle";

/**
 * Helpers PUROS de inventário (filtros, ordenação).
 *
 * Sem dependências de servidor — podem ser importados por Client Components.
 * As leituras à base de dados (Supabase) vivem em `src/lib/queries.ts`
 * (server-only). Esta separação evita puxar `next/headers` para o browser.
 */

/** Lista ordenada e sem duplicados de valores de um campo — alimenta os filtros. */
export function distinctValues<K extends keyof Vehicle>(
  list: Vehicle[],
  key: K,
): Array<Vehicle[K]> {
  return Array.from(new Set(list.map((v) => v[key]))).sort((a, b) =>
    String(a).localeCompare(String(b), "pt"),
  );
}

const EMPTY_FILTERS: VehicleFilters = {
  query: null,
  make: null,
  model: null,
  fuel: null,
  transmission: null,
  body: null,
  minPrice: null,
  maxPrice: null,
  minYear: null,
  maxMileage: null,
};

export function emptyFilters(): VehicleFilters {
  return { ...EMPTY_FILTERS };
}

/** Aplica filtros de forma pura (sem mutação) — fácil de testar. */
export function applyFilters(
  list: Vehicle[],
  filters: VehicleFilters,
): Vehicle[] {
  const q = filters.query?.trim().toLowerCase();
  return list.filter((v) => {
    if (
      q &&
      !`${v.make} ${v.model} ${v.variant ?? ""}`.toLowerCase().includes(q)
    )
      return false;
    if (filters.make && v.make !== filters.make) return false;
    if (filters.model && v.model !== filters.model) return false;
    if (filters.fuel && v.fuel !== filters.fuel) return false;
    if (filters.transmission && v.transmission !== filters.transmission)
      return false;
    if (filters.body && v.body !== filters.body) return false;
    if (filters.minPrice != null && v.price < filters.minPrice) return false;
    if (filters.maxPrice != null && v.price > filters.maxPrice) return false;
    if (filters.minYear != null && v.year < filters.minYear) return false;
    if (filters.maxMileage != null && v.mileage > filters.maxMileage)
      return false;
    return true;
  });
}

const SORTERS: Record<SortKey, (a: Vehicle, b: Vehicle) => number> = {
  relevance: (a, b) => Number(b.featured) - Number(a.featured) || b.year - a.year,
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "year-desc": (a, b) => b.year - a.year,
  "mileage-asc": (a, b) => a.mileage - b.mileage,
};

export function sortVehicles(list: Vehicle[], key: SortKey): Vehicle[] {
  return [...list].sort(SORTERS[key]);
}
