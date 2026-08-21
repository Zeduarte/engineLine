"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Pesquisa rápida (Marca / Modelo / Combustível) para a homepage. Direto e
 * simples — leva o utilizador ao stock já filtrado. O Modelo depende da Marca.
 */
export function QuickSearch({
  makes,
  modelsByMake,
  fuels,
}: {
  makes: string[];
  modelsByMake: Record<string, string[]>;
  fuels: string[];
}) {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [fuel, setFuel] = useState("");

  const models = make ? modelsByMake[make] ?? [] : [];

  function search() {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (fuel) params.set("fuel", fuel);
    const qs = params.toString();
    router.push(qs ? `/inventario?${qs}` : "/inventario");
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-soft/90 p-5 shadow-xl shadow-black/30 backdrop-blur md:p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
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
            className="qs-select disabled:opacity-50"
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

        <Field label="Combustível">
          <select
            className="qs-select"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
          >
            <option value="">Selecionar</option>
            {fuels.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="button"
          onClick={search}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Pesquisar
        </button>
      </div>

      <style>{`
        .qs-select {
          width: 100%;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: #0A0A0A;
          padding: 0.7rem 1rem;
          font-size: 0.9rem;
          color: #F5F5F4;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          transition: border-color 0.2s;
        }
        .qs-select:focus { outline: none; border-color: var(--accent); }
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
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-accent">
        {label}
      </span>
      {children}
    </div>
  );
}
