import type { Vehicle } from "@/types/vehicle";
import { formatKm, formatNumber } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";

/** Ficha técnica completa em grelha. Server Component (sem interatividade). */
export function Specs({ vehicle }: { vehicle: Vehicle }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Marca", value: vehicle.make },
    { label: "Modelo", value: vehicle.model },
    ...(vehicle.variant ? [{ label: "Versão", value: vehicle.variant }] : []),
    { label: "Ano", value: String(vehicle.year) },
    { label: "Quilómetros", value: formatKm(vehicle.mileage) },
    { label: "Combustível", value: vehicle.fuel },
    { label: "Caixa", value: vehicle.transmission },
    { label: "Carroçaria", value: vehicle.body },
    { label: "Potência", value: `${vehicle.power} cv` },
    ...(vehicle.displacement > 0
      ? [{ label: "Cilindrada", value: `${formatNumber(vehicle.displacement)} cm³` }]
      : []),
    { label: "Cor", value: vehicle.color },
    { label: "Portas", value: String(vehicle.doors) },
    { label: "Lugares", value: String(vehicle.seats) },
  ];

  return (
    <section aria-labelledby="specs-title">
      <h2 id="specs-title" className="text-2xl font-semibold text-paper">
        Ficha técnica
      </h2>
      <Reveal
        stagger={0.04}
        y={16}
        childSelector="[data-spec]"
        className="mt-6 grid grid-cols-1 gap-x-10 sm:grid-cols-2"
      >
        {rows.map((r) => (
          <div
            key={r.label}
            data-spec
            className="flex items-center justify-between border-b border-white/10 py-3.5"
          >
            <dt className="text-sm text-paper/50">{r.label}</dt>
            <dd className="text-sm font-medium text-paper">{r.value}</dd>
          </div>
        ))}
      </Reveal>
    </section>
  );
}
