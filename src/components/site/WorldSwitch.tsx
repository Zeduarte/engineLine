"use client";

import { usePathname } from "next/navigation";
import type { VehicleType } from "@/lib/vehicle-categories";
import { WORLD_LABEL, otherWorld, pathHasWorld } from "@/lib/world";

/**
 * Passagem para o outro mundo (carros ↔ motas).
 *
 * Mostra apenas o destino — quem está nos carros vê "Ver stock de motas". Não
 * aparece nas páginas comuns aos dois mundos (Sobre, Serviços, Contactos e
 * legais), onde escolher um tipo não muda nada.
 *
 * É uma navegação completa (`<a>`, não `<Link>`): a rota grava o cookie do
 * mundo e volta, o que refaz todas as queries do servidor.
 */
export function WorldSwitch({
  world,
  compact = false,
}: {
  world: VehicleType;
  /** Versão curta ("Motas"), para o header em ecrãs pequenos. */
  compact?: boolean;
}) {
  const pathname = usePathname();
  if (!pathHasWorld(pathname)) return null;

  const target = otherWorld(world);
  const label = WORLD_LABEL[target];
  // Numa ficha de viatura o slug é do mundo atual — volta ao stock.
  const destination = pathname.startsWith("/viaturas/") ? "/inventario" : pathname;

  return (
    <a
      href={`/api/vehicle-context?area=public&type=${target}&target=${encodeURIComponent(destination)}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-paper/60 transition-colors hover:border-accent hover:text-accent"
      title={`Mudar para o stock de ${label}`}
    >
      {target === "motorcycle" ? <MotoIcon /> : <CarIcon />}
      {compact ? capitalize(label) : `Ver stock de ${label}`}
    </a>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  className: "h-3.5 w-3.5",
  "aria-hidden": true,
};

function CarIcon() {
  return (
    <svg {...stroke}>
      <path d="M3 13l2-5a2 2 0 012-1.5h10A2 2 0 0119 8l2 5v5h-3M6 18H3v-5M6 18a1.5 1.5 0 003 0M15 18a1.5 1.5 0 003 0M6 18h9M3 13h18" />
    </svg>
  );
}

function MotoIcon() {
  return (
    <svg {...stroke}>
      <circle cx="5" cy="17" r="3" />
      <circle cx="19" cy="17" r="3" />
      <path d="M8 17h6l3-6h-4l-2-3H8M14 8h3" />
    </svg>
  );
}
