"use client";

import { createContext, useContext } from "react";
import { DEFAULT_BADGES, type BadgeDef } from "@/lib/badges";

/**
 * As etiquetas configuradas em Definições chegam a todos os cards do site
 * por aqui, sem ter de as passar a cada lista de viaturas.
 */
const Ctx = createContext<BadgeDef[]>(DEFAULT_BADGES);

export function BadgesProvider({ badges, children }: { badges: BadgeDef[]; children: React.ReactNode }) {
  return <Ctx.Provider value={badges}>{children}</Ctx.Provider>;
}

export function useBadges(): BadgeDef[] {
  return useContext(Ctx);
}
