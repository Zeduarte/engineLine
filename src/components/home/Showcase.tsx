"use client";

import { useState } from "react";
import { Parallax } from "@/components/ui/Parallax";

/**
 * Banner de imagem fixa (showcase) na homepage — um retângulo cinematográfico
 * entre as viaturas em destaque e a secção de retoma.
 *
 * A imagem é definível pelo dono do site em `public/images/showcase.jpg`. Se o
 * ficheiro não existir, o `onError` esconde a imagem e fica um fundo elegante
 * (gradiente) — nunca mostra o ícone de imagem partida.
 */
export function Showcase() {
  const [failed, setFailed] = useState(false);

  return (
    <section className="container-px py-6 md:py-8">
      <div className="relative aspect-[21/8] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-ink-soft to-ink-muted">
        {!failed && (
          <Parallax amount={0.12} className="absolute inset-0 scale-110">
            {/* Plain <img> para poder cair no fallback via onError. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/showcase.jpg"
              alt=""
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          </Parallax>
        )}
        {/* Vinheta subtil para dar profundidade. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
      </div>
    </section>
  );
}
