"use client";

import type { OlxField, OlxValues } from "@/lib/olx/fields";

/**
 * Campos do OLX dentro das secções da ficha (não numa caixa à parte). Cada
 * campo usa a lista de valores do próprio OLX. Devolve só os campos, para
 * entrarem na grelha da secção onde são chamados.
 */
export function OlxFieldInputs({
  fields,
  values,
  onChange,
  fix = false,
}: {
  fields: OlxField[];
  values: OlxValues;
  onChange: (next: OlxValues) => void;
  /** Campos que o site tem, mas cujo valor o OLX não reconheceu. */
  fix?: boolean;
}) {
  const set = (code: string, v: string | string[] | null) => {
    const next = { ...values };
    if (v === null || v === "" || (Array.isArray(v) && !v.length)) delete next[code];
    else next[code] = v;
    onChange(next);
  };

  return (
    <>
      {fields.map((f) => {
        const own = values[f.code];
        const label = (
          <span className="field-label">
            {f.label}
            {f.unit ? ` (${f.unit})` : ""}
            {f.required && <span className="text-accent"> *</span>}
          </span>
        );
        const note = fix ? (
          <p className="mt-1 text-xs text-amber-200/80">O OLX não reconhece o valor da ficha — escolha da lista do OLX.</p>
        ) : null;

        if (f.kind === "multi") {
          const chosen = Array.isArray(own) ? own : [];
          return (
            <div key={f.code} className="sm:col-span-2 lg:col-span-3">
              {label}
              <div className="flex flex-wrap gap-2">
                {f.values.map((v) => {
                  const on = chosen.includes(v.code);
                  return (
                    <button
                      key={v.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set(f.code, on ? chosen.filter((c) => c !== v.code) : [...chosen, v.code])}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        on ? "border-accent bg-white/[0.06] text-accent" : "border-white/15 text-paper/75 hover:border-white/30"
                      }`}
                    >
                      {on ? "✓ " : ""}
                      {v.label}
                    </button>
                  );
                })}
              </div>
              {note}
            </div>
          );
        }

        return (
          <label key={f.code} className="block">
            {label}
            {f.kind === "select" ? (
              <select className="field" value={typeof own === "string" ? own : ""} onChange={(e) => set(f.code, e.target.value || null)}>
                <option value="">{f.required ? "Selecione" : "Não indicado"}</option>
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
                maxLength={200}
                onChange={(e) => set(f.code, e.target.value)}
              />
            )}
            {note}
          </label>
        );
      })}
    </>
  );
}
