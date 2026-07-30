import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getVehicleBySlug, getAllSlugs } from "@/lib/queries";
import { formatKm, priceLabel } from "@/lib/format";
import { Gallery } from "@/components/vehicle/Gallery";
import { Specs } from "@/components/vehicle/Specs";
import { FinanceSimulator } from "@/components/vehicle/FinanceSimulator";
import { TestDriveForm } from "@/components/vehicle/TestDriveForm";
import { ContactBar } from "@/components/vehicle/ContactBar";
import { VehicleJsonLd } from "@/components/seo/VehicleJsonLd";
import { AnimatedText } from "@/components/ui/AnimatedText";

// ISR: páginas conhecidas são pré-geradas; novas viaturas publicadas depois do
// build são renderizadas on-demand e cacheadas (dynamicParams = true, default).
export const revalidate = 60;

// Em Next 15, `params` é assíncrono.
type Params = Promise<{ slug: string }>;

/**
 * Gera uma página estática por viatura no build (SSG). Quando a fonte passar a
 * API, este método faz `fetch` da lista de slugs — o resto mantém-se.
 */
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

/** Metadata dinâmica por viatura (title, description, Open Graph com a capa). */
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return { title: "Viatura não encontrada" };

  const title = `${vehicle.make} ${vehicle.model} ${vehicle.year}`;
  const description = `${vehicle.tagline} ${priceLabel(vehicle.price, vehicle.priceOnRequest)} · ${formatKm(vehicle.mileage)} · ${vehicle.fuel}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: vehicle.images[0]!.src, alt: vehicle.images[0]!.alt }],
    },
  };
}

export default async function VehiclePage({ params }: { params: Params }) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  return (
    <>
      <VehicleJsonLd vehicle={vehicle} />

      <article className="pt-24 md:pt-28">
        <div className="container-px">
          <Link
            href="/inventario"
            className="mb-8 inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-paper"
          >
            <span aria-hidden>←</span> Voltar ao inventário
          </Link>

          {/* Cabeçalho */}
          <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">{vehicle.year} · {vehicle.body}</p>
              <AnimatedText
                as="h1"
                className="text-headline font-semibold text-paper"
              >
                {`${vehicle.make} ${vehicle.model}`}
              </AnimatedText>
              {vehicle.variant && (
                <p className="mt-2 text-xl font-light text-paper/60">
                  {vehicle.variant}
                </p>
              )}
            </div>
            <p className="text-4xl font-bold text-accent">
              {priceLabel(vehicle.price, vehicle.priceOnRequest)}
            </p>
          </header>

          <Gallery slug={vehicle.slug} images={vehicle.images} />

          {/* Destaques rápidos */}
          <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-5">
            {vehicle.highlights.map((h) => (
              <li key={h.label} className="bg-ink p-5">
                <p className="text-xs uppercase tracking-wider text-paper/40">
                  {h.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-paper">
                  {h.value}
                </p>
              </li>
            ))}
          </ul>

          {/* Corpo em duas colunas */}
          <div className="mt-16 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div className="space-y-16">
              <section>
                <h2 className="text-2xl font-semibold text-paper">
                  Sobre esta viatura
                </h2>
                <p className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-paper/70">
                  {vehicle.description}
                </p>
              </section>

              <Specs vehicle={vehicle} />
            </div>

            <div className="space-y-8 lg:sticky lg:top-28 lg:self-start">
              <FinanceSimulator price={vehicle.price} />
              <TestDriveForm
                vehicleName={`${vehicle.make} ${vehicle.model}`}
                vehicleId={vehicle.id}
              />
            </div>
          </div>
        </div>

        <div className="mt-20">
          <ContactBar vehicle={vehicle} />
        </div>
      </article>
    </>
  );
}
