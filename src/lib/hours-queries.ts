import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mergeHours, type HoursEntry, type OtherHoursRow, type VehicleHoursRow } from "@/lib/hours";

export interface HoursData {
  entries: HoursEntry[];
  /** A tabela `time_entries` ainda não existe (migração 0029 por aplicar). */
  missingTable: boolean;
}

/**
 * Horas de um período. `personId` null = de toda a gente (o RLS só o deixa ao
 * administrador; os outros recebem só as suas de qualquer forma).
 *
 * As horas de viatura só chegam a quem tem a Oficina (é o RLS de
 * `vehicle_tasks`) — quem não a tem também não as regista.
 */
export async function getHours(from: string, to: string, personId: string | null): Promise<HoursData> {
  const supabase = await createClient();

  let vq = supabase
    .from("vehicle_tasks")
    .select("id, car_id, work_date, start_time, end_time, hours, description, created_by")
    .gte("work_date", from)
    .lte("work_date", to);
  let oq = supabase
    .from("time_entries")
    .select("id, profile_id, work_date, start_time, end_time, hours, description")
    .gte("work_date", from)
    .lte("work_date", to);
  if (personId) {
    vq = vq.eq("created_by", personId);
    oq = oq.eq("profile_id", personId);
  }

  const [{ data: vRows, error: vError }, { data: oRows, error: oError }] = await Promise.all([vq, oq]);
  if (vError) console.error("getHours vehicle_tasks:", vError.message);
  const missingTable = !!oError && /time_entries|does not exist|schema cache/i.test(oError.message);
  if (oError && !missingTable) console.error("getHours time_entries:", oError.message);

  const tasks = (vRows ?? []) as VehicleHoursRow[];
  // O nome da viatura vem numa segunda consulta: a tipagem não conhece a
  // relação vehicle_tasks → cars.
  const carIds = [...new Set(tasks.map((t) => t.car_id))];
  if (carIds.length) {
    const { data: cars } = await supabase.from("cars").select("id, make, model, license_plate").in("id", carIds);
    const byId = new Map((cars ?? []).map((c) => [c.id, c]));
    for (const t of tasks) t.car = byId.get(t.car_id) ?? null;
  }

  return { entries: mergeHours(tasks, (oRows ?? []) as OtherHoursRow[]), missingTable };
}
