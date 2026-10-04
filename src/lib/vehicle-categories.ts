export const MOTORCYCLE_BODIES = [
  "Scooter",
  "Naked",
  "Desportiva",
  "Trail",
  "Touring",
  "Chopper/Cruiser",
  "Enduro",
  "Moto 4",
] as const;
export const CAR_BODIES = [
  "Berlina",
  "SUV",
  "Coupé",
  "Carrinha",
  "Citadino",
  "Utilitário",
  "Descapotável",
  "Monovolume",
] as const;
export const VEHICLE_TYPES = ["car", "motorcycle"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/**
 * As motas dividem-se em dois mundos que quem procura não mistura: as de
 * estrada (2 rodas) e as moto 4 (quads). É o segmento que decide.
 */
export type MotorcycleKind = "road" | "quad";
export const MOTORCYCLE_KIND_LABEL: Record<MotorcycleKind, string> = {
  road: "Motas de estrada",
  quad: "Moto 4",
};
export const MOTORCYCLE_KIND_HINT: Record<MotorcycleKind, string> = {
  road: "2 rodas · scooter, naked, trail, touring…",
  quad: "4 rodas · quads e ATV",
};
export const QUAD_BODY = "Moto 4";
/** Segmentos das motas de estrada (todos menos Moto 4). */
export const ROAD_MOTORCYCLE_BODIES = MOTORCYCLE_BODIES.filter((b) => b !== QUAD_BODY);
export function motorcycleKind(body: string | null | undefined): MotorcycleKind {
  return body === QUAD_BODY ? "quad" : "road";
}
export function isMotorcycleBody(body: string): boolean {
  return (MOTORCYCLE_BODIES as readonly string[]).includes(body);
}
export function registrationLabel(year: number, month?: number | null): string {
  return month ? `${String(month).padStart(2, "0")}/${year}` : String(year);
}
export function isCampaign(vehicle: {
  price: number;
  priceOnRequest?: boolean;
  previousPrice?: number | null;
}): boolean {
  return (
    !vehicle.priceOnRequest &&
    vehicle.price > 0 &&
    (vehicle.previousPrice ?? 0) > vehicle.price
  );
}

// Sugestões; o editor também aceita marcas e modelos escritos livremente.
export const MOTORCYCLE_BRANDS = [
  "Aprilia",
  "Benelli",
  "BMW",
  "CFMoto",
  "Ducati",
  "Harley-Davidson",
  "Honda",
  "Husqvarna",
  "Kawasaki",
  "KTM",
  "Kymco",
  "Moto Guzzi",
  "Piaggio",
  "Royal Enfield",
  "Suzuki",
  "SYM",
  "Triumph",
  "Vespa",
  "Yamaha",
  "Zero",
] as const;
export function inventoryVehicleType(
  value: string | string[] | undefined,
): VehicleType | null {
  return value === "carros" ? "car" : value === "motas" ? "motorcycle" : null;
}
