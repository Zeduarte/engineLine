"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { carFormSchema } from "@/lib/schemas";
import { vehicleSlug } from "@/lib/slug";
import { MEDIA_BUCKET } from "@/lib/storage";
import type { CarInsert, CarStatus } from "@/lib/supabase/database.types";

export interface SaveResult {
  ok: boolean;
  id?: string;
  slug?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/** Revalida as páginas públicas afetadas por uma alteração de inventário. */
function revalidatePublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/inventario");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/viaturas/${slug}`);
  revalidatePath("/admin/carros");
  revalidatePath("/admin");
}

/** Garante um slug único (base, base-2, base-3, …), ignorando `exceptId`. */
async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string,
  exceptId?: string,
): Promise<string> {
  let candidate = base || "viatura";
  let n = 1;
  for (;;) {
    const query = supabase.from("cars").select("id").eq("slug", candidate);
    const { data } = exceptId
      ? await query.neq("id", exceptId).maybeSingle()
      : await query.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

function toRow(values: ReturnType<typeof carFormSchema.parse>): Omit<
  CarInsert,
  "slug"
> {
  return {
    make: values.make,
    model: values.model,
    variant: values.variant || null,
    year: values.year,
    license_plate: values.license_plate || null,
    mileage: values.mileage,
    fuel: values.fuel,
    transmission: values.transmission,
    body: values.body,
    power: values.power,
    displacement: values.displacement,
    color: values.color || null,
    doors: values.doors,
    seats: values.seats,
    price: values.price_on_request ? null : (values.price ?? null),
    price_on_request: values.price_on_request,
    status: values.status,
    featured: values.featured,
    tagline: values.tagline || null,
    description: values.description || null,
    extras: values.extras,
    location: values.location || null,
    previous_price: values.previous_price ?? null,
    national: values.national,
    owners: values.owners ?? null,
    first_owner: values.first_owner,
    service_book: values.service_book,
    warranty_months: values.warranty_months ?? null,
    last_inspection: values.last_inspection || null,
  };
}

export async function createCar(input: unknown): Promise<SaveResult> {
  const parsed = carFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos.", fieldErrors: flatten(parsed) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const base = vehicleSlug(
    parsed.data.make,
    `${parsed.data.model}${parsed.data.variant ? " " + parsed.data.variant : ""}`,
    parsed.data.year,
  );
  const slug = await uniqueSlug(supabase, base);

  const { data, error } = await supabase
    .from("cars")
    .insert({ ...toRow(parsed.data), slug, created_by: user?.id ?? null })
    .select("id, slug")
    .single();

  if (error) {
    console.error("createCar:", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePublic(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function updateCar(
  id: string,
  input: unknown,
): Promise<SaveResult> {
  const parsed = carFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos.", fieldErrors: flatten(parsed) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .update(toRow(parsed.data))
    .eq("id", id)
    .select("id, slug")
    .single();

  if (error) {
    console.error("updateCar:", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePublic(data.slug);
  return { ok: true, id: data.id, slug: data.slug };
}

export async function setCarStatus(
  id: string,
  status: CarStatus,
): Promise<SaveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .update({ status })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePublic(data.slug);
  return { ok: true };
}

export async function toggleFeatured(
  id: string,
  featured: boolean,
): Promise<SaveResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .update({ featured })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePublic(data.slug);
  return { ok: true };
}

/** Duplica um carro como rascunho (sem media, sem destaque). */
export async function duplicateCar(id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { data: src, error: readErr } = await supabase
    .from("cars")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !src) return { ok: false, error: "Viatura não encontrada." };

  const base = vehicleSlug(src.make, `${src.model} copia`, src.year);
  const slug = await uniqueSlug(supabase, base);

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    id: _id,
    created_at: _c,
    updated_at: _u,
    published_at: _p,
    sold_at: _s,
    ...rest
  } = src;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  const { data, error } = await supabase
    .from("cars")
    .insert({
      ...rest,
      slug,
      status: "draft",
      featured: false,
      tagline: src.tagline ? `${src.tagline}` : null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true, id: data.id };
}

/** Apaga um carro e a sua media (BD + objetos no Storage). */
export async function deleteCar(id: string): Promise<SaveResult> {
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("car_media")
    .select("storage_path")
    .eq("car_id", id);

  const paths = (media ?? [])
    .map((m) => m.storage_path)
    .filter((p) => !/^https?:\/\//i.test(p));
  if (paths.length) {
    await supabase.storage.from(MEDIA_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("cars").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePublic();
  return { ok: true };
}

// ---- Ações em lote --------------------------------------------------------
export async function bulkSetStatus(
  ids: string[],
  status: CarStatus,
): Promise<SaveResult> {
  if (!ids.length) return { ok: true };
  const supabase = await createClient();
  const { error } = await supabase
    .from("cars")
    .update({ status })
    .in("id", ids);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function bulkDelete(ids: string[]): Promise<SaveResult> {
  if (!ids.length) return { ok: true };
  const supabase = await createClient();

  const { data: media } = await supabase
    .from("car_media")
    .select("storage_path")
    .in("car_id", ids);
  const paths = (media ?? [])
    .map((m) => m.storage_path)
    .filter((p) => !/^https?:\/\//i.test(p));
  if (paths.length) await supabase.storage.from(MEDIA_BUCKET).remove(paths);

  const { error } = await supabase.from("cars").delete().in("id", ids);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

function flatten(
  parsed: ReturnType<typeof carFormSchema.safeParse> & { success: false },
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
