import type { Vehicle } from "@/types/vehicle";
import { priceLabel } from "@/lib/format";
import { isCampaign } from "@/lib/vehicle-categories";
export function VehiclePrice({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="inline-flex flex-col items-end gap-1">
      {isCampaign(vehicle) && (
        <del
          className="text-sm font-normal text-paper/50"
          aria-label="Preço anterior"
        >
          {priceLabel(vehicle.previousPrice!, false)}
        </del>
      )}
      <span>{priceLabel(vehicle.price, vehicle.priceOnRequest)}</span>
    </span>
  );
}
