"use client";

import { toast } from "sonner";
import { useCompare, COMPARE_MAX } from "./CompareContext";

/** Botão de "comparar" para os cartões de viatura. */
export function CompareButton({ slug }: { slug: string }) {
  const { has, toggle, full } = useCompare();
  const active = has(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!active && full) {
      toast.error(`Só pode comparar até ${COMPARE_MAX} viaturas.`);
      return;
    }
    toggle(slug);
    toast.success(active ? "Removido da comparação." : "Adicionado à comparação.");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur transition-colors ${
        active
          ? "bg-accent text-ink"
          : "bg-ink/70 text-paper hover:bg-ink/90"
      }`}
    >
      {active ? "✓ A comparar" : "⇄ Comparar"}
    </button>
  );
}
