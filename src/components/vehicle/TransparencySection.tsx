import type { Vehicle } from "@/types/vehicle";

/**
 * Bloco de transparência/confiança na ficha de viatura. Só mostra os itens que
 * o vendedor preencheu — se não houver nenhum, não renderiza nada.
 */
export function TransparencySection({ vehicle }: { vehicle: Vehicle }) {
  const items: { label: string; value: string }[] = [];

  if (vehicle.national) items.push({ label: "Nacional", value: "Sim" });
  if (vehicle.firstOwner) items.push({ label: "Primeiro dono", value: "Sim" });
  if (vehicle.owners != null)
    items.push({ label: "Nº de donos", value: String(vehicle.owners) });
  if (vehicle.serviceBook)
    items.push({ label: "Livro de revisões", value: "Completo" });
  if (vehicle.warrantyMonths)
    items.push({ label: "Garantia", value: `${vehicle.warrantyMonths} meses` });
  if (vehicle.lastInspection)
    items.push({ label: "Última inspeção", value: vehicle.lastInspection });

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="transparencia">
      <h2 id="transparencia" className="text-2xl font-semibold text-paper">
        Histórico & transparência
      </h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <li
            key={it.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-soft px-4 py-3"
          >
            <span className="flex items-center gap-2 text-sm text-paper/70">
              <span aria-hidden className="text-accent">
                ✓
              </span>
              {it.label}
            </span>
            <span className="text-sm font-medium text-paper">{it.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
