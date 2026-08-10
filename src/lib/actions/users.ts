"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/admin-queries";
import { newUserSchema } from "@/lib/schemas";
import type { UserRole } from "@/lib/supabase/database.types";

export interface UserResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" ? profile : null;
}

/** Cria um novo utilizador (email confirmado) com o role indicado. Só admin. */
export async function createUser(input: unknown): Promise<UserResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Sem permissão. Apenas administradores." };
  }
  const parsed = newUserSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error:
        "Falta a chave SUPABASE_SERVICE_ROLE_KEY no servidor para criar utilizadores.",
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
    },
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  // O trigger cria o profile; garantimos o role e o nome.
  if (data.user) {
    await admin
      .from("profiles")
      .update({ role: parsed.data.role, full_name: parsed.data.full_name })
      .eq("id", data.user.id);
  }

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}

/** Muda o role de um utilizador. Só admin. */
export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<UserResult> {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id && role !== "admin") {
    return { ok: false, error: "Não pode remover o seu próprio acesso admin." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/utilizadores");
  return { ok: true };
}

/** Apaga um utilizador (Auth + profile em cascata). Só admin. */
export async function deleteUser(id: string): Promise<UserResult> {
  const me = await requireAdmin();
  if (!me) return { ok: false, error: "Sem permissão." };
  if (me.id === id) {
    return { ok: false, error: "Não pode apagar a sua própria conta." };
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
