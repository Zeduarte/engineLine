import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getBranding } from "@/lib/queries";
import { publicMediaUrl } from "@/lib/storage";
import { buildAdvert, type AdvertCar } from "@/lib/olx/advert";
import type { OlxAttributeDef } from "@/lib/olx/attributes";
import { categoryCandidates, unwrap, type OlxCategory } from "@/lib/olx/categories";
import { getConnection, olxFetch } from "@/lib/olx/client";
import { desiredAction } from "@/lib/olx/lifecycle";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Sincronização de uma viatura com o OLX.
 *
 * Executa o que `desiredAction` decide e grava o resultado em
 * `channel_listings`: o id e o URL do anúncio, o estado no OLX e, quando algo
 * falha, a razão em português. Nunca lança — quem chama (a gravação da viatura
 * ou a manutenção periódica) não pode falhar por causa do OLX.
 */

type Db = SupabaseClient<Database>;

const CHANNEL = "olx";
/** Depois disto deixa de tentar sozinho; fica o erro à vista no backoffice. */
export const MAX_ATTEMPTS = 8;

interface RemoteAdvert {
  id: number;
  status: string;
  url?: string;
}

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
}

/** Marca a viatura para sincronizar. Chamado sempre que a viatura é gravada. */
export async function markPending(db: Db, carId: string): Promise<void> {
  const { data: car } = await db.from("cars").select("channels").eq("id", carId).maybeSingle();
  const { data: listing } = await db
    .from("channel_listings")
    .select("id,external_id")
    .eq("car_id", carId)
    .eq("channel", CHANNEL)
    .maybeSingle();
  const quer = (car?.channels ?? []).includes(CHANNEL);
  // Sem OLX marcado e sem anúncio no OLX, não há nada a fazer.
  if (!quer && !listing?.external_id) return;
  if (listing) {
    await db
      .from("channel_listings")
      .update({ sync_state: "pending", attempts: 0 })
      .eq("id", listing.id);
  } else {
    await db.from("channel_listings").insert({
      car_id: carId,
      channel: CHANNEL,
      status: "pending",
      sync_state: "pending",
    });
  }
}

export interface SyncOutcome {
  ok: boolean;
  action: string;
  error?: string;
}

export async function syncListing(db: Db, carId: string): Promise<SyncOutcome> {
  const { data: listing } = await db
    .from("channel_listings")
    .select("*")
    .eq("car_id", carId)
    .eq("channel", CHANNEL)
    .maybeSingle();
  if (!listing) return { ok: true, action: "none" };

  const fail = async (action: string, error: string): Promise<SyncOutcome> => {
    await db
      .from("channel_listings")
      .update({
        sync_state: "error",
        last_error: error.slice(0, 1000),
        attempts: listing.attempts + 1,
        ...(action === "create" ? { status: "error" as const } : {}),
      })
      .eq("id", listing.id);
    return { ok: false, action, error };
  };

  try {
    const { data: car } = await db
      .from("cars")
      .select("*, car_media(storage_path, kind, position, is_cover)")
      .eq("id", carId)
      .maybeSingle();
    if (!car) {
      // A viatura foi apagada: o anúncio no OLX não pode ficar órfão.
      if (listing.external_id) {
        await olxFetch(db, `/adverts/${listing.external_id}/commands`, {
          method: "POST",
          body: { command: "deactivate", is_success: false },
        });
      }
      await db.from("channel_listings").delete().eq("id", listing.id);
      return { ok: true, action: "deactivate" };
    }

    const action = desiredAction({
      status: car.status,
      channels: car.channels ?? [],
      externalId: listing.external_id,
      remoteStatus: listing.remote_status,
    });

    if (action === "none") {
      await db
        .from("channel_listings")
        .update({ sync_state: "idle", last_error: null, attempts: 0 })
        .eq("id", listing.id);
      return { ok: true, action };
    }

    if (action === "deactivate" || action === "deactivate_sold") {
      const r = await olxFetch(db, `/adverts/${listing.external_id}/commands`, {
        method: "POST",
        body: { command: "deactivate", is_success: action === "deactivate_sold" },
      });
      if (!r.ok) return fail(action, r.error ?? "falha ao desativar");
      await db
        .from("channel_listings")
        .update({
          status: "removed",
          remote_status: "removed_by_user",
          sync_state: "idle",
          last_error: null,
          attempts: 0,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", listing.id);
      return { ok: true, action };
    }

    // create / update: é preciso montar o anúncio.
    const vehicleType = (car.vehicle_type ?? "car") as "car" | "motorcycle";
    const [{ data: category }, conn, branding] = await Promise.all([
      db.from("olx_category_cache").select("*").eq("vehicle_type", vehicleType).maybeSingle(),
      getConnection(db),
      getBranding(),
    ]);
    if (!conn) return fail(action, "A conta do OLX não está ligada (Integrações → Ligar conta OLX).");
    if (!category)
      return fail(action, "Falta carregar as categorias do OLX (Integrações → Carregar categorias).");

    // A relação cars→car_media não está nos tipos gerados; a forma é esta.
    type Media = { storage_path: string; kind: string; position: number; is_cover: boolean };
    const media = [...(((car as unknown as { car_media?: Media[] }).car_media) ?? [])]
      .filter((m) => m.kind === "image")
      .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
      .map((m) => publicMediaUrl(m.storage_path));

    const advertCar: AdvertCar = {
      id: car.id,
      make: car.make,
      model: car.model,
      variant: car.variant,
      year: car.year ?? 0,
      registrationMonth: car.registration_month ?? null,
      mileage: car.mileage,
      fuel: car.fuel ?? "",
      transmission: car.transmission ?? "",
      body: car.body ?? "",
      power: car.power,
      displacement: car.displacement,
      color: car.color,
      doors: car.doors,
      seats: car.seats,
      price: car.price,
      priceOnRequest: car.price_on_request,
      description: car.description,
      tagline: car.tagline,
      extras: car.extras ?? [],
    };

    const built = buildAdvert(advertCar, {
      categoryId: Number(category.category_id),
      attributeDefs: (category.attributes ?? []) as unknown as OlxAttributeDef[],
      cityId: Number(conn.city_id ?? 0),
      latitude: branding.company.geo?.lat,
      longitude: branding.company.geo?.lng,
      contactName: branding.companyName,
      contactPhone: (branding.company.phone || "").replace(/[^\d+]/g, ""),
      images: media,
      photosLimit: category.photos_limit,
      siteUrl: siteBase() ? `${siteBase()}/viaturas/${car.slug}` : undefined,
    });
    if (!built.ok) return fail(action, `Não publicado: ${built.problems.join("; ")}.`);

    let remote: RemoteAdvert | null = null;
    let externalId = listing.external_id;

    if (action === "create") {
      // Idempotência: se uma tentativa anterior chegou a criar o anúncio mas
      // a resposta se perdeu, ele já existe com o nosso external_id.
      const found = await olxFetch<unknown>(db, `/adverts?external_id=${encodeURIComponent(car.id)}`);
      const existentes = found.ok ? unwrap<RemoteAdvert[]>(found.data) ?? [] : [];
      if (existentes.length) {
        externalId = String(existentes[0]!.id);
      } else {
        const r = await olxFetch<unknown>(db, "/adverts", { method: "POST", body: built.advert });
        if (!r.ok) return fail(action, r.error ?? "falha ao criar");
        remote = unwrap<RemoteAdvert>(r.data);
        externalId = String(remote.id);
      }
    }

    if (action !== "create" || !remote) {
      const r = await olxFetch<unknown>(db, `/adverts/${externalId}`, {
        method: "PUT",
        body: built.advert,
      });
      if (!r.ok) return fail(action, r.error ?? "falha ao atualizar");
      remote = unwrap<RemoteAdvert>(r.data) ?? remote;
    }

    if (action === "update_and_activate") {
      const r = await olxFetch(db, `/adverts/${externalId}/commands`, {
        method: "POST",
        body: { command: "activate" },
      });
      if (!r.ok) return fail(action, r.error ?? "falha ao reativar");
    }

    // O estado verdadeiro, depois de tudo (moderação, pacote pago, …).
    const final = await olxFetch<unknown>(db, `/adverts/${externalId}`);
    if (final.ok) remote = unwrap<RemoteAdvert>(final.data) ?? remote;

    const remoteStatus = remote?.status ?? null;
    await db
      .from("channel_listings")
      .update({
        external_id: externalId,
        external_url: remote?.url ?? listing.external_url,
        remote_status: remoteStatus,
        status: remoteStatus === "active" || remoteStatus === "new" ? "published" : "pending",
        published_at: listing.published_at ?? new Date().toISOString(),
        sync_state: "idle",
        // `limited` não é uma falha da sincronização, mas tem de se ver.
        last_error:
          remoteStatus === "limited"
            ? "O OLX pede um pacote pago para esta categoria. Ative-o na conta do OLX."
            : null,
        attempts: 0,
        last_synced_at: new Date().toISOString(),
      })
      .eq("id", listing.id);
    return { ok: true, action };
  } catch (error) {
    console.error("olx syncListing:", error);
    return fail("error", error instanceof Error ? error.message : "Falha inesperada.");
  }
}

/** Repete o que ficou pendente ou falhou. Chamado pelo /api/maintenance. */
export async function syncPending(db: Db, limit = 20): Promise<number> {
  const conn = await getConnection(db);
  if (!conn) return 0;
  const { data } = await db
    .from("channel_listings")
    .select("car_id")
    .eq("channel", CHANNEL)
    .in("sync_state", ["pending", "error"])
    .lt("attempts", MAX_ATTEMPTS)
    .limit(limit);
  for (const row of data ?? []) await syncListing(db, row.car_id);
  return data?.length ?? 0;
}

export interface CategoryLoadResult {
  ok: boolean;
  error?: string;
  /** Por tipo: a escolhida, ou as candidatas quando há dúvida. */
  chosen: Partial<Record<"car" | "motorcycle", OlxCategory>>;
  ambiguous: Partial<Record<"car" | "motorcycle", OlxCategory[]>>;
}

/** Guarda a categoria e os seus atributos. */
export async function storeCategory(
  db: Db,
  vehicleType: "car" | "motorcycle",
  category: OlxCategory,
): Promise<string | null> {
  const attrs = await olxFetch<unknown>(db, `/categories/${category.id}/attributes`);
  if (!attrs.ok) return attrs.error;
  const { error } = await db.from("olx_category_cache").upsert({
    vehicle_type: vehicleType,
    category_id: category.id,
    category_name: category.name,
    photos_limit: category.photos_limit ?? 0,
    attributes: (unwrap<unknown[]>(attrs.data) ?? []) as never,
    fetched_at: new Date().toISOString(),
  });
  return error ? error.message : null;
}

/**
 * Lê a árvore de categorias do OLX e escolhe as de carros e motas. Resolve
 * também a cidade do stand, obrigatória em cada anúncio.
 */
export async function loadCategories(db: Db): Promise<CategoryLoadResult> {
  const result: CategoryLoadResult = { ok: true, chosen: {}, ambiguous: {} };

  // A árvore percorre-se por níveis; três chegam para Veículos → Carros.
  const todas: OlxCategory[] = [];
  let nivel: (number | null)[] = [null];
  for (let profundidade = 0; profundidade < 3 && nivel.length; profundidade++) {
    const seguinte: number[] = [];
    for (const parent of nivel) {
      const r = await olxFetch<unknown>(db, parent === null ? "/categories" : `/categories?parent_id=${parent}`);
      if (!r.ok) return { ...result, ok: false, error: r.error ?? "falha ao ler categorias" };
      const lista = unwrap<OlxCategory[]>(r.data) ?? [];
      todas.push(...lista);
      // Só se desce nos ramos de veículos, para não varrer o OLX inteiro.
      for (const c of lista)
        if (!c.is_leaf && /carro|moto|veicul|automo/i.test(c.name.normalize("NFD").replace(/[̀-ͯ]/g, "")))
          seguinte.push(c.id);
    }
    nivel = seguinte;
  }

  for (const tipo of ["car", "motorcycle"] as const) {
    const cands = categoryCandidates(todas, tipo);
    if (cands.length === 1) {
      const erro = await storeCategory(db, tipo, cands[0]!);
      if (erro) return { ...result, ok: false, error: erro };
      result.chosen[tipo] = cands[0]!;
    } else if (cands.length > 1) {
      result.ambiguous[tipo] = cands;
    }
  }

  // Cidade do stand, a partir das coordenadas das Definições.
  const branding = await getBranding();
  const { lat, lng } = branding.company.geo ?? { lat: 0, lng: 0 };
  if (lat && lng) {
    const loc = await olxFetch<unknown>(db, `/locations?latitude=${lat}&longitude=${lng}`);
    const primeira = loc.ok
      ? (unwrap<{ city?: { id: number }; district?: { id: number } }[]>(loc.data) ?? [])[0]
      : undefined;
    if (primeira?.city?.id) {
      await db
        .from("olx_connection")
        .update({ city_id: primeira.city.id, district_id: primeira.district?.id ?? null })
        .eq("id", 1);
    }
  }
  return result;
}
