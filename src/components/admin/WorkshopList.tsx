"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createWorkshopVehicle } from "@/lib/actions/workshop";
import type { WorkshopVehicle } from "@/lib/workshop";

export function WorkshopList({ vehicles }: { vehicles: WorkshopVehicle[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return vehicles;
    return vehicles.filter((v) =>
      `${v.make} ${v.model} ${v.plate ?? ""}`.toLowerCase().includes(t),
    );
  }, [vehicles, q]);

  function submitNew(formData: FormData) {
    startTransition(async () => {
      const res = await createWorkshopVehicle(formData);
      if (res.ok && res.id) {
        toast.success("Viatura criada.");
        router.push(`/admin/oficina/${res.id}`);
      } else {
        toast.error(res.error ?? "Erro ao criar viatura.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra: pesquisa + adicionar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Procurar por marca, modelo ou matrícula…"
          className="field flex-1"
        />
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="btn-primary whitespace-nowrap"
        >
          {adding ? "Fechar" : "＋ Nova viatura"}
        </button>
      </div>

      {adding && (
        <form
          action={submitNew}
          className="card grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <div>
            <span className="field-label">Viatura (nome)</span>
            <input name="name" placeholder="Ex.: Yamaha R6" className="field" required />
          </div>
          <div>
            <span className="field-label">Matrícula</span>
            <input name="plate" placeholder="Ex.: 00-AA-00" className="field" required />
          </div>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "A criar…" : "Criar"}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="card grid place-items-center p-16 text-center">
          <p className="text-4xl">🔧</p>
          <p className="mt-3 font-medium text-paper">Nenhuma viatura</p>
          <p className="mt-1 text-sm text-paper/50">
            {q ? "Sem resultados para a pesquisa." : "Adicione uma viatura para começar."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <li key={v.id}>
              <Link
                href={`/admin/oficina/${v.id}`}
                className="card group block overflow-hidden transition-colors hover:border-accent/50"
              >
                <div className="relative aspect-[16/10] bg-ink-muted">
                  <Image
                    src={v.cover.src}
                    alt={v.cover.alt}
                    fill
                    sizes="(max-width:768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {v.totalHours > 0 && (
                    <span className="absolute right-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-ink">
                      {v.totalHours.toLocaleString("pt-PT")} h
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-paper group-hover:text-accent">
                    {v.make} {v.model !== "—" ? v.model : ""}
                  </p>
                  <p className="mt-1 font-mono text-sm text-paper/70">
                    {v.plate || "— sem matrícula —"}
                  </p>
                  <p className="mt-2 text-xs text-paper/40">
                    {v.logCount} {v.logCount === 1 ? "registo" : "registos"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
