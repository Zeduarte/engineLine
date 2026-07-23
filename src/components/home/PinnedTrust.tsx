"use client";

import { useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const PILLARS = [
  {
    kpi: "150+",
    title: "Inspeção em 150 pontos",
    body: "Cada viatura passa por uma verificação mecânica e estética exaustiva antes de entrar no stand. Sem surpresas depois da compra.",
  },
  {
    kpi: "24 meses",
    title: "Garantia incluída",
    body: "Todas as viaturas incluem garantia de 24 meses, extensível. Cobertura clara, por escrito, sem letras pequenas.",
  },
  {
    kpi: "100%",
    title: "Histórico transparente",
    body: "Relatório completo de quilometragem, manutenções e proprietários anteriores. Verificável, sempre.",
  },
  {
    kpi: "48h",
    title: "Financiamento aprovado",
    body: "Simulação imediata e resposta de crédito em 48 horas, com as principais instituições financeiras do mercado.",
  },
] as const;

/**
 * Secção pinned: a coluna esquerda fixa-se enquanto o utilizador desce, e o
 * conteúdo técnico à direita (os pilares de confiança) muda por etapas.
 *
 * Implementação: a secção tem altura = (nº de painéis) × 100vh, dando um "step"
 * de scroll a cada painel. Um único ScrollTrigger, pinado no wrapper sticky,
 * mapeia o progresso para um índice ativo e faz crossfade dos painéis. O estado
 * ativo vive em React (para acessibilidade/aria), o movimento vive no GSAP.
 *
 * Sob reduced-motion, `useScrollAnimation` não corre: mostra-se o primeiro
 * painel e a lista completa fica acessível (ver fallback estático em baixo).
 */
export function PinnedTrust() {
  const [active, setActive] = useState(0);

  const ref = useScrollAnimation<HTMLDivElement>((root) => {
    const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", root);
    gsap.set(panels, { autoAlpha: 0, y: 30 });
    gsap.set(panels[0]!, { autoAlpha: 1, y: 0 });

    let current = 0;
    const show = (next: number) => {
      if (next === current) return;
      gsap.to(panels[current]!, { autoAlpha: 0, y: -30, duration: 0.4 });
      gsap.to(panels[next]!, { autoAlpha: 1, y: 0, duration: 0.5 });
      current = next;
      setActive(next);
    };

    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      pin: "[data-pin]",
      pinSpacing: false,
      onUpdate: (self) => {
        const idx = Math.min(
          PILLARS.length - 1,
          Math.floor(self.progress * PILLARS.length),
        );
        show(idx);
      },
    });
  });

  return (
    <section
      ref={ref}
      className="relative bg-ink-soft"
      style={{ height: `${PILLARS.length * 100}vh` }}
      aria-label="Porquê comprar no engineLine"
    >
      <div
        data-pin
        className="container-px flex h-dvh flex-col justify-center gap-12 md:grid md:grid-cols-2 md:items-center"
      >
        {/* Coluna fixa */}
        <div>
          <p className="eyebrow mb-6">Confiança</p>
          <h2 className="text-headline font-semibold text-paper">
            Comprar sem
            <br />
            margem para dúvidas.
          </h2>

          {/* Progresso por etapas — também navegável/legível. */}
          <ol className="mt-10 flex gap-2" aria-hidden>
            {PILLARS.map((_, i) => (
              <li
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                  i <= active ? "bg-accent" : "bg-white/10"
                }`}
              />
            ))}
          </ol>
        </div>

        {/* Painéis que trocam (visual, animado por GSAP) */}
        <div className="relative min-h-[16rem] md:min-h-[20rem]" aria-hidden>
          {PILLARS.map((p, i) => (
            <div
              key={i}
              data-panel
              className="absolute inset-0 flex flex-col justify-center"
            >
              <p className="text-6xl font-bold text-accent md:text-7xl">
                {p.kpi}
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-paper">
                {p.title}
              </h3>
              <p className="mt-3 max-w-md text-lg font-light text-paper/60">
                {p.body}
              </p>
            </div>
          ))}
        </div>

        {/* Fallback semântico/acessível: leitores de ecrã leem tudo em ordem. */}
        <ul className="sr-only">
          {PILLARS.map((p, i) => (
            <li key={i}>
              {p.kpi} — {p.title}: {p.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
