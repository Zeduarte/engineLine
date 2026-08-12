import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getVehicleBySlug, getBranding } from "@/lib/queries";
import { formatKm, formatNumber, priceLabel } from "@/lib/format";
import { qrDataUrl } from "@/lib/qr";
import { site } from "@/lib/site";
import { PrintButton } from "@/components/vehicle/PrintButton";

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  return {
    title: v ? `Ficha — ${v.make} ${v.model}` : "Ficha",
    robots: { index: false, follow: false },
  };
}

export default async function FichaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [vehicle, branding] = await Promise.all([
    getVehicleBySlug(slug),
    getBranding(),
  ]);
  if (!vehicle) notFound();

  const url = `${site.url}/viaturas/${vehicle.slug}`;
  const qr = await qrDataUrl(url);

  const specs: [string, string][] = [
    ["Preço", priceLabel(vehicle.price, vehicle.priceOnRequest)],
    ["Ano", String(vehicle.year)],
    ["Quilómetros", formatKm(vehicle.mileage)],
    ["Combustível", vehicle.fuel],
    ["Caixa", vehicle.transmission],
    ["Carroçaria", vehicle.body],
    ["Potência", vehicle.power ? `${vehicle.power} cv` : "—"],
    [
      "Cilindrada",
      vehicle.displacement ? `${formatNumber(vehicle.displacement)} cm³` : "—",
    ],
    ["Cor", vehicle.color || "—"],
    ["Portas", String(vehicle.doors)],
    ["Lugares", String(vehicle.seats)],
    ["Nº de donos", vehicle.owners != null ? String(vehicle.owners) : "—"],
    ["Livro de revisões", vehicle.serviceBook ? "Sim" : "—"],
    [
      "Garantia",
      vehicle.warrantyMonths ? `${vehicle.warrantyMonths} meses` : "—",
    ],
    ["Última inspeção", vehicle.lastInspection || "—"],
    ["Nacional", vehicle.national ? "Sim" : "—"],
  ];

  return (
    <div className="ficha mx-auto max-w-3xl px-6 pb-24 pt-28 text-paper">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .ficha { padding-top: 0 !important; color: #000 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={`/viaturas/${vehicle.slug}`} className="text-sm text-paper/60 hover:text-paper">
          ← Voltar à viatura
        </Link>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-white/10 bg-ink-soft p-6 md:p-10 print:border-none print:bg-white">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-accent">
              {branding.companyName}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {vehicle.make} {vehicle.model}
            </h1>
            {vehicle.variant && (
              <p className="text-paper/60 print:text-black/60">{vehicle.variant}</p>
            )}
            <p className="mt-2 text-2xl font-bold text-accent">
              {priceLabel(vehicle.price, vehicle.priceOnRequest)}
            </p>
          </div>
          {qr && (
            <div className="text-center">
              <Image
                src={qr}
                alt="QR code da viatura"
                width={120}
                height={120}
                unoptimized
                className="rounded-lg"
              />
              <p className="mt-1 text-[10px] text-paper/40 print:text-black/50">
                Ver online
              </p>
            </div>
          )}
        </div>

        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-xl bg-ink-muted">
          <Image
            src={vehicle.images[0]!.src}
            alt={vehicle.images[0]!.alt}
            fill
            sizes="(max-width:768px) 100vw, 720px"
            className="object-cover"
          />
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
          {specs.map(([k, v]) => (
            <div key={k} className="border-b border-white/5 pb-2 print:border-black/10">
              <dt className="text-[11px] uppercase tracking-wider text-paper/40 print:text-black/50">
                {k}
              </dt>
              <dd className="text-sm font-medium">{v}</dd>
            </div>
          ))}
        </dl>

        {vehicle.extras && vehicle.extras.length > 0 && (
          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-wider text-paper/40 print:text-black/50">
              Extras
            </p>
            <p className="mt-2 text-sm text-paper/80 print:text-black/80">
              {vehicle.extras.join(" · ")}
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-paper/50 print:border-black/10 print:text-black/60">
          {branding.companyName} · {branding.company.phone} · {branding.company.email} ·{" "}
          {branding.company.address.street}, {branding.company.address.city}
        </div>
      </div>
    </div>
  );
}
