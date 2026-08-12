import type { Testimonial } from "@/lib/queries";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} de 5 estrelas`} className="text-accent">
      {"★".repeat(rating)}
      <span className="text-paper/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

/**
 * Secção de testemunhos com nota agregada. Só renderiza se houver testemunhos
 * publicados (geridos no backoffice).
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;

  const avg =
    Math.round(
      (items.reduce((s, t) => s + t.rating, 0) / items.length) * 10,
    ) / 10;

  return (
    <section className="container-px py-24 md:py-32">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow mb-4">Testemunhos</p>
          <h2 className="max-w-2xl text-headline font-semibold text-paper">
            O que dizem os nossos clientes
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold text-accent">
            {avg.toString().replace(".", ",")}
          </span>
          <div>
            <Stars rating={Math.round(avg)} />
            <p className="text-xs text-paper/50">
              {items.length} avaliação{items.length === 1 ? "" : "ões"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.slice(0, 6).map((t) => (
          <figure
            key={t.id}
            className="flex flex-col rounded-2xl border border-white/10 bg-ink-soft p-6"
          >
            <Stars rating={t.rating} />
            <blockquote className="mt-4 flex-1 text-paper/80">
              “{t.body}”
            </blockquote>
            <figcaption className="mt-5 border-t border-white/5 pt-4">
              <p className="text-sm font-semibold text-paper">{t.name}</p>
              {t.role && <p className="text-xs text-paper/50">{t.role}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
