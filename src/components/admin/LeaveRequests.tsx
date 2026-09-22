"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { describeRange, groupRanges, dayValue } from "@/lib/leave";
import type { PendingRequest } from "@/lib/leave-queries";
import { decideLeave } from "@/lib/actions/leave";

/**
 * Pedidos por decidir, agrupados em períodos.
 *
 * Um pedido é um conjunto de dias seguidos — aprova-se ou recusa-se o período
 * inteiro, que é como a conversa acontece ("posso ir de 13 a 17?").
 */
export function LeaveRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function decidir(profileId: string, days: string[], approve: boolean) {
    start(async () => {
      const res = await decideLeave({ profileId, days, approve });
      if (res.ok) {
        toast.success(approve ? "Período aprovado." : "Período recusado.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível registar a decisão.");
      }
    });
  }

  if (requests.length === 0) {
    return (
      <p className="card p-5 text-sm text-paper/60">
        Não há pedidos à espera de decisão.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((r) => (
        <section key={r.profileId} className="card space-y-3 p-5">
          <h2 className="font-medium text-paper">{r.name}</h2>
          {groupRanges(r.days).map((g) => {
            const dias = g.days.reduce((n, d) => n + dayValue(d), 0);
            const ids = g.days.map((d) => d.day);
            return (
              <div
                key={g.from}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3"
              >
                <div>
                  <p className="text-sm text-paper">
                    {describeRange(g.from, g.to)}
                  </p>
                  <p className="text-xs text-paper/50">
                    {dias.toLocaleString("pt-PT", { minimumFractionDigits: 1 })}{" "}
                    {dias === 1 ? "dia" : "dias"}
                    {g.days.some((d) => d.half) ? " · inclui meio dia" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decidir(r.profileId, ids, false)}
                    className="rounded-full border border-white/15 px-4 py-1.5 text-xs text-paper/70 transition-colors hover:border-red-400/60 hover:text-red-300"
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decidir(r.profileId, ids, true)}
                    className="btn-primary h-auto px-4 py-1.5 text-xs"
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
