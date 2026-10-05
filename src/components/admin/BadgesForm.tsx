"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBadges } from "@/lib/actions/settings";
import {
  AUTO_BADGE_RULE,
  BADGE_ORANGE,
  BADGE_SWATCHES,
  newBadgeId,
  textOn,
  type AutoBadgeId,
  type BadgeDef,
} from "@/lib/badges";

/**
 * Definições → Etiquetas. Cada etiqueta dos cards: texto, cor e se aparece.
 * As automáticas (o site decide quando) ficam sempre; as do stand criam-se
 * aqui e marcam-se na ficha de cada viatura.
 */
export function BadgesForm({ initial }: { initial: BadgeDef[] }) {
  const router = useRouter();
  const [items, setItems] = useState<BadgeDef[]>(initial);
  const [newLabel, setNewLabel] = useState("");
  const [pending, start] = useTransition();

  const update = (id: string, patch: Partial<BadgeDef>) =>
    setItems((list) => list.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  function add() {
    const label = newLabel.trim().slice(0, 30);
    if (!label) return;
    setItems((list) => [...list, { id: newBadgeId(label), label, color: BADGE_ORANGE, enabled: true, auto: false }]);
    setNewLabel("");
  }

  function save() {
    start(async () => {
      const r = await saveBadges({ items: items.map(({ id, label, color, enabled }) => ({ id, label, color, enabled })) });
      if (r.ok) {
        toast.success("Etiquetas guardadas. Já aparecem no site.");
        router.refresh();
      } else toast.error(r.error ?? "Não foi possível guardar.");
    });
  }

  const row = (b: BadgeDef) => (
    <li key={b.id} className="flex flex-col gap-3 rounded-xl border border-white/10 p-3 sm:flex-row sm:items-center">
      <span
        className="w-fit max-w-full shrink-0 truncate rounded-full px-2.5 py-1 text-center text-[11px] font-semibold sm:w-28"
        style={{ backgroundColor: b.color, color: textOn(b.color), opacity: b.enabled ? 1 : 0.35 }}
      >
        {b.label || "—"}
      </span>
      <div className="min-w-0 flex-1">
        <input
          className="field h-9 py-1 text-sm"
          value={b.label}
          maxLength={30}
          aria-label="Texto da etiqueta"
          onChange={(e) => update(b.id, { label: e.target.value })}
        />
        <p className="mt-1 text-xs text-paper/40">
          {b.auto ? `Automática: ${AUTO_BADGE_RULE[b.id as AutoBadgeId]}` : "Do stand: marca-se na ficha da viatura"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {BADGE_SWATCHES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Cor ${c}`}
            onClick={() => update(b.id, { color: c })}
            className={`h-6 w-6 rounded-full border ${b.color.toUpperCase() === c.toUpperCase() ? "border-paper ring-2 ring-paper/40" : "border-white/20"}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-white/20" title="Outra cor">
          <span className="sr-only">Outra cor</span>
          <input
            type="color"
            value={b.color}
            onChange={(e) => update(b.id, { color: e.target.value.toUpperCase() })}
            className="absolute -inset-2 h-10 w-10 cursor-pointer"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-paper/70">
          <input type="checkbox" checked={b.enabled} onChange={(e) => update(b.id, { enabled: e.target.checked })} className="accent-[color:var(--accent)]" />
          Mostrar
        </label>
        {!b.auto && (
          <button
            type="button"
            onClick={() => setItems((list) => list.filter((x) => x.id !== b.id))}
            className="text-xs text-paper/40 hover:text-red-300"
            aria-label={`Apagar ${b.label}`}
          >
            Apagar
          </button>
        )}
      </div>
    </li>
  );

  return (
    <div className="card space-y-5 p-5">
      <div>
        <h3 className="text-sm font-semibold text-paper">Automáticas</h3>
        <ul className="mt-2 space-y-2">{items.filter((b) => b.auto).map(row)}</ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-paper">Do stand</h3>
        {items.some((b) => !b.auto) ? (
          <ul className="mt-2 space-y-2">{items.filter((b) => !b.auto).map(row)}</ul>
        ) : (
          <p className="mt-1 text-xs text-paper/50">Ainda não há. Crie, por exemplo, «IVA dedutível» ou «Garantia 24 meses».</p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            value={newLabel}
            maxLength={30}
            placeholder="Nova etiqueta (ex.: IVA dedutível)"
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" onClick={add} className="btn-ghost shrink-0">
            ＋ Adicionar
          </button>
        </div>
      </div>
      <p className="text-xs text-paper/40">Cada card mostra no máximo 3 etiquetas: primeiro o estado, depois as do stand e por fim as automáticas.</p>
      <button type="button" onClick={save} disabled={pending} className="btn-primary">
        {pending ? "A guardar…" : "Guardar etiquetas"}
      </button>
    </div>
  );
}
