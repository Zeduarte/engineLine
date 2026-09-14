"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveVehicleRate } from "@/lib/actions/operations";
import { formatPrice } from "@/lib/format";

/**
 * Valor/hora da mão de obra desta viatura. Por defeito usa o valor geral;
 * ligando a caixa, define-se um valor só para esta viatura.
 */
export function VehicleRateForm({
  carId,
  defaultRate,
  override,
}: {
  carId: string;
  defaultRate: number;
  override: number | null;
}) {
  const [on, setOn] = useState(override != null);
  const [value, setValue] = useState(String(override ?? defaultRate));
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const fd = new FormData();
      fd.set("car_id", carId);
      if (on) {
        fd.set("override", "on");
        fd.set("hourly_rate_override", value);
      }
      const res = await saveVehicleRate(fd);
      if (res.ok) toast.success("Valor por hora guardado.");
      else toast.error(res.error ?? "Não foi possível guardar.");
    });
  }

  return (
    <form onSubmit={submit} className="card p-5">
      <h2 className="text-lg font-semibold text-paper">Mão de obra desta viatura</h2>
      <p className="mt-1 text-sm text-paper/50">
        Por defeito usa o valor geral de {formatPrice(defaultRate)}/h. Ligue a
        caixa para aplicar um valor diferente só a esta viatura.
      </p>

      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-paper/80">
        <input
          type="checkbox"
          className="h-4 w-4 accent-accent"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
        />
        Alterar preço à hora para esta viatura
      </label>

      {on && (
        <div className="mt-3">
          <span className="field-label">Valor por hora (€)</span>
          <input
            className="field sm:w-48"
            type="number"
            min="0"
            max="1000"
            step="0.5"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-4">
        {pending ? "A guardar…" : "Guardar"}
      </button>
    </form>
  );
}
