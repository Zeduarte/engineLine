export const MOTORCYCLE_BODIES = [
  "Scooter",
  "Naked",
  "Desportiva",
  "Trail",
  "Touring",
  "Chopper/Cruiser",
  "Enduro",
] as const;
export const CAR_BODIES = [
  "Berlina",
  "SUV",
  "Coupé",
  "Carrinha",
  "Citadino",
  "Descapotável",
  "Monovolume",
] as const;
export const VEHICLE_TYPES = ["car", "motorcycle"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];
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
