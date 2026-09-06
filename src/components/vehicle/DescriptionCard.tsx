"use client";

import { useState } from "react";

/**
 * Descrição do anúncio num cartão, com "Ler mais / Ler menos". Fechada,
 * mostra as primeiras linhas com um fade; aberta, revela o texto todo.
 */
export function DescriptionCard({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const paragraphs = text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean);
  const isLong = text.length > 320 || paragraphs.length > 2;

  return (
    <section className="rounded-3xl bg-ink-soft p-6 md:p-8" aria-labelledby="descricao">
      <h2 id="descricao" className="text-2xl font-semibold text-paper">
        Descrição
      </h2>

      <div className="relative mt-4">
        <div
          className={
            open ? "" : "relative max-h-64 overflow-hidden"
          }
        >
          <div className="space-y-4 text-[15px] font-light leading-relaxed text-paper/75">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {!open && isLong && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-soft to-transparent" />
          )}
        </div>

        {isLong && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-4 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            {open ? "Ler menos" : "Ler mais"}
          </button>
        )}
      </div>
    </section>
  );
}
