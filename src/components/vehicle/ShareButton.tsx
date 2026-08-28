"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Partilhar a viatura. Usa a Web Share API nativa quando disponível (abre o
 * menu de partilha do telemóvel: WhatsApp, Messenger, etc.); caso contrário
 * copia o link para a área de transferência.
 */
export function ShareButton({
  title,
  text,
}: {
  title: string;
  text?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: text ?? title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência.");
      } else {
        window.prompt("Copie o link da viatura:", url);
      }
    } catch (err) {
      // O utilizador cancelou o menu de partilha — não é erro.
      if ((err as Error)?.name !== "AbortError") {
        try {
          await navigator.clipboard?.writeText(url);
          toast.success("Link copiado para a área de transferência.");
        } catch {
          /* sem clipboard — ignora */
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Partilhar esta viatura"
      className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-paper/80 transition-colors hover:border-accent hover:text-accent"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path strokeLinecap="round" d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      Partilhar
    </button>
  );
}
