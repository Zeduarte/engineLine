import type { ShowroomContent } from "@/lib/showroom";
export function FaqSection({ items }: { items: ShowroomContent["faqs"] }) {
  if (!items.length) return null;
  return (
    <section className="py-12">
      <h2 className="mb-6 text-2xl font-semibold text-paper">
        Perguntas frequentes
      </h2>
      <div className="divide-y divide-white/10 rounded-2xl border border-white/10 px-5">
        {items.map((f, i) => (
          <details key={i} className="group py-5">
            <summary className="cursor-pointer font-medium text-paper marker:text-accent">
              {f.question}
            </summary>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-paper/70">
              {f.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
