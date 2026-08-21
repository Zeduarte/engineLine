import "server-only";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/admin-queries";
import { canAccess, type Section } from "@/lib/permissions";
import type { ProfileRow } from "@/lib/supabase/database.types";

/**
 * Protege uma página do backoffice por separador. Sem sessão → login; sem
 * acesso ao separador → volta ao Dashboard (sempre acessível). Devolve o perfil
 * para a página poder usar (ex.: role).
 */
export async function requireSection(section: Section): Promise<ProfileRow> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (!canAccess(profile.role, profile.allowed_sections, section)) {
    redirect("/admin");
  }
  return profile;
}
