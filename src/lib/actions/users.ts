"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/admin-queries";
import { newUserSchema } from "@/lib/schemas";
import {
  ALL_SECTIONS,
  ALWAYS,
  assignableRoles,
  canManage,
  effectiveSections,
  type Role,
  type Section,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/supabase/database.types";

export interface UserResult {
  ok: boolean;
  error?: string;
}

/** Papel atual de um utilizador. */
async function roleOf(id: string): Promise<Role | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  return (data?.role as Role) ?? null;
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

/** Cria um novo utilizador. Só quem tiver rank acima do papel pedido. */
export async function createUser(input: unknown): Promise<UserResult> {
  const me = await getCurrentProfile();
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
  const sections =
    parsed.data.role === "admin" ||
    !parsed.data.allowed_sections ||
    parsed.data.allowed_sections.length === 0
      ? null
      : grantableSections(me.role, me.allowed_sections, parsed.data.allowed_sections);

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
    await admin
      .from("profiles")
      .update({
        role: parsed.data.role,
        full_name: parsed.data.full_name,
        allowed_sections: sections,
      })
      .eq("id", data.user.id);
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
): Promise<UserResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id) {
    return { ok: false, error: "Não pode alterar as suas próprias permissões." };
  }

  const targetRole = await roleOf(id);
  if (!targetRole) return { ok: false, error: "Utilizador não encontrado." };
  if (!canManage(me.role, targetRole)) {
    return { ok: false, error: "Só pode gerir utilizadores de nível inferior." };
  }
  if (!assignableRoles(me.role).includes(role)) {
    return { ok: false, error: "Sem permissão para atribuir esse papel." };
  }

  const allowed =
    role === "admin"
      ? null
      : grantableSections(me.role, me.allowed_sections, sections);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role, allowed_sections: allowed })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}

/** Apaga um utilizador. Só quem estiver acima na hierarquia. */
export async function deleteUser(id: string): Promise<UserResult> {
  const me = await getCurrentProfile();
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id) {
    return { ok: false, error: "Não pode apagar a sua própria conta." };
  }

  const targetRole = await roleOf(id);
  if (!targetRole || !canManage(me.role, targetRole)) {
    return { ok: false, error: "Só pode apagar utilizadores de nível inferior." };
  }

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
