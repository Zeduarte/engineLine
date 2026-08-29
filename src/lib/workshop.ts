import "server-only";
import { createClient } from "@/lib/supabase/server";
import { coverImage } from "@/lib/mappers";
import { publicMediaUrl } from "@/lib/storage";
import type { CarWithMedia, VehicleTaskRow } from "@/lib/supabase/database.types";

/** Viatura como o mecânico a vê: identificação + capa + horas registadas. */
export interface WorkshopVehicle {
  id: string;
  make: string;
  model: string;
  plate: string | null;
  status: string;
  cover: { src: string; alt: string };
  totalHours: number;
  logCount: number;
}

/**
 * Lista todas as viaturas (qualquer estado) para a oficina, com o total de
 * horas registadas. Só identificação + capa — o mecânico não edita a ficha.
 */
export async function getWorkshopVehicles(): Promise<WorkshopVehicle[]> {
  const supabase = await createClient();
  const [{ data: cars }, { data: logs }] = await Promise.all([
    supabase
      .from("cars")
      .select("*, car_media(*)")
      .order("updated_at", { ascending: false }),
    supabase.from("vehicle_tasks").select("car_id, hours"),
  ]);

  const logRows = (logs ?? []) as { car_id: string; hours: number }[];
  const hoursByCar = new Map<string, number>();
  const countByCar = new Map<string, number>();
  for (const l of logRows) {
    hoursByCar.set(l.car_id, (hoursByCar.get(l.car_id) ?? 0) + Number(l.hours || 0));
    countByCar.set(l.car_id, (countByCar.get(l.car_id) ?? 0) + 1);
  }

  return ((cars ?? []) as unknown as CarWithMedia[]).map((c) => ({
    id: c.id,
    make: c.make,
    model: c.model,
    plate: c.license_plate,
    status: c.status,
    cover: coverImage(c),
    totalHours: Math.round((hoursByCar.get(c.id) ?? 0) * 100) / 100,
    logCount: countByCar.get(c.id) ?? 0,
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
  logs: VehicleTaskRow[];
  /** Hora de fim do registo mais recente (HH:MM) — default do próximo início. */
  lastEnd: string | null;
}

/** Detalhe de uma viatura para a oficina: fotos (só ver) + registos de horas. */
export async function getWorkshopVehicle(
  id: string,
): Promise<WorkshopVehicleDetail | null> {
  const supabase = await createClient();
  const [{ data: car }, { data: logRows }] = await Promise.all([
    supabase.from("cars").select("*, car_media(*)").eq("id", id).maybeSingle(),
    supabase
      .from("vehicle_tasks")
      .select("*")
      .eq("car_id", id)
      .order("work_date", { ascending: false })
      .order("start_time", { ascending: false }),
  ]);
  if (!car) return null;
  const c = car as unknown as CarWithMedia;
  const logs = (logRows ?? []) as VehicleTaskRow[];

  // O registo mais recente (lista já ordenada) dá o "último fim" para prefill.
  const lastWithEnd = logs.find((l) => l.end_time);
  const lastEnd = lastWithEnd?.end_time ? lastWithEnd.end_time.slice(0, 5) : null;

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
    logs,
    lastEnd,
  };
}
