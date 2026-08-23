"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Item = { make: string; model: string; fuel: string };

/**
 * Pesquisa rápida da homepage — apenas Marca e Modelo, direto ao ponto. O botão
 * mostra quantas viaturas correspondem e leva ao stock já filtrado.
 */
export function QuickSearch({ vehicles }: { vehicles: Item[] }) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const makes = useMemo(
    () =>
      [...new Set(vehicles.map((v) => v.make))].sort((a, b) =>
        a.localeCompare(b, "pt"),
      ),
    [vehicles],
  );
  const models = useMemo(
    () =>
      make
        ? [...new Set(vehicles.filter((v) => v.make === make).map((v) => v.model))].sort(
            (a, b) => a.localeCompare(b, "pt"),
          )
        : [],
    [vehicles, make],
  );

  const count = useMemo(
    () =>
      vehicles.filter(
        (v) => (!make || v.make === make) && (!model || v.model === model),
      ).length,
    [vehicles, make, model],
  );

  function search() {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    const qs = params.toString();
    router.push(qs ? `/inventario?${qs}` : "/inventario");
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <Field label="Marca">
          <select
            className="qs-select"
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
          >
            <option value="">Selecionar</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Modelo">
          <select
            className="qs-select"
            value={model}
            disabled={!make}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">{make ? "Selecionar" : "Escolha a marca"}</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="button"
          onClick={search}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Ver stock ({count})
        </button>
      </div>

      <style>{`
        .qs-select {
          width: 100%;
          border-radius: 9999px;
          border: 1px solid #d4d4d8;
          background: #fff;
          padding: 0.8rem 1.1rem;
          font-size: 0.95rem;
          color: #18181b;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.1rem center;
          transition: border-color 0.2s;
        }
        .qs-select:focus { outline: none; border-color: var(--accent); }
        .qs-select:disabled { opacity: 0.55; }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
        {label}
      </span>
      {children}
    </div>
  );
}
