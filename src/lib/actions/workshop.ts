"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/guard";
import { slugify } from "@/lib/slug";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

const taskSchema = z.object({
  car_id: z.string().uuid(),
  title: z.string().trim().min(2, "Descreva a tarefa").max(200),
  hours: z.coerce.number().min(0, "Horas inválidas").max(9999).default(0),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Cria uma tarefa de oficina para uma viatura. */
export async function createTask(formData: FormData): Promise<ActionResult> {
  const profile = await requireSection("oficina");
  const parsed = taskSchema.safeParse({
    car_id: formData.get("car_id"),
    title: formData.get("title"),
    hours: formData.get("hours") || 0,
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("vehicle_tasks").insert({
    car_id: v.car_id,
    title: v.title,
    hours: v.hours,
    notes: v.notes || null,
    created_by: profile.id,
  });
  if (error) {
    console.error("createTask:", error.message);
    return {
      ok: false,
      error:
        error.message.includes("vehicle_tasks") ||
        error.message.includes("does not exist")
          ? "A tabela de tarefas ainda não existe. Aplique a migração 0012 no Supabase."
          : `Não foi possível criar a tarefa: ${error.message}`,
    };
  }
  revalidatePath(`/admin/oficina/${v.car_id}`);
  revalidatePath("/admin/oficina");
  return { ok: true };
}

/** Marca uma tarefa como concluída/por fazer. */
export async function setTaskDone(
  id: string,
  done: boolean,
): Promise<ActionResult> {
  await requireSection("oficina");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_tasks")
    .update({ done })
    .eq("id", id)
    .select("car_id")
    .maybeSingle();
  if (error) return { ok: false, error: "Erro ao atualizar." };
  if (data?.car_id) revalidatePath(`/admin/oficina/${data.car_id}`);
  return { ok: true };
}

/** Apaga uma tarefa. */
export async function deleteTask(id: string): Promise<ActionResult> {
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
  const profile = await requireSection("oficina");
  const parsed = newVehicleSchema.safeParse({
    name: formData.get("name"),
    plate: formData.get("plate"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { name, plate } = parsed.data;
  const plateNorm = plate.toUpperCase().replace(/\s+/g, "");

  const supabase = await createClient();

  // Slug único: base a partir do nome + matrícula; acrescenta sufixo se colidir.
  const base = slugify(`${name}-${plateNorm}`) || `viatura-${Date.now()}`;
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await supabase
      .from("cars")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!exists) break;
    slug = `${base}-${i + 2}`;
  }

  const { data, error } = await supabase
    .from("cars")
    .insert({
      slug,
      make: name,
      model: "—",
      year: new Date().getFullYear(),
      license_plate: plateNorm,
      fuel: "Gasolina",
      transmission: "Manual",
      body: "Berlina",
      status: "draft",
      created_by: profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("createWorkshopVehicle:", error?.message);
    return { ok: false, error: "Não foi possível criar a viatura." };
  }
  revalidatePath("/admin/oficina");
  return { ok: true, id: data.id };
}
