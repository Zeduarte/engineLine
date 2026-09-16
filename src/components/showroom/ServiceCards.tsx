import Link from "next/link";
import type { ShowroomContent } from "@/lib/showroom";
export function ServiceCards({
  items,
}: {
  items: ShowroomContent["services"];
}) {
  const visible = items.filter((s) => s.enabled);
  if (!visible.length) return null;
  return (
    <section className="py-12">
      <p className="eyebrow mb-3">Ao seu lado</p>
      <h2 className="mb-6 text-3xl font-semibold">Os nossos serviços</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((s) => (
          <Link
            key={s.id}
            href={`/servicos/${s.id}`}
            className="rounded-2xl border border-white/10 bg-ink-soft p-6 transition-colors hover:border-accent"
          >
            <h3 className="text-xl font-semibold">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              {s.summary}
            </p>
            <span className="mt-5 block text-sm text-accent">Saber mais →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
