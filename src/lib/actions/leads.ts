"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/schemas";
import type { LeadStatus, LeadKind } from "@/lib/supabase/database.types";

const KIND_LABEL: Record<LeadKind, string> = {
  contact: "Contacto",
  test_drive: "Test drive",
  finance: "Financiamento",
  trade_in: "Retoma",
  order: "Encomenda",
  reservation: "Reserva",
  offer: "Proposta",
  alert: "Alerta de stock",
};

/**
 * Notifica o staff de um novo lead através de um webhook configurável
 * (Slack/Discord/Make/Zapier). Best-effort: lê o URL com a chave de serviço
 * (a RLS bloqueia o utilizador anónimo) e falha em silêncio — nunca afeta a
 * submissão do lead. Envia `text` e `content` para ser compatível com Slack
 * (usa `text`) e Discord (usa `content`).
 */
async function notifyNewLead(lead: {
  kind: LeadKind;
  name: string;
  email: string;
  phone: string | null;
  car_label: string | null;
  message: string | null;
}) {
  try {
    const admin = createAdminClient();
    if (!admin) return;
    const { data } = await admin
      .from("integration_secrets")
      .select("data")
      .eq("id", 1)
      .maybeSingle();
    const webhook = (data?.data as Record<string, unknown> | undefined)
      ?.lead_webhook;
    if (typeof webhook !== "string" || !webhook.startsWith("http")) return;

    const lines = [
      `🚗 *Novo lead: ${KIND_LABEL[lead.kind]}*`,
      `Nome: ${lead.name}`,
      `Email: ${lead.email}`,
      lead.phone ? `Telefone: ${lead.phone}` : null,
      lead.car_label ? `Viatura: ${lead.car_label}` : null,
      lead.message ? `Mensagem: ${lead.message}` : null,
    ].filter(Boolean);
    const body = lines.join("\n");

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: body, content: body }),
    });
  } catch {
    // Notificação é acessória — nunca bloqueia nem falha a submissão.
  }
}

export interface LeadActionState {
  ok: boolean;
  error?: string;
}

/**
 * Cria um lead a partir de um formulário público (contacto / test drive).
 *
 * Chamada por Client Components via `useActionState`. A RLS permite `insert`
 * anónimo na tabela `leads`; leitura/gestão fica reservada ao staff.
 */
export async function submitLead(
  _prev: LeadActionState,
  formData: FormData,
): Promise<LeadActionState> {
  const parsed = leadSchema.safeParse({
    kind: formData.get("kind") ?? "contact",
    car_id: (formData.get("car_id") as string) || null,
    car_label: formData.get("car_label") ?? "",
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
    preferred_date: formData.get("preferred_date") ?? "",
    details: formData.get("details") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const v = parsed.data;

  // Detalhes estruturados (retoma/encomenda) chegam como JSON.
  let carDetails: Record<string, unknown> = {};
  if (v.details) {
    try {
      const parsedDetails = JSON.parse(v.details);
      if (parsedDetails && typeof parsedDetails === "object") {
        carDetails = parsedDetails as Record<string, unknown>;
      }
    } catch {
      // ignora JSON inválido — a lead entra na mesma sem detalhes.
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    kind: v.kind,
    car_id: v.car_id ?? null,
    car_label: v.car_label || null,
    name: v.name,
    email: v.email,
    phone: v.phone || null,
    message: v.message || null,
    preferred_date: v.preferred_date || null,
    car_details: carDetails,
  });

  if (error) {
    console.error("submitLead:", error.message);
    return { ok: false, error: "Não foi possível enviar. Tente novamente." };
  }

  await notifyNewLead({
    kind: v.kind,
    name: v.name,
    email: v.email,
    phone: v.phone || null,
    car_label: v.car_label || null,
    message: v.message || null,
  });

  return { ok: true };
}

// ---- Gestão (staff) -------------------------------------------------------
export async function setLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function saveLeadNotes(id: string, notes: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ notes: notes || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}
