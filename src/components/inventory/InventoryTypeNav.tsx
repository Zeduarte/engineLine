import Link from "next/link";
import type { VehicleType } from "@/lib/vehicle-categories";

export function InventoryTypeNav({
  selected,
}: {
  selected: VehicleType | null;
}) {
  return (
    <nav
      aria-label="Tipo de viatura"
      className="mb-6 grid grid-cols-3 gap-2 sm:max-w-lg"
    >
      {[
        { value: null, label: "Todos", href: "/inventario" },
        { value: "car", label: "Carros", href: "/inventario?tipo=carros" },
        { value: "motorcycle", label: "Motas", href: "/inventario?tipo=motas" },
      ].map((option) => (
        <Link
          key={option.label}
          href={option.href}
          scroll={false}
          aria-current={selected === option.value ? "page" : undefined}
          className={`rounded-xl border px-4 py-3 text-center font-semibold transition-colors ${selected === option.value ? "border-accent bg-accent/10 text-accent" : "border-white/15 text-paper/70 hover:border-accent hover:text-paper"}`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
