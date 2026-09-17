"use server";

import { getAdminVehicleType } from "@/lib/vehicle-context";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/guard";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const logSchema = z.object({
  car_id: z.string().uuid(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  start_time: z.string().regex(HHMM, "Hora de início inválida"),
  end_time: z.string().regex(HHMM, "Hora de fim inválida").optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Minutos desde 00:00 de uma hora "HH:MM". */
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Cria um registo de horas para uma viatura. */
export async function createWorklog(formData: FormData): Promise<ActionResult> {
  const profile = await requireSection("oficina");
  const parsed = logSchema.safeParse({
    car_id: formData.get("car_id"),
    work_date: formData.get("work_date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time") ?? "",
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const v = parsed.data;

  // Horas = fim − início (se cruzar a meia-noite, soma 24h). Sem fim → 0.
  let hours = 0;
  if (v.end_time) {
    let diff = toMinutes(v.end_time) - toMinutes(v.start_time);
    if (diff < 0) diff += 24 * 60;
    hours = Math.round((diff / 60) * 100) / 100;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_tasks").insert({
    car_id: v.car_id,
    work_date: v.work_date,
    start_time: v.start_time,
    end_time: v.end_time || null,
    description: v.description || null,
    hours,
    created_by: profile.id,
  });
  if (error) {
    console.error("createWorklog:", error.message);
    return {
      ok: false,
      error:
        error.message.includes("vehicle_tasks") ||
        error.message.includes("does not exist") ||
        error.message.includes("column")
          ? "A tabela de registos ainda não está atualizada. Aplique a migração 0012 no Supabase."
          : `Não foi possível registar: ${error.message}`,
    };
  }
  revalidatePath(`/admin/oficina/${v.car_id}`);
  revalidatePath("/admin/oficina");
  return { ok: true };
}

/** Apaga um registo de horas. */
export async function deleteWorklog(id: string): Promise<ActionResult> {
  await requireSection("oficina");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_tasks")
    .delete()
    .eq("id", id)
    .select("car_id")
    .maybeSingle();
  if (error) return { ok: false, error: "Erro ao apagar." };
  if (data?.car_id) revalidatePath(`/admin/oficina/${data.car_id}`);
  return { ok: true };
}

/**
 * Custos lançados pela oficina (peças/material). Vão para a mesma tabela dos
 * custos, por isso aparecem logo em Custos e margens. O mecânico só pode as
 * categorias de material — nunca mão de obra (essa vem das horas).
 */
const workshopCostSchema = z.object({
  car_id: z.string().uuid(),
  category: z.enum(["parts", "other"]).default("parts"),
  description: z.string().trim().min(1, "Descreva o material").max(500),
  amount: z.coerce.number().positive("Indique um valor maior que zero").max(9999999),
  incurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

export async function addWorkshopCost(formData: FormData): Promise<ActionResult> {
  const profile = await requireSection("oficina");
  const parsed = workshopCostSchema.safeParse({
    car_id: formData.get("car_id"),
    category: formData.get("category") || "parts",
    description: formData.get("description"),
    amount: formData.get("amount"),
    incurred_on: formData.get("incurred_on"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vehicle_costs")
    .insert({ ...parsed.data, created_by: profile.id });
  if (error) {
    const hint = /row-level security|permission/i.test(error.message)
      ? "Sem permissão para registar custos. Aplique a migração 0017 no Supabase."
      : `Não foi possível registar: ${error.message}`;
    return { ok: false, error: hint };
  }
  revalidatePath(`/admin/oficina/${parsed.data.car_id}`);
  revalidatePath(`/admin/financeiro/${parsed.data.car_id}`);
  revalidatePath("/admin/financeiro");
  return { ok: true };
}

/** Apaga um custo lançado pela oficina (a RLS só deixa apagar os próprios). */
export async function deleteWorkshopCost(id: string): Promise<ActionResult> {
  await requireSection("oficina");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_costs")
    .delete()
    .eq("id", id)
    .select("car_id")
    .maybeSingle();
  if (error) return { ok: false, error: "Não foi possível apagar." };
  if (!data) return { ok: false, error: "Só pode apagar custos que você registou." };
  revalidatePath(`/admin/oficina/${data.car_id}`);
  revalidatePath("/admin/financeiro");
  return { ok: true };
}

const newVehicleSchema = z.object({
  name: z.string().trim().min(1, "Indique o nome/viatura").max(120),
  plate: z.string().trim().min(2, "Indique a matrícula").max(20),
});

/**
 * O mecânico cria uma viatura mínima (só nome + matrícula). Os restantes campos
 * obrigatórios recebem valores por defeito; fica em rascunho (não aparece no
 * site) até alguém completar a ficha.
 */
export async function createWorkshopVehicle(
  formData: FormData,
): Promise<ActionResult> {
  await requireSection("oficina");
  const parsed = newVehicleSchema.safeParse({
    name: formData.get("name"),
    plate: formData.get("plate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_workshop_intake_for_type", {
    selected_type: await getAdminVehicleType(),
    vehicle_name: parsed.data.name,
    plate: parsed.data.plate.toUpperCase().replace(/\s+/g, ""),
  });
  if (error || !data) return { ok: false, error: "Não foi possível criar a viatura." };
  revalidatePath("/admin/oficina");
  return { ok: true, id: data };
}
