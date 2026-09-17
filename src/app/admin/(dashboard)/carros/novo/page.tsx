import { getVehicleSelection } from "@/lib/vehicle-context";
import { getShowroomContent } from "@/lib/showroom-queries";
import Link from "next/link";
import { CarForm } from "@/components/admin/CarForm";

export const dynamic = "force-dynamic";

export default async function NewCarPage() {
  const vehicleType = await getVehicleSelection("admin");
  const showroom = await getShowroomContent();
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/carros"
          className="text-sm text-paper/50 hover:text-paper"
        >
          ← Viaturas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-paper">Nova viatura</h1>
        <p className="mt-1 text-sm text-paper/50">
          Escolha primeiro se pretende anunciar um carro ou uma mota. Depois de
          criar o anúncio, poderá adicionar fotografias e vídeo.
        </p>
      </div>
      <CarForm locations={showroom.locations} defaults={vehicleType ? {vehicle_type:vehicleType,body:vehicleType === "motorcycle" ? "Naked" : "Berlina",doors:vehicleType === "motorcycle" ? 0 : 5,seats:vehicleType === "motorcycle" ? 2 : 5} : undefined} />
    </>
  );
}
