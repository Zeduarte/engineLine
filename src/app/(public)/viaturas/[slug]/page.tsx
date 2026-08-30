import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getVehicleBySlug,
  getAllSlugs,
  getBranding,
  getVehicles,
} from "@/lib/queries";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { formatKm, priceLabel } from "@/lib/format";
import { Gallery } from "@/components/vehicle/Gallery";
import { Specs } from "@/components/vehicle/Specs";
import { TransparencySection } from "@/components/vehicle/TransparencySection";
import { VehicleActions } from "@/components/vehicle/VehicleActions";
import { ViewTracker } from "@/components/vehicle/ViewTracker";
import { ShareButton } from "@/components/vehicle/ShareButton";
import { FavoriteButton } from "@/components/inventory/FavoriteButton";
import { RecentlyViewed } from "@/components/vehicle/RecentlyViewed";
import { SellCTA } from "@/components/home/SellCTA";
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
    // As imagens Open Graph vêm de `opengraph-image.tsx` (geradas por viatura).
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function VehiclePage({ params }: { params: Params }) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const branding = await getBranding();
  const canReserve =
    branding.reservationEnabled && vehicle.status === "published";

  // Viaturas relacionadas: prioriza a mesma marca, depois preenche com outras.
  const all = await getVehicles();
  const related = [
    ...all.filter((v) => v.slug !== vehicle.slug && v.make === vehicle.make),
    ...all.filter((v) => v.slug !== vehicle.slug && v.make !== vehicle.make),
  ].slice(0, 3);

  return (
    <>
      <VehicleJsonLd vehicle={vehicle} sellerName={branding.companyName} />
      <ViewTracker carId={vehicle.id} slug={vehicle.slug} />

      <article className="pt-24 md:pt-28">
        <div className="container-px">
          <Link
            href="/inventario"
            className="mb-8 inline-flex items-center gap-2 text-sm text-paper/60 transition-colors hover:text-paper"
          >
            <span aria-hidden>←</span> Voltar ao stock
          </Link>

          {/* Cabeçalho */}
          <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow mb-3">{vehicle.year} · {vehicle.body}</p>
              <p className="text-xl font-semibold uppercase tracking-wide text-paper/60">
                {vehicle.make}
              </p>
              <AnimatedText
                as="h1"
                className="mt-1 text-headline font-semibold text-paper"
              >
                {vehicle.model}
              </AnimatedText>
              {vehicle.variant && (
                <p className="mt-2 text-xl font-light text-paper/60">
                  {vehicle.variant}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <FavoriteButton slug={vehicle.slug} variant="inline" />
              <ShareButton
                title={`${vehicle.make} ${vehicle.model} ${vehicle.year}`}
                text={`${vehicle.make} ${vehicle.model} ${vehicle.year} · ${priceLabel(vehicle.price, vehicle.priceOnRequest)}`}
              />
              <Link
                href={`/viaturas/${vehicle.slug}/ficha`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-paper/80 transition-colors hover:border-accent hover:text-accent"
              >
                ⤓ Ficha PDF + QR
              </Link>
            </div>
          </header>

          {(vehicle.status === "reserved" || vehicle.status === "sold") && (
            <div
              className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
                vehicle.status === "sold"
                  ? "bg-red-500/15 text-red-300"
                  : "bg-amber-500/15 text-amber-300"
              }`}
            >
              {vehicle.status === "sold"
                ? "Esta viatura já foi vendida. Contacte-nos para viaturas semelhantes."
                : "Esta viatura está reservada. Fale connosco para entrar na lista de espera."}
            </div>
          )}

          {/* Duas colunas: media + info à esquerda; painel de preço/contacto
              fixo (sticky) à direita, que acompanha o scroll — como nos grandes
              stands. Em mobile, o painel fica a seguir à galeria. */}
          <div className="grid gap-8 lg:grid-cols-[1.55fr_1fr] lg:items-start lg:gap-12">
            {/* Coluna esquerda */}
            <div className="space-y-10 lg:space-y-16">
              <Gallery
                slug={vehicle.slug}
                images={vehicle.images}
                video={vehicle.video}
              />

              {/* Destaques rápidos */}
              <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
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

              <Specs vehicle={vehicle} />

              <TransparencySection vehicle={vehicle} />

              <section>
                <h2 className="text-2xl font-semibold text-paper">
                  Sobre esta viatura
                </h2>
                <p className="mt-4 max-w-2xl text-lg font-light leading-relaxed text-paper/70">
                  {vehicle.description}
                </p>
              </section>
            </div>

            {/* Coluna direita — sticky, acompanha o scroll */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Preço */}
              <div className="rounded-3xl border border-white/10 bg-ink-soft p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-paper/50">Preço de venda</p>
                  {vehicle.warrantyMonths ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-paper/70">
                      Garantia {vehicle.warrantyMonths} meses
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-4xl font-bold text-accent">
                  {priceLabel(vehicle.price, vehicle.priceOnRequest)}
                </p>
              </div>

              <VehicleActions
                vehicleName={`${vehicle.make} ${vehicle.model}`}
                vehicleId={vehicle.id}
                price={vehicle.priceOnRequest ? null : vehicle.price}
                canReserve={canReserve}
                depositAmount={branding.depositAmount}
              />
            </div>
          </div>

          {/* Viaturas relacionadas */}
          {related.length > 0 && (
            <section className="mt-24">
              <h2 className="mb-8 text-2xl font-semibold text-paper">
                Viaturas relacionadas
              </h2>
              <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((v) => (
                  <VehicleCard key={v.slug} vehicle={v} morph={false} />
                ))}
              </div>
            </section>
          )}

          {/* Vistas recentemente (histórico local do visitante) */}
          <RecentlyViewed vehicles={all} excludeSlug={vehicle.slug} />

          {/* Retoma / encomenda no fim da ficha */}
          <SellCTA />
        </div>

        <div className="mt-20">
          <ContactBar vehicle={vehicle} company={branding.company} />
        </div>
      </article>
    </>
  );
}
