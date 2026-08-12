import type { CarStatus, LeadStatus } from "@/lib/supabase/database.types";

const CAR_LABELS: Record<CarStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  reserved: "Reservado",
  sold: "Vendido",
};

const CAR_STYLES: Record<CarStatus, string> = {
  draft: "bg-white/10 text-paper/70",
  published: "bg-emerald-500/15 text-emerald-300",
  reserved: "bg-amber-500/15 text-amber-300",
  sold: "bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: CarStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${CAR_STYLES[status]}`}
    >
      {CAR_LABELS[status]}
    </span>
  );
}

export const CAR_STATUS_LABEL = CAR_LABELS;

const LEAD_LABELS: Record<LeadStatus, string> = {
  new: "Nova",
  contacted: "Em contacto",
  proposal: "Proposta",
  won: "Ganha",
  lost: "Perdida",
  closed: "Fechada",
};
const LEAD_STYLES: Record<LeadStatus, string> = {
  new: "bg-accent/15 text-accent",
  contacted: "bg-sky-500/15 text-sky-300",
  proposal: "bg-violet-500/15 text-violet-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-red-500/15 text-red-300",
  closed: "bg-white/10 text-paper/50",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${LEAD_STYLES[status]}`}
    >
      {LEAD_LABELS[status]}
    </span>
  );
}
