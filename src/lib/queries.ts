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
import {
  DEFAULT_BRANDING,
  DEFAULT_COMPANY,
  telHref,
  type Branding,
} from "@/lib/branding";
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
    .in("status", ["published","reserved"])
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
    .in("status", ["published","reserved"])
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
    .in("status", ["published","reserved"])
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentVehicles:", error.message);
    return [];
  }
  return (data as unknown as CarWithMedia[]).map(toVehicle);
}

/**
 * Viaturas já vendidas (prova social). Ordenadas pela data de venda mais
 * recente. `limit` opcional — a homepage mostra as últimas 10, a página
 * `/vendidos` mostra todas.
 */
export async function getSoldVehicles(limit?: number): Promise<Vehicle[]> {
  let query = supabasePublic
    .from("cars")
    .select(CAR_SELECT)
    .eq("status", "sold")
    .order("sold_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error("getSoldVehicles:", error.message);
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
    .in("status", ["published", "reserved", "sold"])
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
      .select(
        "company_name, logo_url, tagline, accent, accent_soft, ga4_id, pixel_id, reservation_enabled, deposit_amount, phone, email, whatsapp, messenger, address_street, address_city, address_postal, address_country, hours, geo_lat, geo_lng",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_BRANDING;
    }

    const d = DEFAULT_COMPANY;
    const phone = data.phone || d.phone;
    return {
      companyName: data.company_name || DEFAULT_BRANDING.companyName,
      logoUrl: data.logo_url ? publicMediaUrl(data.logo_url) : null,
      tagline: data.tagline,
      accent: data.accent || DEFAULT_BRANDING.accent,
      accentSoft: data.accent_soft || DEFAULT_BRANDING.accentSoft,
      ga4Id: data.ga4_id || null,
      pixelId: data.pixel_id || null,
      reservationEnabled: data.reservation_enabled ?? false,
      depositAmount: data.deposit_amount ?? DEFAULT_BRANDING.depositAmount,
      company: {
        phone,
        phoneHref: telHref(phone),
        email: data.email || d.email,
        whatsapp: (data.whatsapp || d.whatsapp).replace(/\D/g, ""),
        messenger: data.messenger || d.messenger,
        address: {
          street: data.address_street || d.address.street,
          city: data.address_city || d.address.city,
          postalCode: data.address_postal || d.address.postalCode,
          country: data.address_country || d.address.country,
        },
        hours: data.hours || d.hours,
        geo: {
          lat: data.geo_lat ?? d.geo.lat,
          lng: data.geo_lng ?? d.geo.lng,
        },
      },
    };
  },
  ["site-branding"],
  { tags: ["branding"], revalidate: 300 },
);

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  body: string;
  role: string | null;
}

/** Testemunhos publicados (para a secção de confiança). */
export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await supabasePublic
    .from("testimonials")
    .select("id, name, rating, body, role")
    .eq("published", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTestimonials:", error.message);
    return [];
  }
  return data as Testimonial[];
}

/**
 * Viaturas publicadas marcadas para um determinado canal/portal externo.
 * Usado nos feeds de exportação (`/api/feeds/<canal>.xml`).
 */
export async function getChannelVehicles(channel: string): Promise<Vehicle[]> {
  const { data, error } = await supabasePublic
    .from("cars")
    .select(CAR_SELECT)
    .eq("status", "published")
    .contains("channels", [channel])
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("getChannelVehicles:", error.message);
    return [];
  }
  return (data as unknown as CarWithMedia[]).map(toVehicle);
}

export async function getAllSlugs(): Promise<string[]> {
  const supabase = supabasePublic;
  const { data, error } = await supabase
    .from("cars")
    .select("slug")
    .in("status", ["published","reserved"]);

  if (error) {
    console.error("getAllSlugs:", error.message);
    return [];
  }
  return data.map((r) => r.slug);
}
