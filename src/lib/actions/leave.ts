"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/admin-queries";
import { companyCalendar, isSelectable, summarise } from "@/lib/leave";
import { getBalance, getCompanyDays, getLeaveDays } from "@/lib/leave-queries";

/**
 * Marcação e aprovação de férias.
 *
 * O servidor volta a verificar tudo o que o calendário já impede no ecrã: um
 * cliente adulterado não deve conseguir marcar um feriado nem passar do saldo.
 */

export interface LeaveResult {
  ok: boolean;
  error?: string;
}

const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const toggleSchema = z.object({ day: dia, half: z.boolean() });

function canApprove(role: string): boolean {
  return role === "admin" || role === "chefe";
}

/**
 * Marca ou desmarca um dia. Clicar num dia livre marca-o; clicar num dia já
 * marcado alterna entre dia inteiro e meio dia e, no fim, desmarca — é o
 * gesto que o calendário oferece.
 */
export async function toggleLeaveDay(input: {
  day: string;
  half: boolean;
}): Promise<LeaveResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sessão expirada. Volte a entrar." };

  const parsed = toggleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dia inválido." };
  const { day, half } = parsed.data;
  const year = Number(day.slice(0, 4));

  const db = await createClient();
  const [extras, atuais, saldo] = await Promise.all([
    getCompanyDays(year),
    getLeaveDays(me.id, year),
    getBalance(me.id, year),
  ]);

  const existente = atuais.find((d) => d.day === day);
  if (existente && existente.status === "approved") {
    return {
      ok: false,
      error: "Este dia já foi aprovado. Peça a alteração ao responsável.",
    };
  }

  if (!isSelectable(day, companyCalendar(year, extras))) {
    return { ok: false, error: "Esse dia não é um dia de trabalho." };
  }

  // Sem saldo não se marca — mas desmarcar e reduzir para meio dia é sempre
  // permitido, senão quem passasse do limite ficava preso.
  const anterior = existente ? (existente.half ? 0.5 : 1) : 0;
  const novo = half ? 0.5 : 1;
  if (novo > anterior) {
    const { available } = summarise(saldo, atuais);
    if (available < novo - anterior) {
      return { ok: false, error: "Não tem saldo disponível para esse dia." };
    }
  }

  const { error } = await db.from("leave_days").upsert(
    {
      profile_id: me.id,
      day,
      half,
      status: existente?.status === "rejected" ? "draft" : (existente?.status ?? "draft"),
    },
    { onConflict: "profile_id,day" },
  );
  if (error) {
    console.error("toggleLeaveDay:", error.message);
    return { ok: false, error: "Não foi possível marcar o dia." };
  }

  revalidatePath("/admin/perfil", "layout");
  return { ok: true };
}

/** Desmarca um dia. */
export async function removeLeaveDay(day: string): Promise<LeaveResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sessão expirada. Volte a entrar." };
  if (!dia.safeParse(day).success) return { ok: false, error: "Dia inválido." };

  const db = await createClient();
  const { error } = await db
    .from("leave_days")
    .delete()
    .eq("profile_id", me.id)
    .eq("day", day)
    .in("status", ["draft", "pending", "rejected"]);
  if (error) {
    console.error("removeLeaveDay:", error.message);
    return { ok: false, error: "Não foi possível desmarcar o dia." };
  }
  revalidatePath("/admin/perfil", "layout");
  return { ok: true };
}

/** Submete os dias em rascunho para aprovação. */
export async function submitLeavePlan(year: number): Promise<LeaveResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sessão expirada. Volte a entrar." };

  const db = await createClient();
  const { data, error } = await db
    .from("leave_days")
    .update({ status: "pending" })
    .eq("profile_id", me.id)
    .eq("status", "draft")
    .gte("day", `${year}-01-01`)
    .lte("day", `${year}-12-31`)
    .select("day");
  if (error) {
    console.error("submitLeavePlan:", error.message);
    return { ok: false, error: "Não foi possível submeter o plano." };
  }
  if (!data?.length) {
    return { ok: false, error: "Não há dias novos para submeter." };
  }
  revalidatePath("/admin/perfil", "layout");
  return { ok: true };
}

/** Aprova ou recusa dias de um colaborador. Só chefes e administradores. */
export async function decideLeave(input: {
  profileId: string;
  days: string[];
  approve: boolean;
}): Promise<LeaveResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sessão expirada. Volte a entrar." };
  if (!canApprove(me.role)) {
    return { ok: false, error: "Sem permissão para decidir pedidos." };
  }

  const parsed = z
    .object({
      profileId: z.string().uuid(),
      days: z.array(dia).min(1).max(400),
      approve: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pedido inválido." };

  const db = await createClient();
  const { error } = await db
    .from("leave_days")
    .update({
      status: parsed.data.approve ? "approved" : "rejected",
      decided_by: me.id,
      decided_at: new Date().toISOString(),
    })
    .eq("profile_id", parsed.data.profileId)
    .eq("status", "pending")
    .in("day", parsed.data.days);
  if (error) {
    console.error("decideLeave:", error.message);
    return { ok: false, error: "Não foi possível registar a decisão." };
  }

  revalidatePath("/admin/perfil", "layout");
  return { ok: true };
}

/** Ajusta o saldo de um colaborador (dias transitados, aniversário). */
export async function saveBalance(data: FormData): Promise<LeaveResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sessão expirada. Volte a entrar." };
  if (!canApprove(me.role)) {
    return { ok: false, error: "Sem permissão para alterar saldos." };
  }

  const parsed = z
    .object({
      profile_id: z.string().uuid(),
      year: z.coerce.number().int().min(2000).max(2100),
      base_days: z.coerce.number().min(0).max(60),
      carried_days: z.coerce.number().min(0).max(60),
      birthday_day: z.coerce.number().min(0).max(1),
    })
    .safeParse({
      profile_id: data.get("profile_id"),
      year: data.get("year"),
      base_days: data.get("base_days"),
      carried_days: data.get("carried_days"),
      birthday_day: data.get("birthday_day") === "on" ? 1 : 0,
    });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = await createClient();
  const { error } = await db
    .from("leave_balances")
    .upsert(
      { ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "profile_id,year" },
    );
  if (error) {
    console.error("saveBalance:", error.message);
    return { ok: false, error: "Não foi possível guardar o saldo." };
  }
  revalidatePath("/admin/perfil", "layout");
  return { ok: true };
}
