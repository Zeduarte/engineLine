"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveWorkshopRate } from "@/lib/actions/settings";

/**
 * Valor/hora da mão de obra da oficina. Usado para converter as horas
 * registadas na Oficina em custo de mão de obra na página Custos e margens.
 */
export function WorkshopSettingsForm({ initialRate }: { initialRate: number }) {
  const [rate, setRate] = useState(String(initialRate ?? 0));
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveWorkshopRate({ workshop_hourly_rate: rate });
      if (res.ok) toast.success("Valor/hora guardado.");
      else toast.error(res.error ?? "Não foi possível guardar.");
    });
  }

  return (
    <form onSubmit={save} className="card p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
        Oficina — mão de obra
      </h2>
      <p className="mt-1 text-sm text-paper/50">
        Valor por hora usado para calcular o custo da mão de obra a partir das
        horas registadas na Oficina. Aparece automaticamente em Custos e margens.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block">
          <span className="field-label">Valor por hora (€)</span>
          <input
            className="field sm:w-48"
            type="number"
            min="0"
            max="1000"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </label>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "A guardar…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
