import "server-only";
import { unstable_cache } from "next/cache";
import { supabasePublic } from "@/lib/supabase/public";
import { toVehicle } from "@/lib/mappers";
import type { CarWithMedia } from "@/lib/supabase/database.types";
import type { Vehicle } from "@/types/vehicle";
import {
  mergeHomeContent,
  type HomeContent,
} from "@/lib/home-content";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import { publicMediaUrl } from "@/lib/storage";

/**
 * Leituras PÚBLICAS do inventário (Supabase).
 *
 * Correm em Server Components com ISR (`revalidate`). O cliente usa a chave
 * anónima, por isso a RLS garante que apenas viaturas `published` são
 * devolvidas ao público — sem filtros manuais frágeis.
 */

const CAR_SELECT = "*, car_media(*)";

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = supabasePublic;
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("getVehicles:", error.message);
    return [];
  }
  return (data as unknown as CarWithMedia[]).map(toVehicle);
}

export async function getFeaturedVehicles(limit = 3): Promise<Vehicle[]> {
  const supabase = supabasePublic;
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedVehicles:", error.message);
    return [];
  }
  return (data as unknown as CarWithMedia[]).map(toVehicle);
}

/** Viaturas publicadas mais recentes (para o carrossel da homepage). */
export async function getRecentVehicles(limit = 12): Promise<Vehicle[]> {
  const { data, error } = await supabasePublic
    .from("cars")
    .select(CAR_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentVehicles:", error.message);
    return [];
  }
  return (data as unknown as CarWithMedia[]).map(toVehicle);
}

export async function getVehicleBySlug(
  slug: string,
): Promise<Vehicle | undefined> {
  const supabase = supabasePublic;
  const { data, error } = await supabase
    .from("cars")
    .select(CAR_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("getVehicleBySlug:", error.message);
    return undefined;
  }
  return data ? toVehicle(data as unknown as CarWithMedia) : undefined;
}

/**
 * Conteúdo da página inicial (textos editáveis). Funde o que está guardado em
 * `site_content` sobre os defaults — se nada foi editado, devolve o original.
 */
export async function getHomeContent(): Promise<HomeContent> {
  const { data, error } = await supabasePublic
    .from("site_content")
    .select("content")
    .eq("key", "home")
    .maybeSingle();

  if (error) {
    console.error("getHomeContent:", error.message);
    return mergeHomeContent(null);
  }
  return mergeHomeContent(
    (data?.content as Partial<HomeContent> | undefined) ?? null,
  );
}

/**
 * Marca do site (nome + logótipo). Como aparece em todas as páginas, é mantida
 * em cache (tag "branding") para não bater na BD a cada request — a ação de
 * gravar invalida essa cache. Cai nos defaults se ainda não definida (ou se a
 * tabela ainda não existir).
 */
export const getBranding = unstable_cache(
  async (): Promise<Branding> => {
    const { data, error } = await supabasePublic
      .from("site_settings")
      .select("company_name, logo_url, tagline")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_BRANDING;
    }
    return {
      companyName: data.company_name || DEFAULT_BRANDING.companyName,
      logoUrl: data.logo_url ? publicMediaUrl(data.logo_url) : null,
      tagline: data.tagline,
    };
  },
  ["site-branding"],
  { tags: ["branding"], revalidate: 300 },
);

export async function getAllSlugs(): Promise<string[]> {
  const supabase = supabasePublic;
  const { data, error } = await supabase
    .from("cars")
    .select("slug")
    .eq("status", "published");

  if (error) {
    console.error("getAllSlugs:", error.message);
    return [];
  }
  return data.map((r) => r.slug);
}
