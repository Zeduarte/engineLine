"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/guard";
import { worklogHours } from "@/lib/operations";

export interface HoursResult {
  ok: boolean;
  error?: string;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const entrySchema = z.object({
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  start_time: z.string().regex(HHMM, "Hora de início inválida"),
  end_time: z.string().regex(HHMM, "Hora de fim inválida").optional().or(z.literal("")),
  description: z.string().trim().min(1, "Diga que tarefa fez").max(500, "Descrição demasiado longa"),
  overnight: z.boolean().default(false),
});

/** Regista horas de uma tarefa que não é numa viatura, em nome próprio. */
export async function createTimeEntry(formData: FormData): Promise<HoursResult> {
  await requireSection("horas");
  const parsed = entrySchema.safeParse({
    work_date: formData.get("work_date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time") ?? "",
    description: formData.get("description") ?? "",
    overnight: formData.get("overnight") === "on",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const v = parsed.data;

  // Só para validar e dar o erro em português; o total grava-o a BD.
  const duracao = worklogHours(v.start_time, v.end_time || "", v.overnight);
  if ("error" in duracao) return { ok: false, error: duracao.error };

  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    work_date: v.work_date,
    start_time: v.start_time,
    end_time: v.end_time || null,
    description: v.description,
  });
  if (error) {
    console.error("createTimeEntry:", error.message);
    return {
      ok: false,
      error: /time_entries|does not exist|schema cache/i.test(error.message)
        ? "Falta aplicar a migração 0029 no Supabase."
        : "Não foi possível registar as horas.",
    };
  }
  revalidatePath("/admin/horas");
  return { ok: true };
}

/** Apaga um registo (os próprios; o administrador, qualquer um — é o RLS). */
export async function deleteTimeEntry(id: string): Promise<HoursResult> {
  await requireSection("horas");
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Registo inválido." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("time_entries").delete().eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, error: "Não foi possível apagar o registo." };
  revalidatePath("/admin/horas");
  return { ok: true };
}
