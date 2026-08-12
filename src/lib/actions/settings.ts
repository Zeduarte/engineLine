"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/admin-queries";
import {
  siteSettingsSchema,
  marketingSchema,
  integrationsSchema,
} from "@/lib/schemas";

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
      accent: parsed.data.accent,
      accent_soft: parsed.data.accent_soft,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveSiteSettings:", error.message);
    return { ok: false, error: error.message };
  }

  // A marca aparece em todo o site → invalida a cache e revalida as páginas.
  revalidateTag("branding");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** Guarda definições de marketing/reservas (GA4, Pixel, sinal). Apenas admin. */
export async function saveMarketing(input: unknown): Promise<SettingsResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Sem permissão. Apenas administradores." };
  }

  const parsed = marketingSchema.safeParse(input);
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
      ga4_id: parsed.data.ga4_id || null,
      pixel_id: parsed.data.pixel_id || null,
      reservation_enabled: parsed.data.reservation_enabled,
      deposit_amount: parsed.data.deposit_amount,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveMarketing:", error.message);
    return { ok: false, error: error.message };
  }

  revalidateTag("branding");
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Guarda credenciais das plataformas de exportação e do pagamento. Apenas admin. */
export async function saveIntegrations(input: unknown): Promise<SettingsResult> {
  if (!(await requireAdmin())) {
    return { ok: false, error: "Sem permissão. Apenas administradores." };
  }

  const parsed = integrationsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("integration_secrets").upsert(
    { id: 1, data: parsed.data as Record<string, unknown> },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveIntegrations:", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/integracoes");
  return { ok: true };
}
