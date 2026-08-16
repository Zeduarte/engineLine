"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { OfferForm } from "./OfferForm";
import { InfoForm } from "./InfoForm";
import { TestDriveForm } from "./TestDriveForm";
import { ReserveForm } from "./ReserveForm";

type Mode = "offer" | "info" | "testdrive" | "reserve";

/**
 * Painel de ações da ficha de viatura: o visitante escolhe o que quer fazer
 * (proposta, informações, test drive, reservar) e o formulário respetivo abre
 * por baixo. Um único ponto de contacto, sem empilhar vários formulários.
 */
export function VehicleActions({
  vehicleName,
  vehicleId,
  price,
  canReserve,
  depositAmount,
}: {
  vehicleName: string;
  vehicleId?: string;
  price?: number | null;
  canReserve: boolean;
  depositAmount: number;
}) {
  const [mode, setMode] = useState<Mode | null>(null);

  const actions: { id: Mode; label: string; icon: string; primary?: boolean }[] = [
    { id: "offer", label: "Fazer uma proposta", icon: "€", primary: true },
    { id: "info", label: "Pedir mais informações", icon: "?" },
    { id: "testdrive", label: "Marcar test drive", icon: "▷" },
    ...(canReserve
      ? [{ id: "reserve" as Mode, label: "Reservar viatura", icon: "★" }]
      : []),
  ];

  const titles: Record<Mode, string> = {
    offer: "Fazer uma proposta",
    info: "Pedir mais informações",
    testdrive: "Marcar test drive",
    reserve: "Reservar viatura",
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-ink-soft p-6 md:p-8">
      <AnimatePresence mode="wait">
        {mode === null ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-2xl font-semibold text-paper">Interessado?</h2>
            <p className="mt-2 text-sm text-paper/50">
              Escolha como quer avançar com o {vehicleName}.
            </p>
            <div className="mt-6 grid gap-3">
              {actions.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setMode(a.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-colors ${
                    a.primary
                      ? "border-transparent bg-accent text-ink hover:brightness-105"
                      : "border-white/15 text-paper hover:border-accent hover:text-accent"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-base ${
                      a.primary ? "bg-ink/15" : "bg-white/5"
                    }`}
                    aria-hidden
                  >
                    {a.icon}
                  </span>
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => setMode(null)}
              className="mb-5 inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-paper"
            >
              <span aria-hidden>←</span> Voltar
            </button>
            <h2 className="mb-5 text-2xl font-semibold text-paper">
              {titles[mode]}
            </h2>

            {mode === "offer" && (
              <OfferForm
                vehicleName={vehicleName}
                vehicleId={vehicleId}
                price={price}
              />
            )}
            {mode === "info" && (
              <InfoForm vehicleName={vehicleName} vehicleId={vehicleId} />
            )}
            {mode === "testdrive" && (
              <TestDriveForm vehicleName={vehicleName} vehicleId={vehicleId} bare />
            )}
            {mode === "reserve" && (
              <ReserveForm
                vehicleName={vehicleName}
                vehicleId={vehicleId}
                depositAmount={depositAmount}
                bare
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
