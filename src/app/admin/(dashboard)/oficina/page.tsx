import { requireSection } from "@/lib/guard";
import { getWorkshopVehicles } from "@/lib/workshop";
import { WorkshopList } from "@/components/admin/WorkshopList";

export const dynamic = "force-dynamic";

export default async function OficinaPage() {
  await requireSection("oficina");
  const vehicles = await getWorkshopVehicles();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Oficina</h1>
        <p className="mt-1 text-sm text-paper/50">
          Registe as tarefas de cada viatura. Escolha uma viatura ou adicione
          uma nova pela matrícula.
        </p>
      </div>
      <WorkshopList vehicles={vehicles} />
    </>
  );
}
