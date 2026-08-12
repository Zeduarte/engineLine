import type { Metadata } from "next";
import { getVehicles } from "@/lib/queries";
import { InventoryClient } from "@/components/inventory/InventoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stock",
  description:
    "Explore o stock completo de viaturas premium do engineLine. Filtre por marca, modelo, preço, ano, combustível e quilómetros.",
};

export default async function InventoryPage() {
  const vehicles = await getVehicles();

  return (
    <div className="container-px pb-24 pt-32 md:pt-40">
      <header className="mb-12 max-w-2xl">
        <p className="eyebrow mb-4">Stock</p>
        <h1 className="text-headline font-semibold text-paper">
          Todas as viaturas disponíveis
        </h1>
        <p className="mt-4 text-lg font-light text-paper/60">
          {vehicles.length} viaturas selecionadas, prontas para entrega. Use os
          filtros para encontrar a sua.
        </p>
      </header>

      <InventoryClient vehicles={vehicles} />
    </div>
  );
}
