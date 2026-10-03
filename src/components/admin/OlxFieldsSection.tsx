"use client";

import { valueLabel, type OlxField, type OlxValues } from "@/lib/olx/fields";

/**
 * «Campos do OLX» na ficha: todos os campos da categoria do OLX desta
 * viatura, com as listas de valores do próprio OLX. O que o site já sabe
 * aparece como «automático»; escolher um valor aqui sobrepõe-se a ele.
 */
export function OlxFieldsSection({
  fields,
  values,
  auto,
  onChange,
}: {
  fields: OlxField[];
  values: OlxValues;
  /** O que o site deduz sozinho (marca, ano, km, …). */
  auto: OlxValues;
  onChange: (next: OlxValues) => void;
}) {
  if (!fields.length) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-paper/60">
        Ainda não há campos do OLX para este tipo de viatura. Escolha a categoria em{" "}
        <strong className="text-paper/80">Integrações → OLX → Categorias</strong> e os campos do OLX aparecem aqui.
      </p>
    );
  }

  const set = (code: string, v: string | string[] | null) => {
    const next = { ...values };
    if (v === null || v === "" || (Array.isArray(v) && !v.length)) delete next[code];
    else next[code] = v;
    onChange(next);
  };

  const filled = fields.filter((f) => values[f.code] !== undefined || auto[f.code] !== undefined).length;
  const missing = fields.filter((f) => f.required && values[f.code] === undefined && auto[f.code] === undefined);

  return (
    <div className="space-y-4">
      <p className="text-xs text-paper/50">
        Os mesmos campos que o OLX pede ao criar um anúncio nesta categoria ({filled} de {fields.length} preenchidos).
        Os marcados com * são obrigatórios para publicar no OLX; os que dizem «automático» vêm da ficha acima.
      </p>
      {missing.length > 0 && (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Faltam para o OLX: {missing.map((f) => f.label).join(", ")}.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((f) => {
          const own = values[f.code];
          const guess = auto[f.code];
          const hint = own === undefined && guess !== undefined ? `automático: ${valueLabel(f, guess)}` : null;
          const label = (
            <span className="field-label">
              {f.label}
              {f.unit ? ` (${f.unit})` : ""}
              {f.required && <span className="text-accent"> *</span>}
            </span>
          );

          if (f.kind === "multi") {
            const chosen = Array.isArray(own) ? own : [];
            return (
              <div key={f.code} className="sm:col-span-2 lg:col-span-3">
                {label}
                <div className="flex flex-wrap gap-2">
                  {f.values.map((v) => (
                    <label key={v.code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-paper/80 hover:border-white/20">
                      <input
                        type="checkbox"
                        className="accent-[color:var(--accent)]"
                        checked={chosen.includes(v.code)}
                        onChange={() =>
                          set(f.code, chosen.includes(v.code) ? chosen.filter((c) => c !== v.code) : [...chosen, v.code])
                        }
                      />
                      {v.label}
                    </label>
                  ))}
                </div>
                {hint && <p className="mt-1 text-xs text-paper/40">{hint}</p>}
              </div>
            );
          }

          return (
            <label key={f.code} className="block">
              {label}
              {f.kind === "select" ? (
                <select className="field" value={typeof own === "string" ? own : ""} onChange={(e) => set(f.code, e.target.value || null)}>
                  <option value="">{hint ? `— ${hint} —` : "— escolher —"}</option>
                  {f.values.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field"
                  inputMode={f.kind === "number" ? "numeric" : undefined}
                  value={typeof own === "string" ? own : ""}
                  placeholder={hint ?? ""}
                  maxLength={200}
                  onChange={(e) => set(f.code, e.target.value)}
                />
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
