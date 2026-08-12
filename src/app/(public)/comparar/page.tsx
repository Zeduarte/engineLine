import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getVehicleBySlug } from "@/lib/queries";
import { formatKm, formatNumber, priceLabel } from "@/lib/format";
import type { Vehicle } from "@/types/vehicle";

export const metadata: Metadata = {
  title: "Comparar viaturas",
  robots: { index: false, follow: true },
};

export const revalidate = 60;

type Params = { searchParams: Promise<{ ids?: string }> };

const ROWS: { label: string; get: (v: Vehicle) => string }[] = [
  { label: "Preço", get: (v) => priceLabel(v.price, v.priceOnRequest) },
  { label: "Ano", get: (v) => String(v.year) },
  { label: "Quilómetros", get: (v) => formatKm(v.mileage) },
  { label: "Combustível", get: (v) => v.fuel },
  { label: "Caixa", get: (v) => v.transmission },
  { label: "Carroçaria", get: (v) => v.body },
  { label: "Potência", get: (v) => (v.power ? `${v.power} cv` : "—") },
  {
    label: "Cilindrada",
    get: (v) => (v.displacement ? `${formatNumber(v.displacement)} cm³` : "—"),
  },
  { label: "Cor", get: (v) => v.color || "—" },
  { label: "Portas", get: (v) => String(v.doors) },
  { label: "Lugares", get: (v) => String(v.seats) },
];

export default async function ComparePage({ searchParams }: Params) {
  const { ids } = await searchParams;
  const slugs = (ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const found = (await Promise.all(slugs.map((s) => getVehicleBySlug(s)))).filter(
    (v): v is Vehicle => Boolean(v),
  );

  return (
    <div className="container-px pb-24 pt-32 md:pt-40">
      <header className="mb-10">
        <p className="eyebrow mb-4">Comparador</p>
        <h1 className="text-headline font-semibold text-paper">
          Comparar viaturas
        </h1>
      </header>

      {found.length < 2 ? (
        <div className="rounded-2xl border border-white/10 bg-ink-soft p-12 text-center">
          <p className="text-paper/70">
            Escolha pelo menos <strong>2 viaturas</strong> para comparar.
          </p>
          <Link
            href="/inventario"
            className="mt-6 inline-block rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink"
          >
            Ir ao stock
          </Link>
          <p className="mt-4 text-sm text-paper/40">
            Nos cartões, toque em «⇄ Comparar».
          </p>
        </div>
      ) : (
        // Grelha responsiva: coluna de rótulos + uma coluna por viatura. Cabe
        // numa só página no telemóvel (só scroll vertical, sem arrastar para
        // o lado). As linhas (gap-px sobre fundo claro) fazem de separadores.
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div
            className="grid gap-px bg-white/10"
            style={{
              gridTemplateColumns: `minmax(4.5rem, 0.55fr) repeat(${found.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Cabeçalho: foto + nome de cada viatura */}
            <div className="bg-ink" />
            {found.map((v) => (
              <Link
                key={v.slug}
                href={`/viaturas/${v.slug}`}
                className="group bg-ink p-2 sm:p-3"
              >
                <div className="relative mb-2 aspect-[4/3] overflow-hidden rounded-lg bg-ink-muted sm:mb-3 sm:rounded-xl">
                  <Image
                    src={v.images[0]!.src}
                    alt={v.images[0]!.alt}
                    fill
                    sizes="(max-width:768px) 45vw, 300px"
                    className="object-cover"
                  />
                </div>
                <p className="text-sm font-semibold leading-tight text-paper group-hover:text-accent">
                  {v.make} {v.model}
                </p>
                {v.variant && (
                  <p className="text-xs font-normal text-paper/50">
                    {v.variant}
                  </p>
                )}
              </Link>
            ))}

            {/* Especificações */}
            {ROWS.map((row) => (
              <Fragment key={row.label}>
                <div className="flex items-center bg-ink p-2 text-[10px] font-semibold uppercase tracking-wider text-paper/40 sm:p-3 sm:text-xs">
                  {row.label}
                </div>
                {found.map((v) => (
                  <div
                    key={v.slug}
                    className="flex items-center bg-ink p-2 text-xs text-paper/80 sm:p-3 sm:text-sm"
                  >
                    {row.get(v)}
                  </div>
                ))}
              </Fragment>
            ))}

            {/* Extras */}
            <div className="bg-ink p-2 text-[10px] font-semibold uppercase tracking-wider text-paper/40 sm:p-3 sm:text-xs">
              Extras
            </div>
            {found.map((v) => (
              <div
                key={v.slug}
                className="bg-ink p-2 text-xs text-paper/70 sm:p-3 sm:text-sm"
              >
                {v.extras && v.extras.length ? (
                  <ul className="space-y-1">
                    {v.extras.slice(0, 8).map((e) => (
                      <li key={e}>· {e}</li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </div>
            ))}

            {/* Ação */}
            <div className="bg-ink" />
            {found.map((v) => (
              <div key={v.slug} className="bg-ink p-2 sm:p-3">
                <Link
                  href={`/viaturas/${v.slug}`}
                  className="inline-block rounded-full bg-accent px-3 py-2 text-xs font-semibold text-ink"
                >
                  Ver ficha
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
