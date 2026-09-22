import "server-only";
import { createClient } from "@/lib/supabase/server";
import { canDecideLeaveFor } from "@/lib/permissions";
import {
  DEFAULT_BALANCE,
  type CompanyDay,
  type LeaveBalance,
  type LeaveDay,
} from "@/lib/leave";

/**
 * Leituras das férias. A RLS é que decide o que cada um vê: o próprio saldo,
 * os dias de toda a gente (para o mapa de equipa) e os dias especiais.
 */

export interface Colleague {
  id: string;
  name: string;
}

/** Dias especiais definidos pelo stand. Os nacionais são calculados. */
export async function getCompanyDays(year: number): Promise<CompanyDay[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("company_days")
    .select("day,kind,label")
    .gte("day", `${year}-01-01`)
    .lte("day", `${year}-12-31`)
    .order("day");
  if (error) {
    console.error("getCompanyDays:", error.message);
    return [];
  }
  return (data ?? []) as CompanyDay[];
}

/** Saldo do ano. Sem linha gravada, valem os valores por defeito. */
export async function getBalance(
  profileId: string,
  year: number,
): Promise<LeaveBalance> {
  const db = await createClient();
  const { data } = await db
    .from("leave_balances")
    .select("base_days,carried_days,birthday_day")
    .eq("profile_id", profileId)
    .eq("year", year)
    .maybeSingle();
  if (!data) return { ...DEFAULT_BALANCE };
  return {
    baseDays: Number(data.base_days),
    carriedDays: Number(data.carried_days),
    birthdayDay: Number(data.birthday_day),
  };
}

/** Dias marcados de um utilizador nesse ano. */
export async function getLeaveDays(
  profileId: string,
  year: number,
): Promise<LeaveDay[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("leave_days")
    .select("day,half,status")
    .eq("profile_id", profileId)
    .gte("day", `${year}-01-01`)
    .lte("day", `${year}-12-31`)
    .order("day");
  if (error) {
    console.error("getLeaveDays:", error.message);
    return [];
  }
  return (data ?? []) as LeaveDay[];
}

export interface TeamLeaveDay extends LeaveDay {
  profileId: string;
}

/**
 * Dias de toda a equipa num intervalo. Só o essencial para o mapa: quem,
 * quando e em que estado — nunca notas nem saldos.
 */
export async function getTeamLeave(
  from: string,
  to: string,
): Promise<TeamLeaveDay[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("leave_days")
    .select("profile_id,day,half,status")
    .gte("day", from)
    .lte("day", to)
    .in("status", ["pending", "approved"])
    .order("day");
  if (error) {
    console.error("getTeamLeave:", error.message);
    return [];
  }
  return (data ?? []).map((d) => ({
    profileId: d.profile_id as string,
    day: d.day as string,
    half: d.half as boolean,
    status: d.status as LeaveDay["status"],
  }));
}

/** Nome e id dos colegas, para as linhas do mapa de equipa. */
export async function getColleagues(): Promise<Colleague[]> {
  const db = await createClient();
  const { data, error } = await db.rpc("leave_directory");
  if (error) {
    console.error("getColleagues:", error.message);
    return [];
  }
  return (data ?? []).map((p: { id: string; full_name: string }) => ({
    id: p.id,
    name: p.full_name,
  }));
}

export interface PendingRequest {
  profileId: string;
  name: string;
  days: LeaveDay[];
}

/**
 * Pedidos por decidir, agrupados por colaborador.
 *
 * Só aparecem os de quem está abaixo de quem consulta — mostrar um pedido
 * que depois o servidor recusa decidir seria enganador.
 */
export async function getPendingRequests(
  approverRole: string,
): Promise<PendingRequest[]> {
  const db = await createClient();
  const [{ data, error }, colegas, { data: perfis }] = await Promise.all([
    db
      .from("leave_days")
      .select("profile_id,day,half,status")
      .eq("status", "pending")
      .order("day"),
    getColleagues(),
    db.from("profiles").select("id,role"),
  ]);
  if (error) {
    console.error("getPendingRequests:", error.message);
    return [];
  }
  const papeis = new Map((perfis ?? []).map((p) => [p.id as string, p.role as string]));
  const nomes = new Map(colegas.map((c) => [c.id, c.name]));
  const porPessoa = new Map<string, LeaveDay[]>();
  for (const d of data ?? []) {
    const id = d.profile_id as string;
    if (!canDecideLeaveFor(approverRole, papeis.get(id) ?? "")) continue;
    const lista = porPessoa.get(id) ?? [];
    lista.push({
      day: d.day as string,
      half: d.half as boolean,
      status: d.status as LeaveDay["status"],
    });
    porPessoa.set(id, lista);
  }
  return [...porPessoa.entries()].map(([profileId, days]) => ({
    profileId,
    name: nomes.get(profileId) ?? "Colaborador",
    days,
  }));
}
