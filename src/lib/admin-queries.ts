import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CarWithMedia,
  CarRow,
  LeadRow,
  ProfileRow,
} from "@/lib/supabase/database.types";

/** Perfil (role) do utilizador autenticado. */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
}

/** Todos os carros (staff) com a sua media — para a listagem do backoffice. */
export async function getAdminCars(): Promise<CarWithMedia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_media(*)")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("getAdminCars:", error.message);
    return [];
  }
  return data as unknown as CarWithMedia[];
}

/** Um carro por id, com media ordenada. */
export async function getAdminCarById(
  id: string,
): Promise<CarWithMedia | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_media(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("getAdminCarById:", error.message);
    return null;
  }
  if (data && Array.isArray((data as unknown as CarWithMedia).car_media)) {
    (data as unknown as CarWithMedia).car_media.sort(
      (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
    );
  }
  return data as unknown as CarWithMedia | null;
}

export interface DashboardStats {
  total: number;
  published: number;
  draft: number;
  reserved: number;
  sold: number;
  inventoryValue: number;
  avgPrice: number;
  createdThisMonth: number;
  soldThisMonth: number;
  newLeads: number;
  byFuel: { name: string; value: number }[];
  byMake: { name: string; value: number }[];
  byPriceBand: { name: string; value: number }[];
  salesByMonth: { name: string; vendidos: number }[];
}

const PRICE_BANDS: [string, number, number][] = [
  ["< 20k", 0, 20000],
  ["20–40k", 20000, 40000],
  ["40–70k", 40000, 70000],
  ["70–100k", 70000, 100000],
  ["100k+", 100000, Infinity],
];

const MONTHS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

/** Agrega KPIs e séries para os gráficos da dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const [{ data: cars }, { count: leadCount }] = await Promise.all([
    supabase
      .from("cars")
      .select(
        "id, make, fuel, price, price_on_request, status, created_at, sold_at",
      ),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  const list = (cars ?? []) as Pick<
    CarRow,
    "make" | "fuel" | "price" | "price_on_request" | "status" | "created_at" | "sold_at"
  >[];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const available = list.filter(
    (c) => c.status === "published" || c.status === "reserved",
  );
  const priced = available.filter((c) => !c.price_on_request && c.price);
  const inventoryValue = priced.reduce((s, c) => s + (c.price ?? 0), 0);

  const count = (s: CarRow["status"]) =>
    list.filter((c) => c.status === s).length;

  const tally = (key: (c: (typeof list)[number]) => string) => {
    const m = new Map<string, number>();
    for (const c of list) m.set(key(c), (m.get(key(c)) ?? 0) + 1);
    return [...m.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  const byPriceBand = PRICE_BANDS.map(([name, min, max]) => ({
    name,
    value: priced.filter((c) => (c.price ?? 0) >= min && (c.price ?? 0) < max)
      .length,
  }));

  // Últimos 6 meses de vendas.
  const salesByMonth: { name: string; vendidos: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const vendidos = list.filter((c) => {
      if (!c.sold_at) return false;
      const t = new Date(c.sold_at);
      return t >= d && t < next;
    }).length;
    salesByMonth.push({ name: MONTHS_PT[d.getMonth()]!, vendidos });
  }

  return {
    total: list.length,
    published: count("published"),
    draft: count("draft"),
    reserved: count("reserved"),
    sold: count("sold"),
    inventoryValue,
    avgPrice: priced.length ? Math.round(inventoryValue / priced.length) : 0,
    createdThisMonth: list.filter((c) => new Date(c.created_at) >= monthStart)
      .length,
    soldThisMonth: list.filter(
      (c) => c.sold_at && new Date(c.sold_at) >= monthStart,
    ).length,
    newLeads: leadCount ?? 0,
    byFuel: tally((c) => c.fuel),
    byMake: tally((c) => c.make).slice(0, 6),
    byPriceBand,
    salesByMonth,
  };
}

/** Marca do site para edição no backoffice. */
export async function getSiteSettings(): Promise<{
  company_name: string;
  logo_url: string | null;
  tagline: string | null;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("company_name, logo_url, tagline")
    .eq("id", 1)
    .maybeSingle();
  return {
    company_name: data?.company_name ?? "engineLine",
    logo_url: data?.logo_url ?? null,
    tagline: data?.tagline ?? null,
  };
}

/** Todos os perfis (só admin, via RLS). */
export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("getProfiles:", error.message);
    return [];
  }
  return data as ProfileRow[];
}

/** Leads mais recentes para gestão. */
export async function getLeads(): Promise<LeadRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    console.error("getLeads:", error.message);
    return [];
  }
  return data as LeadRow[];
}
