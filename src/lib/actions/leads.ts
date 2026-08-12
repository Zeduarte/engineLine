"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { leadSchema } from "@/lib/schemas";
import type { LeadStatus } from "@/lib/supabase/database.types";

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
