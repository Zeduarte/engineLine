import "server-only";
import { createClient } from "@/lib/supabase/server";
import { coverImage } from "@/lib/mappers";
import { publicMediaUrl } from "@/lib/storage";
import type { CarWithMedia, VehicleTaskRow } from "@/lib/supabase/database.types";

/** Viatura como o mecânico a vê: identificação + capa + nº de tarefas. */
export interface WorkshopVehicle {
  id: string;
  make: string;
  model: string;
  plate: string | null;
  status: string;
  cover: { src: string; alt: string };
  openTasks: number;
  totalTasks: number;
}

/**
 * Lista todas as viaturas (qualquer estado) para a oficina, com a contagem de
 * tarefas. Só identificação + capa — o mecânico não edita a ficha comercial.
 */
export async function getWorkshopVehicles(): Promise<WorkshopVehicle[]> {
  const supabase = await createClient();
  const [{ data: cars }, { data: tasks }] = await Promise.all([
    supabase
      .from("cars")
      .select("*, car_media(*)")
      .order("updated_at", { ascending: false }),
    supabase.from("vehicle_tasks").select("car_id, done"),
  ]);

  const taskRows = (tasks ?? []) as { car_id: string; done: boolean }[];
  const open = new Map<string, number>();
  const total = new Map<string, number>();
  for (const t of taskRows) {
    total.set(t.car_id, (total.get(t.car_id) ?? 0) + 1);
    if (!t.done) open.set(t.car_id, (open.get(t.car_id) ?? 0) + 1);
  }

  return ((cars ?? []) as unknown as CarWithMedia[]).map((c) => ({
    id: c.id,
    make: c.make,
    model: c.model,
    plate: c.license_plate,
    status: c.status,
    cover: coverImage(c),
    openTasks: open.get(c.id) ?? 0,
    totalTasks: total.get(c.id) ?? 0,
  }));
}

export interface WorkshopVehicleDetail {
  id: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  plate: string | null;
  status: string;
  photos: { src: string; alt: string }[];
  tasks: VehicleTaskRow[];
}

/** Detalhe de uma viatura para a oficina: fotos (só ver) + tarefas. */
export async function getWorkshopVehicle(
  id: string,
): Promise<WorkshopVehicleDetail | null> {
  const supabase = await createClient();
  const [{ data: car }, { data: tasks }] = await Promise.all([
    supabase.from("cars").select("*, car_media(*)").eq("id", id).maybeSingle(),
    supabase
      .from("vehicle_tasks")
      .select("*")
      .eq("car_id", id)
      .order("done", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);
  if (!car) return null;
  const c = car as unknown as CarWithMedia;

  const photos = (c.car_media ?? [])
    .filter((m) => m.kind === "image")
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position)
    .map((m) => ({
      src: publicMediaUrl(m.storage_path),
      alt: m.alt || `${c.make} ${c.model}`,
    }));

  return {
    id: c.id,
    make: c.make,
    model: c.model,
    variant: c.variant,
    year: c.year,
    plate: c.license_plate,
    status: c.status,
    photos,
    tasks: (tasks ?? []) as VehicleTaskRow[],
  };
}
