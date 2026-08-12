import { NextResponse } from "next/server";
import { getChannelVehicles } from "@/lib/queries";
import { CHANNEL_IDS, CHANNELS } from "@/lib/schemas";
import { site } from "@/lib/site";
import type { Vehicle } from "@/types/vehicle";

export const runtime = "nodejs";
export const revalidate = 300; // feed atualiza a cada 5 min

type Params = Promise<{ platform: string }>;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url
  );
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function vehicleUrl(v: Vehicle): string {
  return `${siteUrl()}/viaturas/${v.slug}`;
}

function toXml(vehicles: Vehicle[], channelLabel: string): string {
  const items = vehicles
    .map((v) => {
      const title = `${v.make} ${v.model}${v.variant ? " " + v.variant : ""}`;
      const images = v.images
        .map((img) => `      <image>${esc(img.src)}</image>`)
        .join("\n");
      return `    <vehicle>
      <id>${esc(v.id ?? v.slug)}</id>
      <url>${esc(vehicleUrl(v))}</url>
      <make>${esc(v.make)}</make>
      <model>${esc(v.model)}</model>
      <version>${esc(v.variant ?? "")}</version>
      <title>${esc(title)}</title>
      <year>${v.year}</year>
      <price currency="EUR">${v.priceOnRequest ? "" : v.price}</price>
      <price_on_request>${v.priceOnRequest ? "true" : "false"}</price_on_request>
      <mileage unit="km">${v.mileage}</mileage>
      <fuel>${esc(v.fuel)}</fuel>
      <transmission>${esc(v.transmission)}</transmission>
      <body>${esc(v.body)}</body>
      <power unit="cv">${v.power}</power>
      <displacement unit="cc">${v.displacement}</displacement>
      <doors>${v.doors}</doors>
      <seats>${v.seats}</seats>
      <color>${esc(v.color ?? "")}</color>
      <description>${esc(v.description ?? "")}</description>
${images}
    </vehicle>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<listings generator="engineLine" channel="${esc(channelLabel)}" generated="${new Date().toISOString()}">
${items}
</listings>`;
}

function toCsv(vehicles: Vehicle[]): string {
  const header = [
    "id",
    "url",
    "make",
    "model",
    "version",
    "year",
    "price",
    "price_on_request",
    "mileage",
    "fuel",
    "transmission",
    "body",
    "power",
    "color",
    "image",
  ];
  const cell = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = vehicles.map((v) =>
    [
      v.id ?? v.slug,
      vehicleUrl(v),
      v.make,
      v.model,
      v.variant ?? "",
      v.year,
      v.priceOnRequest ? "" : v.price,
      v.priceOnRequest ? "sim" : "nao",
      v.mileage,
      v.fuel,
      v.transmission,
      v.body,
      v.power,
      v.color ?? "",
      v.images[0]?.src ?? "",
    ]
      .map(cell)
      .join(","),
  );
  return [header.map(cell).join(","), ...rows].join("\n");
}

/**
 * Feed público de exportação por plataforma.
 *
 *   /api/feeds/standvirtual        → XML
 *   /api/feeds/standvirtual.xml    → XML
 *   /api/feeds/standvirtual.csv    → CSV
 *   /api/feeds/olx?format=csv      → CSV
 *
 * Inclui apenas viaturas publicadas com esse canal selecionado no backoffice.
 * Estes feeds contêm apenas dados já públicos das viaturas — podem ser
 * importados pelos portais que suportam feeds/imports de inventário.
 */
export async function GET(
  request: Request,
  { params }: { params: Params },
) {
  const { platform: raw } = await params;
  const url = new URL(request.url);

  let platform = raw;
  let format: "xml" | "csv" = "xml";
  if (raw.endsWith(".csv")) {
    platform = raw.slice(0, -4);
    format = "csv";
  } else if (raw.endsWith(".xml")) {
    platform = raw.slice(0, -4);
  }
  if (url.searchParams.get("format") === "csv") format = "csv";

  if (!(CHANNEL_IDS as string[]).includes(platform)) {
    return NextResponse.json(
      { error: "Plataforma desconhecida", available: CHANNEL_IDS },
      { status: 404 },
    );
  }

  const label = CHANNELS.find((c) => c.id === platform)?.label ?? platform;
  const vehicles = await getChannelVehicles(platform);

  if (format === "csv") {
    return new NextResponse(toCsv(vehicles), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `inline; filename="${platform}.csv"`,
      },
    });
  }

  return new NextResponse(toXml(vehicles, label), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
