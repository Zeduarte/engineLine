"use client";

import { BODY_HINT } from "@/lib/vehicle-categories";

/**
 * Escolher a categoria da viatura como no OLX: um quadrado por categoria,
 * com o nome e uma frase, em vez de uma lista fechada. Serve a ficha da
 * viatura (backoffice) e a pesquisa do site (com contagens).
 */
export function BodyPicker({
  options,
  value,
  onChange,
  counts,
  allLabel,
  compact = false,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (body: string | null) => void;
  /** Na pesquisa: quantas viaturas há em cada categoria. */
  counts?: Record<string, number>;
  /** Se definido, mostra um quadrado «Todas» que limpa a escolha. */
  allLabel?: string;
  compact?: boolean;
}) {
  const tile = (key: string, label: string, hint: string | undefined, active: boolean, onClick: () => void, count?: number) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-xl border text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
        compact ? "px-3 py-2" : "px-4 py-3"
      } ${active ? "border-accent bg-white/[0.06]" : "border-white/10 hover:border-white/30"}`}
    >
      <span className={`flex items-baseline justify-between gap-2 font-semibold ${active ? "text-accent" : "text-paper"} ${compact ? "text-sm" : ""}`}>
        {label}
        {count !== undefined && <span className="text-xs font-normal text-paper/40">{count}</span>}
      </span>
      {hint && !compact && <span className="mt-0.5 block text-xs text-paper/50">{hint}</span>}
    </button>
  );

  return (
    <div role="radiogroup" className={`grid gap-2 ${compact ? "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`}>
      {allLabel !== undefined &&
        tile("__all", allLabel, undefined, value === null, () => onChange(null),
          counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined)}
      {options.map((b) =>
        tile(b, b, BODY_HINT[b], value === b, () => onChange(value === b && allLabel !== undefined ? null : b), counts?.[b] ?? (counts ? 0 : undefined)),
      )}
    </div>
  );
}
