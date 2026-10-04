"use client";

import { useState } from "react";
import type {
  VehicleFilters,
  FuelType,
  Transmission,
  BodyType,
  SortKey,
} from "@/types/vehicle";
import { MOTORCYCLE_KIND_HINT, MOTORCYCLE_KIND_LABEL, QUAD_BODY } from "@/lib/vehicle-categories";

interface FiltersProps {
  filters: VehicleFilters;
  sort: SortKey;
  options: {
    locations: { value: string; label: string }[];
    makes: string[];
    models: string[];
    fuels: FuelType[];
    transmissions: Transmission[];
    bodies: BodyType[];
    /** Quantas motas de estrada e moto 4 há no stock (só nas motas). */
    motoCounts?: { road: number; quad: number };
  };
  resultCount: number;
  onChange: (patch: Partial<VehicleFilters>) => void;
  onSort: (sort: SortKey) => void;
  onReset: () => void;
}

/** Atalhos rápidos que aplicam um conjunto de filtros de uma vez. */
const QUICK_CHIPS: { label: string; patch: Partial<VehicleFilters> }[] = [
  { label: "Elétrico", patch: { fuel: "Elétrico" } },
  { label: "Híbrido", patch: { fuel: "Híbrido" } },
  { label: "Automática", patch: { transmission: "Automática" } },
  { label: "SUV", patch: { body: "SUV" } },
  { label: "Até 30.000 km", patch: { maxMileage: 30000 } },
  { label: "Até 25.000 €", patch: { maxPrice: 25000 } },
];

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "Relevância",
  "price-asc": "Preço ↑",
  "price-desc": "Preço ↓",
  "year-desc": "Mais recentes",
  "mileage-asc": "Menos km",
};

/** Barra de filtros do inventário — totalmente controlada, sem estado próprio. */
export function Filters({
  filters,
  sort,
  options,
  resultCount,
  onChange,
  onSort,
  onReset,
}: FiltersProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-soft p-5 md:p-6">
      {/* Nas motas, a primeira escolha é o mundo: de estrada (2 rodas) ou
          moto 4. Quem procura um quad não quer ver scooters, e vice-versa. */}
      {filters.vehicleType === "motorcycle" && options.motoCounts && (
        <div role="radiogroup" aria-label="Tipo de mota" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            [null, "Todas as motas", `${options.motoCounts.road + options.motoCounts.quad} no stock`],
            ["road", MOTORCYCLE_KIND_LABEL.road, `${MOTORCYCLE_KIND_HINT.road} · ${options.motoCounts.road}`],
            ["quad", MOTORCYCLE_KIND_LABEL.quad, `${MOTORCYCLE_KIND_HINT.quad} · ${options.motoCounts.quad}`],
          ] as const).map(([kind, title, hint]) => {
            const active = filters.motoKind === kind;
            return (
              <button
                key={title}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ motoKind: kind, body: null })}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  active ? "border-accent bg-white/[0.06]" : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className={`block text-base font-semibold ${active ? "text-accent" : "text-paper"}`}>{title}</span>
                <span className="mt-0.5 block text-xs text-paper/50">{hint}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pesquisa livre */}
      <input
        type="search"
        value={filters.query ?? ""}
        onChange={(e) => onChange({ query: e.target.value || null })}
        placeholder="Pesquisar marca, modelo ou versão…"
        aria-label="Pesquisar viaturas"
        className="mb-4 w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-sm text-paper transition-colors placeholder:text-paper/30 focus:border-accent"
      />

      {/* Filtros básicos sempre visíveis: Marca, Modelo + botão de expandir */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <Field label="Marca">
          <Select
            value={filters.make ?? ""}
            onChange={(v) => onChange({ make: v || null, model: null })}
          >
            <option value="">Todas</option>
            {options.makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Modelo">
          <Select
            value={filters.model ?? ""}
            onChange={(v) => onChange({ model: v || null })}
          >
            <option value="">Todos</option>
            {options.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center justify-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm text-paper/80 transition-colors hover:border-accent hover:text-accent"
        >
          {expanded ? "Menos filtros" : "Mais filtros"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Filtros avançados (expansíveis) */}
      {expanded && (
        <div className="mt-5 border-t border-white/10 pt-5">
          {/* Atalhos rápidos */}
          <div className="mb-5 flex flex-wrap gap-2">
            {QUICK_CHIPS.filter(
              (chip) =>
                filters.vehicleType !== "motorcycle" || !chip.patch.body,
            ).map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => onChange(chip.patch)}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-paper/70 transition-colors hover:border-accent hover:text-accent"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-paper">
              <input
                type="checkbox"
                checked={filters.campaignOnly}
                onChange={(e) => onChange({ campaignOnly: e.target.checked })}
              />
              Apenas em campanha
            </label>
            <Field label="Combustível">
              <Select
                value={filters.fuel ?? ""}
                onChange={(v) =>
                  onChange({ fuel: (v || null) as FuelType | null })
                }
              >
                <option value="">Todos</option>
                {options.fuels.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Caixa">
              <Select
                value={filters.transmission ?? ""}
                onChange={(v) =>
                  onChange({ transmission: (v || null) as Transmission | null })
                }
              >
                <option value="">Todas</option>
                {options.transmissions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            {filters.motoKind !== "quad" && (
            <Field
              label={
                filters.vehicleType === "motorcycle"
                  ? "Categoria da mota"
                  : "Carroçaria"
              }
            >
              <Select
                value={filters.body ?? ""}
                onChange={(v) =>
                  onChange({ body: (v || null) as BodyType | null })
                }
              >
                <option value="">Todas</option>
                {options.bodies
                  // Nas motas de estrada, "Moto 4" não é uma categoria.
                  .filter((b) => filters.motoKind !== "road" || b !== QUAD_BODY)
                  .map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            )}

            {([
              ["Preço (€)","minPrice","maxPrice"],
              ["Ano","minYear","maxYear"],
              ["Quilómetros","minMileage","maxMileage"],
            ] as const).map(([label,min,max]) => <fieldset key={label} className="col-span-2 rounded-xl border border-white/10 p-3">
              <legend className="px-1 text-xs uppercase tracking-wider text-paper/60">{label}</legend>
              <div className="grid grid-cols-2 gap-3"><Field label={`${label} desde`}><NumberInput value={filters[min]} placeholder="Mínimo" onChange={v=>onChange({[min]:v})}/></Field><Field label={`${label} até`}><NumberInput value={filters[max]} placeholder="Máximo" onChange={v=>onChange({[max]:v})}/></Field></div>
            </fieldset>)}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
        <p className="text-sm text-paper/60" role="status" aria-live="polite">
          <span className="font-semibold text-paper">{resultCount}</span>{" "}
          {resultCount === 1 ? "viatura" : "viaturas"}
        </p>

        <div className="flex items-center gap-3">
          <Field label="Ordenar" inline>
            <Select value={sort} onChange={(v) => onSort(v as SortKey)}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </Select>
          </Field>
          <button
            type="button"
            onClick={onReset}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-paper/60 transition-colors hover:text-paper"
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  inline,
}: {
  label: string;
  children: React.ReactNode;
  inline?: boolean;
}) {
  return (
    <label className={inline ? "flex items-center gap-2" : "block"}>
      <span
        className={`text-xs font-medium uppercase tracking-wider text-paper/40 ${
          inline ? "" : "mb-1.5 block"
        }`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-paper transition-colors focus:border-accent"
    >
      {children}
    </select>
  );
}

function NumberInput({
  value,
  placeholder,
  onChange,
}: {
  value: number | null;
  placeholder?: string;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-paper transition-colors focus:border-accent"
    />
  );
}
