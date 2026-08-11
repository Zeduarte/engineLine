"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CHANNELS } from "@/lib/schemas";

export function FeedUrls({ baseUrl }: { baseUrl: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(url: string, id: string) {
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(id);
        toast.success("Link copiado.");
        setTimeout(() => setCopied(null), 1500);
      },
      () => toast.error("Não foi possível copiar."),
    );
  }

  return (
    <div className="card space-y-3 p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Links dos feeds de exportação
        </h2>
        <p className="mt-1 text-xs text-paper/40">
          Forneça o link a cada plataforma que suporte importação por feed. Só
          inclui viaturas publicadas com esse canal selecionado.
        </p>
      </div>
      <ul className="space-y-2">
        {CHANNELS.map((c) => {
          const url = `${baseUrl}/api/feeds/${c.id}.xml`;
          return (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-2.5"
            >
              <span className="w-28 shrink-0 text-sm font-medium text-paper">
                {c.label}
              </span>
              <code className="min-w-0 flex-1 truncate text-xs text-paper/50">
                {url}
              </code>
              <a
                href={`/api/feeds/${c.id}.csv`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-paper/70 hover:border-white/40"
              >
                CSV
              </a>
              <button
                type="button"
                onClick={() => copy(url, c.id)}
                className="rounded-lg border border-white/15 px-2.5 py-1 text-xs text-paper/70 hover:border-accent hover:text-accent"
              >
                {copied === c.id ? "Copiado ✓" : "Copiar XML"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
