"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";

/**
 * Simulador de financiamento simples e indicativo.
 *
 * Usa a fórmula de anuidade (pagamento fixo) sobre o capital financiado:
 *   PMT = P · i / (1 − (1+i)^−n)
 * onde P = preço − entrada, i = taxa mensal, n = nº de meses.
 * A TAN é uma constante ilustrativa — em produção viria da instituição.
 * Sublinhamos "valor indicativo" para não induzir em erro.
 */
const TAN_ANUAL = 0.069; // 6,9% — exemplo

export function FinanceSimulator({ price }: { price: number }) {
  const [downPayment, setDownPayment] = useState(() => Math.round(price * 0.2));
  const [months, setMonths] = useState(72);

  const financed = Math.max(price - downPayment, 0);

  const monthly = useMemo(() => {
    if (financed <= 0) return 0;
    const i = TAN_ANUAL / 12;
    return (financed * i) / (1 - Math.pow(1 + i, -months));
  }, [financed, months]);

  return (
    <section
      aria-labelledby="finance-title"
      className="rounded-3xl border border-white/10 bg-ink-soft p-6 md:p-8"
    >
      <h2 id="finance-title" className="text-2xl font-semibold text-paper">
        Simulador de financiamento
      </h2>
      <p className="mt-2 text-sm text-paper/50">
        Valores indicativos. Sujeito a aprovação de crédito.
      </p>

      <div className="mt-8 space-y-8">
        <SliderField
          id="entrada"
          label="Entrada inicial"
          value={downPayment}
          min={0}
          max={price}
          step={500}
          display={formatPrice(downPayment)}
          onChange={setDownPayment}
        />

        <SliderField
          id="prazo"
          label="Prazo"
          value={months}
          min={12}
          max={96}
          step={12}
          display={`${months} meses`}
          onChange={setMonths}
        />
      </div>

      <div className="mt-8 flex items-end justify-between border-t border-white/10 pt-6">
        <div>
          <p className="text-sm text-paper/50">Mensalidade estimada</p>
          <p className="mt-1 text-4xl font-bold text-accent">
            {formatPrice(Math.round(monthly))}
            <span className="text-base font-normal text-paper/40">/mês</span>
          </p>
        </div>
        <div className="text-right text-sm text-paper/50">
          <p>Financiado: {formatPrice(Math.round(financed))}</p>
          <p>TAN {(TAN_ANUAL * 100).toFixed(1).replace(".", ",")}%</p>
        </div>
      </div>
    </section>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-paper">
          {label}
        </label>
        <span className="text-sm font-semibold text-paper">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-accent"
        aria-valuetext={display}
      />
    </div>
  );
}
