"use client";

import { createContext, useContext } from "react";
import type { VehicleType } from "@/lib/vehicle-categories";

const World = createContext<VehicleType>("car");

export function VehicleWorld({
  type,
  children,
}: {
  type: VehicleType;
  children: React.ReactNode;
}) {
  return <World.Provider value={type}>{children}</World.Provider>;
}

export function useVehicleWorld() {
  return useContext(World);
}
