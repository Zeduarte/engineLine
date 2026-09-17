import "server-only";
import { cookies } from "next/headers";
import type { VehicleType } from "./vehicle-categories";

export async function getVehicleSelection(
  area: "public" | "admin" = "public",
): Promise<VehicleType | null> {
  const value = (await cookies()).get(`engineline_${area}_type`)?.value;
  return value === "car" || value === "motorcycle" ? value : null;
}

export async function getPublicVehicleType(): Promise<VehicleType> {
  return (await getVehicleSelection()) ?? "car";
}

export async function getAdminVehicleType(): Promise<VehicleType> {
  return (await getVehicleSelection("admin")) ?? "car";
}
