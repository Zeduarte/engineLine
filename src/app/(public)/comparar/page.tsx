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
            Ir ao inventário
          </Link>
          <p className="mt-4 text-sm text-paper/40">
            Nos cartões, passe o rato e clique em «⇄ Comparar».
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-40 p-3" />
                {found.map((v) => (
                  <th key={v.slug} className="p-3 align-top">
                    <Link href={`/viaturas/${v.slug}`} className="group block">
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-ink-muted">
                        <Image
                          src={v.images[0]!.src}
                          alt={v.images[0]!.alt}
                          fill
                          sizes="(max-width:768px) 50vw, 300px"
                          className="object-cover"
                        />
                      </div>
                      <p className="text-left font-semibold text-paper group-hover:text-accent">
                        {v.make} {v.model}
                      </p>
                      {v.variant && (
                        <p className="text-left text-xs font-normal text-paper/50">
                          {v.variant}
                        </p>
                      )}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => (
                <tr key={row.label} className={ri % 2 ? "bg-white/[0.02]" : ""}>
                  <td className="p-3 text-xs font-semibold uppercase tracking-wider text-paper/40">
                    {row.label}
                  </td>
                  {found.map((v) => (
                    <td
                      key={v.slug}
                      className="p-3 text-sm text-paper/80"
                    >
                      {row.get(v)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="p-3 text-xs font-semibold uppercase tracking-wider text-paper/40">
                  Extras
                </td>
                {found.map((v) => (
                  <td key={v.slug} className="p-3 text-sm text-paper/70">
                    {v.extras && v.extras.length ? (
                      <ul className="space-y-1">
                        {v.extras.slice(0, 8).map((e) => (
                          <li key={e}>· {e}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3" />
                {found.map((v) => (
                  <td key={v.slug} className="p-3">
                    <Link
                      href={`/viaturas/${v.slug}`}
                      className="inline-block rounded-full bg-accent px-4 py-2 text-xs font-semibold text-ink"
                    >
                      Ver ficha
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
