"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/admin-queries";
import { siteSettingsSchema } from "@/lib/schemas";

export interface SettingsResult {
  ok: boolean;
  error?: string;
}

async function requireAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin";
}

/** Guarda a marca do site (nome + logótipo). Apenas admin. */
export async function saveSiteSettings(input: unknown): Promise<SettingsResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Sem permissão. Apenas administradores." };
  }

  const parsed = siteSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      id: 1,
      company_name: parsed.data.company_name,
      tagline: parsed.data.tagline || null,
      logo_url: parsed.data.logo_url ?? null,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveSiteSettings:", error.message);
    return { ok: false, error: error.message };
  }

  // A marca aparece em todo o site → revalida tudo.
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
