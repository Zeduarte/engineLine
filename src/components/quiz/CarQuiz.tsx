"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import type { Vehicle } from "@/types/vehicle";

/**
 * Quiz "encontre o seu carro ideal".
 *
 * Puramente no cliente: pontua o inventário recebido do servidor de acordo com
 * as respostas e apresenta as melhores correspondências. Sem chamadas à BD —
 * rápido e funciona offline depois de carregado.
 */

type Answers = {
  budget?: string;
  body?: string;
  fuel?: string;
  transmission?: string;
  usage?: string;
};

const STEPS = [
  {
    key: "budget" as const,
    title: "Qual é o seu orçamento?",
    options: [
      { value: "0-20000", label: "Até 20.000 €" },
      { value: "20000-40000", label: "20.000 – 40.000 €" },
      { value: "40000-70000", label: "40.000 – 70.000 €" },
      { value: "70000-999999999", label: "Mais de 70.000 €" },
    ],
  },
  {
    key: "body" as const,
    title: "Que tipo de carro procura?",
    options: [
      { value: "SUV", label: "SUV" },
      { value: "Berlina", label: "Berlina" },
      { value: "Citadino", label: "Citadino" },
      { value: "Carrinha", label: "Carrinha" },
      { value: "Coupé", label: "Coupé / Desportivo" },
      { value: "any", label: "Indiferente" },
    ],
  },
  {
    key: "fuel" as const,
    title: "Que combustível prefere?",
    options: [
      { value: "Gasolina", label: "Gasolina" },
      { value: "Diesel", label: "Diesel" },
      { value: "Híbrido", label: "Híbrido" },
      { value: "Elétrico", label: "Elétrico" },
      { value: "any", label: "Indiferente" },
    ],
  },
  {
    key: "transmission" as const,
    title: "Caixa manual ou automática?",
    options: [
      { value: "Automática", label: "Automática" },
      { value: "Manual", label: "Manual" },
      { value: "any", label: "Indiferente" },
    ],
  },
  {
    key: "usage" as const,
    title: "Qual vai ser a utilização principal?",
    options: [
      { value: "city", label: "Cidade / dia a dia" },
      { value: "family", label: "Família / conforto" },
      { value: "travel", label: "Viagens longas" },
      { value: "performance", label: "Desporto / prazer de conduzir" },
    ],
  },
];

function scoreVehicle(v: Vehicle, a: Answers): number {
  let score = 0;

  if (a.budget) {
    const [min, max] = a.budget.split("-").map(Number);
    const price = v.price || 0;
    if (!v.priceOnRequest && price >= (min ?? 0) && price <= (max ?? Infinity)) {
      score += 40;
    } else if (!v.priceOnRequest && price <= (max ?? Infinity) + 5000) {
      score += 15; // perto do topo do orçamento
    }
  }

  if (a.body && a.body !== "any" && v.body === a.body) score += 25;
  if (a.fuel && a.fuel !== "any") {
    if (v.fuel === a.fuel) score += 20;
    else if (a.fuel === "Híbrido" && v.fuel === "Híbrido Plug-in") score += 18;
  }
  if (a.transmission && a.transmission !== "any" && v.transmission === a.transmission)
    score += 10;

  if (a.usage) {
    if (a.usage === "city" && (v.body === "Citadino" || v.body === "SUV")) score += 8;
    if (a.usage === "family" && (v.body === "SUV" || v.body === "Carrinha" || v.body === "Monovolume"))
      score += 8;
    if (a.usage === "travel" && (v.fuel === "Diesel" || v.body === "Berlina" || v.body === "SUV"))
      score += 8;
    if (a.usage === "performance" && (v.body === "Coupé" || v.power >= 250)) score += 10;
  }

  if (v.featured) score += 3;
  return score;
}

export function CarQuiz({ vehicles }: { vehicles: Vehicle[] }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const results = useMemo(() => {
    if (!done) return [];
    return vehicles
      .map((v) => ({ v, score: scoreVehicle(v, answers) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((r) => r.v);
  }, [done, vehicles, answers]);

  function pick(value: string) {
    const key = STEPS[step]!.key;
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step + 1 < STEPS.length) setStep(step + 1);
    else setDone(true);
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setDone(false);
  }

  if (done) {
    return (
      <div>
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-paper">
              {results.length > 0
                ? "As nossas sugestões para si"
                : "Ainda não temos uma correspondência exata"}
            </h2>
            <p className="mt-1 text-sm text-paper/60">
              {results.length > 0
                ? "Com base nas suas respostas, estas são as viaturas mais indicadas."
                : "Fale connosco — encontramos a viatura certa para si."}
            </p>
          </div>
          <button onClick={restart} className="btn-ghost shrink-0">
            ↺ Recomeçar
          </button>
        </div>

        {results.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((v) => (
              <VehicleCard key={v.slug} vehicle={v} />
            ))}
          </div>
        ) : (
          <a href="/contactos" className="btn-primary inline-flex">
            Falar com a equipa
          </a>
        )}
      </div>
    );
  }

  const current = STEPS[step]!;
  const progress = Math.round((step / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-paper/50">
          <span>
            Passo {step + 1} de {STEPS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.key}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="text-2xl font-semibold text-paper md:text-3xl">
            {current.title}
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {current.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => pick(opt.value)}
                className="rounded-2xl border border-white/10 bg-ink-soft px-5 py-4 text-left text-sm font-medium text-paper transition-all hover:border-accent hover:bg-accent/5"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-6 text-sm text-paper/50 transition-colors hover:text-paper"
        >
          ← Voltar
        </button>
      )}
    </div>
  );
}
