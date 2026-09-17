"use client";

import { usePathname } from "next/navigation";
import type { VehicleType } from "@/lib/vehicle-categories";

export function InventoryTypeNav({
  selected,
  area = "public",
  target,
}: {
  selected: VehicleType | null;
  area?: "public" | "admin";
  target?: string;
}) {
  const path = usePathname();
  const destination = target ?? (
    area === "admin"
      ? path === "/admin/carros/novo"
        ? path
        : `/admin/${path.split("/")[2] ?? ""}`.replace(/\/$/, "")
      : path.startsWith("/viaturas/") ? "/inventario" : path
  );

  return (
    <nav
      aria-label={area === "admin" ? "Área do backoffice" : "Tipo de viatura"}
      className="my-4 flex gap-2"
    >
      {([
        { value: "car", label: "Carros" },
        { value: "motorcycle", label: "Motas" },
      ] as const).map((option) => (
        // Full navigation refreshes every server query and the client stores.
        <a
          key={option.value}
          href={`/api/vehicle-context?area=${area}&type=${option.value}&target=${encodeURIComponent(destination)}`}
          aria-current={selected === option.value ? "page" : undefined}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
            selected === option.value
              ? "border-accent bg-accent/10 text-accent"
              : "border-white/15 text-paper/70 hover:border-accent"
          }`}
        >
          {option.label}
        </a>
      ))}
    </nav>
  );
}
