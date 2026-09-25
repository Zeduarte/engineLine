"use server";

import { requireSection } from "@/lib/guard";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { newUserSchema } from "@/lib/schemas";
import {
  ALL_SECTIONS,
  ALWAYS,
  assignableRoles,
  canManage,
  effectiveSections,
  effectiveVehicleTypes,
  type Role,
  type Section,
} from "@/lib/permissions";
import { VEHICLE_TYPES, type VehicleType } from "@/lib/vehicle-categories";
import type { UserRole } from "@/lib/supabase/database.types";

export interface UserResult {
  ok: boolean;
  error?: string;
}

/** Papel atual de um utilizador e se é o dono da conta. */
async function targetOf(id: string): Promise<{ role: Role; isOwner: boolean } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, is_owner")
    .eq("id", id)
    .maybeSingle();
  return data ? { role: data.role as Role, isOwner: !!data.is_owner } : null;
}

/**
 * Pode `me` gerir este alvo? Devolve a razão da recusa, ou null. O dono nunca
 * é alvo de ninguém; outro admin só é gerível pelo dono.
 */
function refusal(
  me: { role: string; is_owner: boolean },
  target: { role: Role; isOwner: boolean },
  verbo = "gerir",
): string | null {
  if (target.isOwner) return "O dono da conta não pode ser alterado por outro utilizador.";
  if (canManage(me.role, target.role, me.is_owner)) return null;
  return target.role === "admin"
    ? `Só o dono da conta pode ${verbo} outros administradores.`
    : `Só pode ${verbo} utilizadores de nível inferior.`;
}

/**
 * Restringe as secções que um gestor pode conceder: só as que ele próprio tem,
 * e o Dashboard fica sempre incluído.
 */
function grantableSections(
  managerRole: string,
  managerAllowed: string[] | null | undefined,
  requested: string[] | undefined,
): Section[] {
  const mine = effectiveSections(managerRole, managerAllowed);
  const req = (requested ?? []).filter((s): s is Section =>
    (ALL_SECTIONS as string[]).includes(s),
  );
  const set = new Set<Section>(req.filter((s) => mine.includes(s)));
  set.add(ALWAYS);
  return [...set];
}

/**
 * Tipos de viatura que um gestor pode conceder: nunca mais do que os seus.
 * Devolve `null` quando fica com os dois (é o valor "sem restrição" na BD).
 */
function grantableVehicleTypes(
  managerRole: string,
  managerAllowed: string[] | null | undefined,
  requested: string[] | undefined,
  targetRole: string,
): string[] | null {
  // O admin acede sempre aos dois — guardar uma restrição seria ignorado.
  if (targetRole === "admin") return null;
  const mine = effectiveVehicleTypes(managerRole, managerAllowed);
  const req = (requested ?? []).filter((t): t is VehicleType =>
    (VEHICLE_TYPES as readonly string[]).includes(t),
  );
  const picked = req.filter((t) => mine.includes(t));
  // Nada escolhido (ou nada concedível) → herda o do gestor.
  const result = picked.length ? picked : mine;
  return result.length === VEHICLE_TYPES.length ? null : result;
}

/** Cria um novo utilizador. Só quem tiver rank acima do papel pedido. */
export async function createUser(input: unknown): Promise<UserResult> {
  const me = await requireSection("utilizadores");
  if (!me) return { ok: false, error: "Sem permissão." };

  const parsed = newUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!assignableRoles(me.role).includes(parsed.data.role)) {
    return { ok: false, error: "Sem permissão para atribuir esse papel." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta a chave SUPABASE_SERVICE_ROLE_KEY no servidor para criar utilizadores.",
    };
  }

  // Sem secções explícitas → null (usa os defaults do papel). Admin → null.
  const sections = parsed.data.role === "admin" ? null : grantableSections(
    me.role, me.allowed_sections,
    parsed.data.allowed_sections?.length ? parsed.data.allowed_sections : effectiveSections(parsed.data.role),
  );

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    },
  });
  if (error) return { ok: false, error: error.message };

  if (data.user) {
    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: data.user.id,
        email: parsed.data.email,
        role: parsed.data.role,
        full_name: parsed.data.full_name,
        allowed_sections: sections,
        allowed_vehicle_types: grantableVehicleTypes(
          me.role,
          me.allowed_vehicle_types,
          parsed.data.allowed_vehicle_types,
          parsed.data.role,
        ),
      });
    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { ok: false, error: "Não foi possível criar o perfil. Tente novamente." };
    }
  }

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}

/**
 * Atualiza o papel e/ou os separadores permitidos de um utilizador. Só quem
 * estiver estritamente acima na hierarquia o pode fazer, e só pode atribuir
 * papéis inferiores ao seu e conceder separadores a que ele próprio acede.
 */
export async function updateUserAccess(
  id: string,
  role: UserRole,
  sections: string[],
  vehicleTypes?: string[],
): Promise<UserResult> {
  const me = await requireSection("utilizadores");
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id) {
    return { ok: false, error: "Não pode alterar as suas próprias permissões." };
  }

  const target = await targetOf(id);
  if (!target) return { ok: false, error: "Utilizador não encontrado." };
  const recusa = refusal(me, target);
  if (recusa) return { ok: false, error: recusa };
  if (!assignableRoles(me.role).includes(role)) {
    return { ok: false, error: "Sem permissão para atribuir esse papel." };
  }

  const allowed =
    role === "admin"
      ? null
      : grantableSections(me.role, me.allowed_sections, sections);

  const admin = createAdminClient();
  if (!admin) return { ok: false, error: "Chave de administração não configurada." };
  const { error } = await admin
    .from("profiles")
    .update({
      role,
      allowed_sections: allowed,
      allowed_vehicle_types: grantableVehicleTypes(
        me.role,
        me.allowed_vehicle_types,
        vehicleTypes,
        role,
      ),
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}

/**
 * Redefine a password de um utilizador. Não é possível LER a password antiga
 * (o Supabase guarda só um hash) — define-se uma nova, para depois entregar.
 * Só quem estiver estritamente acima na hierarquia o pode fazer.
 */
export async function resetUserPassword(
  id: string,
  password: string,
): Promise<UserResult> {
  const me = await requireSection("utilizadores");
  if (!me) return { ok: false, error: "Sem permissão." };

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return { ok: false, error: "A password tem de ter entre 8 e 72 caracteres." };
  }

  // Sobre si próprio pode sempre; sobre outros só se estiver acima.
  if (me.id !== id) {
    const target = await targetOf(id);
    if (!target) return { ok: false, error: "Utilizador não encontrado." };
    const recusa = refusal(me, target);
    if (recusa) return { ok: false, error: recusa };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta a chave SUPABASE_SERVICE_ROLE_KEY no servidor para redefinir passwords.",
    };
  }

  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

/** Apaga um utilizador. Só quem estiver acima na hierarquia. */
export async function deleteUser(id: string): Promise<UserResult> {
  const me = await requireSection("utilizadores");
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id) {
    return { ok: false, error: "Não pode apagar a sua própria conta." };
  }

  const target = await targetOf(id);
  if (!target) return { ok: false, error: "Utilizador não encontrado." };
  const recusa = refusal(me, target, "apagar");
  if (recusa) return { ok: false, error: recusa };

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "Falta a chave SUPABASE_SERVICE_ROLE_KEY no servidor.",
    };
  }
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}
