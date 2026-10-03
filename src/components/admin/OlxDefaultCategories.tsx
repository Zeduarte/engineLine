"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setDefaultOlxCategory } from "@/lib/actions/olx";
import { OlxCategoryPicker } from "./OlxCategoryPicker";

type Tipo = "car" | "motorcycle";

/** Categoria padrão do OLX para carros e para motas, escolhida na árvore do OLX. */
export function OlxDefaultCategories({ current }: { current: Record<Tipo, string | null> }) {
  const router = useRouter();
  const [open, setOpen] = useState<Tipo | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-paper/50">Categorias</h3>
      <p className="mt-1 text-xs text-paper/50">
        Onde os anúncios ficam no OLX. Cada viatura pode ter outra, escolhida na sua ficha.
      </p>
      <ul className="mt-3 space-y-3 text-sm">
        {(["car", "motorcycle"] as const).map((t) => (
          <li key={t}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-paper/70">{t === "car" ? "Carros" : "Motas"}:</span>
              {current[t] ? (
                <span className="text-paper">{current[t]}</span>
              ) : (
                <span className="text-amber-300">por escolher</span>
              )}
              <button type="button" className="text-xs text-accent hover:underline" onClick={() => setOpen(open === t ? null : t)}>
                {current[t] ? "Mudar" : "Escolher"}
              </button>
            </div>
            {open === t && (
              <div className="mt-2">
                <OlxCategoryPicker
                  busy={pending}
                  onCancel={() => setOpen(null)}
                  onPick={(c, path) =>
                    start(async () => {
                      const r = await setDefaultOlxCategory(t, c.id, path);
                      if (r.ok) {
                        toast.success(r.message ?? "Categoria guardada.");
                        setOpen(null);
                        router.refresh();
                      } else {
                        toast.error(r.error ?? "Não foi possível guardar.");
                      }
                    })
                  }
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
