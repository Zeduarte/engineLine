import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCarById } from "@/lib/admin-queries";
import { CarForm } from "@/components/admin/CarForm";
import { MediaManager, type MediaItem } from "@/components/admin/MediaManager";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { CarFormValues } from "@/lib/schemas";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditCarPage({ params }: { params: Params }) {
  const { id } = await params;
  const car = await getAdminCarById(id);
  if (!car) notFound();

  const defaults: Partial<CarFormValues> = {
    make: car.make,
    model: car.model,
    variant: car.variant ?? "",
    year: car.year,
    license_plate: car.license_plate ?? "",
    mileage: car.mileage,
    fuel: car.fuel,
    transmission: car.transmission,
    body: car.body,
    power: car.power,
    displacement: car.displacement,
    color: car.color ?? "",
    doors: car.doors,
    seats: car.seats,
    price: car.price ?? undefined,
    price_on_request: car.price_on_request,
    status: car.status,
    featured: car.featured,
    tagline: car.tagline ?? "",
    description: car.description ?? "",
    extras: car.extras ?? [],
    location: car.location ?? "",
    previous_price: car.previous_price ?? undefined,
    national: car.national,
    owners: car.owners ?? undefined,
    first_owner: car.first_owner,
    service_book: car.service_book,
    warranty_months: car.warranty_months ?? undefined,
    last_inspection: car.last_inspection ?? "",
    channels: car.channels ?? [],
  };

  const media: MediaItem[] = (car.car_media ?? []).map((m) => ({
    id: m.id,
    storage_path: m.storage_path,
    kind: m.kind,
    alt: m.alt,
    is_cover: m.is_cover,
    position: m.position,
  }));

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/admin/carros"
            className="text-sm text-paper/50 hover:text-paper"
          >
            ← Viaturas
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-paper">
              {car.make} {car.model}
            </h1>
            <StatusBadge status={car.status} />
          </div>
        </div>
        {car.status === "published" && (
          <Link
            href={`/viaturas/${car.slug}`}
            target="_blank"
            className="btn-ghost"
          >
            ↗ Ver no site
          </Link>
        )}
      </div>

      <div className="space-y-6">
        <MediaManager carId={car.id} initial={media} />
        <CarForm carId={car.id} defaults={defaults} />
      </div>
    </>
  );
}
