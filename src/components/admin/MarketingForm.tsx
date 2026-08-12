"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveMarketing } from "@/lib/actions/settings";

export interface MarketingInitial {
  ga4_id: string | null;
  pixel_id: string | null;
  reservation_enabled: boolean;
  deposit_amount: number;
}

export function MarketingForm({ initial }: { initial: MarketingInitial }) {
  const [pending, startTransition] = useTransition();
  const [ga4, setGa4] = useState(initial.ga4_id ?? "");
  const [pixel, setPixel] = useState(initial.pixel_id ?? "");
  const [reservation, setReservation] = useState(initial.reservation_enabled);
  const [deposit, setDeposit] = useState(initial.deposit_amount);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveMarketing({
        ga4_id: ga4,
        pixel_id: pixel,
        reservation_enabled: reservation,
        deposit_amount: deposit,
      });
      if (res.ok) toast.success("Definições guardadas.");
      else toast.error(res.error ?? "Erro ao guardar.");
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Marketing & Analytics
        </h2>
        <p className="mt-1 text-xs text-paper/40">
          Ative o rastreio de visitas. Os scripts só carregam depois de o
          visitante aceitar cookies (RGPD).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="field-label">Google Analytics 4 (ID de medição)</span>
          <input
            className="field"
            value={ga4}
            onChange={(e) => setGa4(e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
        </div>
        <div>
          <span className="field-label">Meta / Facebook Pixel (ID)</span>
          <input
            className="field"
            value={pixel}
            onChange={(e) => setPixel(e.target.value)}
            placeholder="1234567890"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Reservas online com sinal
        </h2>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-paper/80">
          <input
            type="checkbox"
            className="accent-[color:var(--accent)]"
            checked={reservation}
            onChange={(e) => setReservation(e.target.checked)}
          />
          Mostrar botão «Reservar com sinal» nas fichas das viaturas
        </label>
        <div className="mt-4 max-w-xs">
          <span className="field-label">Valor do sinal (€)</span>
          <input
            type="number"
            min={0}
            className="field"
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "A guardar…" : "Guardar"}
      </button>
    </form>
  );
}
