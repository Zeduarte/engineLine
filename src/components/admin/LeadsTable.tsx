"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteLead, setLeadStatus } from "@/lib/actions/leads";
import { LeadStatusBadge } from "./StatusBadge";
import type { LeadKind, LeadStatus } from "@/lib/supabase/database.types";

interface Lead {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  car_label: string | null;
  preferred_date: string | null;
  created_at: string;
}

const KIND_LABEL: Record<LeadKind, string> = {
  contact: "Contacto",
  test_drive: "Test drive",
  finance: "Financiamento",
};

const STATUSES: LeadStatus[] = ["new", "contacted", "closed"];
const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Novos",
  contacted: "Contactados",
  closed: "Fechados",
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [filter, setFilter] = useState<LeadStatus | "">("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter ? leads.filter((l) => l.status === filter) : leads),
    [leads, filter],
  );

  function change(id: string, status: LeadStatus) {
    startTransition(async () => {
      const res = await setLeadStatus(id, status);
      if (res.ok) toast.success("Estado atualizado.");
      else toast.error("Erro ao atualizar.");
    });
  }
  function remove(id: string) {
    if (!confirm("Apagar este lead?")) return;
    startTransition(async () => {
      const res = await deleteLead(id);
      if (res.ok) toast.success("Lead apagado.");
      else toast.error("Erro ao apagar.");
    });
  }

  if (leads.length === 0) {
    return (
      <div className="card grid place-items-center p-16 text-center">
        <p className="text-4xl">📭</p>
        <p className="mt-3 font-medium text-paper">Ainda não há leads</p>
        <p className="mt-1 text-sm text-paper/50">
          Os pedidos feitos no site aparecem aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip active={filter === ""} onClick={() => setFilter("")}>
          Todos ({leads.length})
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
          >
            {STATUS_LABEL[s]} ({leads.filter((l) => l.status === s).length})
          </FilterChip>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((l) => (
          <li key={l.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-paper">{l.name}</span>
                  <LeadStatusBadge status={l.status} />
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-paper/50">
                    {KIND_LABEL[l.kind]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-paper/60">
                  <a
                    href={`mailto:${l.email}`}
                    className="hover:text-accent hover:underline"
                  >
                    {l.email}
                  </a>
                  {l.phone && (
                    <>
                      {" · "}
                      <a
                        href={`tel:${l.phone}`}
                        className="hover:text-accent hover:underline"
                      >
                        {l.phone}
                      </a>
                    </>
                  )}
                </p>
                {l.car_label && (
                  <p className="mt-1 text-xs text-paper/50">
                    Viatura: {l.car_label}
                    {l.preferred_date && ` · Data: ${l.preferred_date}`}
                  </p>
                )}
                {l.message && (
                  <p className="mt-2 max-w-2xl rounded-lg bg-white/5 p-3 text-sm text-paper/70">
                    {l.message}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <select
                  value={l.status}
                  disabled={pending}
                  onChange={(e) => change(l.id, e.target.value as LeadStatus)}
                  className="rounded-lg border border-white/10 bg-ink px-2 py-1.5 text-xs text-paper"
                  aria-label="Estado do lead"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === "new"
                        ? "Novo"
                        : s === "contacted"
                          ? "Contactado"
                          : "Fechado"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(l.id)}
                  className="rounded-lg px-2 py-1.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
                  title="Apagar"
                >
                  🗑
                </button>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-paper/30">
              {new Date(l.created_at).toLocaleString("pt-PT")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        active
          ? "bg-accent font-medium text-ink"
          : "border border-white/15 text-paper/70 hover:border-white/40"
      }`}
    >
      {children}
    </button>
  );
}
