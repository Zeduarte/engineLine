"use client";

import { motion } from "framer-motion";
import { useLocalList, FAVORITES_KEY } from "@/hooks/useLocalList";

/**
 * Botão de favorito (❤️) — guarda o slug da viatura em `localStorage`, sem
 * necessidade de login. Reutilizado no card e na ficha. Quando colocado dentro
 * de um `<Link>` (card), o `stopPropagation`/`preventDefault` impede que o
 * clique navegue para a ficha.
 */
export function FavoriteButton({
  slug,
  variant = "overlay",
}: {
  slug: string;
  /** `overlay` = flutua sobre a foto (card); `inline` = botão normal (ficha). */
  variant?: "overlay" | "inline";
}) {
  const { has, toggle, ready } = useLocalList(FAVORITES_KEY);
  const active = ready && has(slug);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? "Remover dos favoritos" : "Guardar nos favoritos"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
          active
            ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
            : "border-white/15 text-paper/80 hover:border-rose-400/50 hover:text-rose-300"
        }`}
      >
        <Heart filled={active} />
        {active ? "Guardado" : "Guardar"}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      aria-pressed={active}
      aria-label={active ? "Remover dos favoritos" : "Guardar nos favoritos"}
      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur transition-colors ${
        active
          ? "bg-rose-500 text-white"
          : "bg-ink/60 text-paper hover:bg-ink/80"
      }`}
    >
      <Heart filled={active} />
    </motion.button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.7-9.6-9C1.1 8.7 2.4 5.6 5.4 5c1.9-.4 3.7.5 4.6 2 .9-1.5 2.7-2.4 4.6-2 3 .6 4.3 3.7 3 6.5-2.1 4.3-9.6 9-9.6 9z"
      />
    </svg>
  );
}
