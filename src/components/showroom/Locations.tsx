import type { PointOfSale } from "@/lib/showroom";
export function Locations({ items }: { items: PointOfSale[] }) {
  if (!items.length) return null;
  return (
    <section className="py-10">
      <h2 className="mb-6 text-2xl font-semibold">Onde nos encontrar</h2>
      <div className="grid gap-6 md:grid-cols-2">
        {items.map((p) => {
          const query =
            p.latitude != null && p.longitude != null
              ? `${p.latitude},${p.longitude}`
              : `${p.address}, ${p.postalCode} ${p.city}, Portugal`;
          return (
            <article
              key={p.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-ink-soft"
            >
              <div className="space-y-3 p-6">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="text-paper/70">
                  {p.address}
                  <br />
                  {p.postalCode} {p.city}
                </p>
                {p.hours && (
                  <p className="whitespace-pre-line text-sm text-paper/60">
                    {p.hours}
                  </p>
                )}
                {p.phone && (
                  <a
                    className="block text-accent"
                    href={`tel:${p.phone.replace(/[^\d+]/g, "")}`}
                  >
                    {p.phone}
                  </a>
                )}
                {p.email && (
                  <a
                    className="block break-all text-accent"
                    href={`mailto:${p.email}`}
                  >
                    {p.email}
                  </a>
                )}
                <a
                  className="btn-ghost"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`}
                >
                  Obter direções ↗
                </a>
              </div>
              <iframe
                title={`Mapa de ${p.name}`}
                className="h-60 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
