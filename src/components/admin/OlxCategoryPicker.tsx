"use client";

import { useEffect, useState, useTransition } from "react";
import { browseOlxCategories } from "@/lib/actions/olx";
import type { OlxCategory } from "@/lib/olx/categories";

/**
 * Navegar na árvore de categorias do OLX, como ao criar um anúncio no OLX:
 * grupos principais → subcategorias → … até uma final, que se escolhe.
 * Cada nível é pedido ao OLX só quando se abre.
 */
export function OlxCategoryPicker({
  onPick,
  onCancel,
  busy = false,
}: {
  onPick: (category: OlxCategory, path: string) => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const [trail, setTrail] = useState<OlxCategory[]>([]);
  const [items, setItems] = useState<OlxCategory[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, startLoading] = useTransition();

  const parent = trail.at(-1) ?? null;

  useEffect(() => {
    setItems(null);
    setError(null);
    setQ("");
    startLoading(async () => {
      const r = await browseOlxCategories(parent?.id ?? null);
      if (r.ok) setItems(r.categories ?? []);
      else setError(r.error ?? "Não foi possível ler as categorias do OLX.");
    });
  }, [parent?.id]);

  const visible = (items ?? []).filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()));
  const pathOf = (c: OlxCategory) => [...trail, c].map((t) => t.name).join(" › ");

  return (
    <div className="rounded-xl border border-white/10 bg-ink p-4">
      <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm" aria-label="Caminho">
        <button type="button" onClick={() => setTrail([])} className="text-paper/60 hover:text-paper">
          OLX
        </button>
        {trail.map((t, i) => (
          <span key={t.id} className="flex items-center gap-1">
            <span className="text-paper/30">›</span>
            <button type="button" onClick={() => setTrail(trail.slice(0, i + 1))} className="text-paper/60 hover:text-paper">
              {t.name}
            </button>
          </span>
        ))}
      </nav>

      {items && items.length > 8 && (
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar neste nível…" className="field mb-3" />
      )}

      {error ? (
        <p role="alert" className="text-sm text-red-300">{error}</p>
      ) : loading || !items ? (
        <p className="text-sm text-paper/50">A carregar categorias do OLX…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-paper/50">Sem categorias aqui.</p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {visible.map((c) => {
            const leaf = c.is_leaf !== false;
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                {leaf ? (
                  <span className="text-sm text-paper">{c.name}</span>
                ) : (
                  <button type="button" onClick={() => setTrail([...trail, c])} className="flex-1 text-left text-sm text-paper hover:text-accent">
                    {c.name} <span className="text-paper/40">›</span>
                  </button>
                )}
                {leaf && (
                  <button type="button" disabled={busy} onClick={() => onPick(c, pathOf(c))} className="btn-ghost px-3 py-1 text-xs">
                    Escolher
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-paper/50 hover:text-paper">
          Cancelar
        </button>
      </div>
    </div>
  );
}
