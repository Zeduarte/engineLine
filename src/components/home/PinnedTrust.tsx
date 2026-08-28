"use client";

import { useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import {
  DEFAULT_HOME_CONTENT,
  type TrustContent,
} from "@/lib/home-content";

/**
 * Secção pinned: enquanto o utilizador desce, a coluna esquerda (texto)
 * fixa-se e os pilares de confiança trocam por etapas; a coluna direita mostra
 * um painel de média (vídeo/imagem, definível em `public/trust/`) com o KPI do
 * pilar ativo em sobreposição. Se não houver média, mostra-se um visual
 * animado — a secção nunca fica vazia.
 *
 * Implementação: altura = (nº de painéis) × 100vh → um "step" de scroll por
 * painel. Um único ScrollTrigger pinado mapeia o progresso para o índice ativo
 * e faz crossfade dos painéis (GSAP). O índice ativo também vive em React,
 * para acessibilidade e para atualizar a média/KPI da direita.
 *
 * Sob reduced-motion, `useScrollAnimation` não corre: mostra-se o primeiro
 * painel e a lista completa fica acessível (fallback semântico em baixo).
 */

/** Selos de confiança fixos (reforçam a secção, sempre visíveis). */
const BADGES = [
  "Garantia 24 meses",
  "Retoma imediata",
  "Financiamento",
  "Entrega em todo o país",
];

export function PinnedTrust({
  content = DEFAULT_HOME_CONTENT.trust,
}: {
  content?: TrustContent;
}) {
  const PILLARS = content.pillars;
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

  const activePillar = PILLARS[active] ?? PILLARS[0]!;

  return (
    <section
      ref={ref}
      className="relative bg-ink-soft"
      // ~70vh de scroll por pilar — meio-termo entre o lento (100) e o rápido (50).
      style={{ height: `${PILLARS.length * 70}vh` }}
      aria-label="Porquê comprar no engineLine"
    >
      <div
        data-pin
        className="container-px flex h-dvh items-center overflow-hidden py-16"
      >
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Coluna esquerda — texto que troca por etapas */}
          <div>
            <p className="eyebrow mb-6">{content.eyebrow}</p>
            <h2 className="whitespace-pre-line text-headline font-semibold text-paper">
              {content.title}
            </h2>

            {/* Painéis que trocam (animados por GSAP) */}
            <div className="relative mt-10 min-h-[15rem]">
              {PILLARS.map((p, i) => (
                <div
                  key={i}
                  data-panel
                  className="absolute inset-0 flex flex-col justify-start"
                >
                  <p className="text-5xl font-bold text-accent md:text-6xl">
                    {p.kpi}
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-paper">
                    {p.title}
                  </h3>
                  <p className="mt-3 max-w-md text-lg font-light leading-relaxed text-paper/60">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Progresso por etapas */}
            <ol className="mt-8 flex gap-2" aria-hidden>
              {PILLARS.map((_, i) => (
                <li
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                    i <= active ? "bg-accent" : "bg-white/10"
                  }`}
                />
              ))}
            </ol>

            {/* Selos de confiança (sempre visíveis) */}
            <ul className="mt-8 flex flex-wrap gap-2">
              {BADGES.map((b) => (
                <li
                  key={b}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-paper/70"
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna direita — painel de média (vídeo/imagem definível) */}
          <div
            className="relative h-[42vh] max-h-[560px] min-h-[320px] overflow-hidden rounded-3xl border border-white/10 md:h-[64vh]"
            aria-hidden
          >
            {/* Fundo animado (fallback garantido, sempre visível). */}
            <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_70%_0%,rgba(232,177,90,0.28),transparent_55%),linear-gradient(180deg,#141416,#0A0A0A)]" />
            <div className="glow-pulse absolute -right-16 top-1/3 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />

            {/*
              Vídeo OPCIONAL: cai para o fundo animado se os ficheiros não
              existirem em public/trust/. Silencioso e em loop.
            */}
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/trust/trust.jpg"
            >
              <source src="/trust/trust.mp4" type="video/mp4" />
            </video>

            {/* Scrim para legibilidade do texto sobreposto. */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />

            {/* KPI do pilar ativo em sobreposição */}
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
              <p className="text-xs font-medium uppercase tracking-widest text-paper/50">
                {String(active + 1).padStart(2, "0")} / {String(PILLARS.length).padStart(2, "0")}
              </p>
              <p className="mt-2 text-6xl font-bold leading-none text-paper md:text-7xl">
                {activePillar.kpi}
              </p>
              <p className="mt-2 text-lg font-semibold text-accent">
                {activePillar.title}
              </p>
            </div>
          </div>
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
