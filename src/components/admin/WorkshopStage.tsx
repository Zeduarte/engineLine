"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markVehiclePrepared, returnVehicleToWorkshop } from "@/lib/actions/workshop";
import type { CarStatus } from "@/lib/supabase/database.types";

/**
 * Passagem entre a oficina e Viaturas.
 *
 *  - Na oficina → "Dar como preparada": passa a Preparado e aparece em Viaturas.
 *  - Preparado (ou rascunho) → "Voltar para a oficina": sai de Viaturas.
 *
 * `leaveTo`: para onde ir depois de voltar à oficina. Em Viaturas a viatura
 * deixa de estar na lista, por isso a página da ficha já não faz sentido.
 */
export function WorkshopStage({
  carId,
  status,
  leaveTo,
}: {
  carId: string;
  status: CarStatus;
  leaveTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function prepare() {
    if (!confirm("Dar esta viatura como preparada? Passa a aparecer em Viaturas com o estado «Preparado».")) return;
    startTransition(async () => {
      const res = await markVehiclePrepared(carId);
      if (res.ok) toast.success("Viatura preparada — já está em Viaturas.");
      else toast.error(res.error ?? "Erro.");
      router.refresh();
    });
  }

  function sendBack() {
    if (!confirm("Voltar a pôr esta viatura na oficina? Sai de Viaturas até ser dada como preparada outra vez.")) return;
    startTransition(async () => {
      const res = await returnVehicleToWorkshop(carId);
      if (!res.ok) {
        toast.error(res.error ?? "Erro.");
        return;
      }
      toast.success("A viatura voltou para a oficina.");
      if (leaveTo) router.push(leaveTo);
      else router.refresh();
    });
  }

  if (status === "workshop") {
    return (
      <button type="button" onClick={prepare} disabled={pending} className="btn-primary">
        {pending ? "A guardar…" : "✓ Dar como preparada"}
      </button>
    );
  }

  if (status === "prepared" || status === "draft") {
    return (
      <button type="button" onClick={sendBack} disabled={pending} className="btn-ghost">
        {pending ? "A guardar…" : "↩ Voltar para a oficina"}
      </button>
    );
  }

  return null;
}
