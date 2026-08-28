import { ImageResponse } from "next/og";
import { getVehicleBySlug, getBranding } from "@/lib/queries";
import { formatKm, priceLabel } from "@/lib/format";

export const alt = "Viatura";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Regenera junto com a página (ISR).
export const revalidate = 60;

/**
 * Imagem Open Graph gerada dinamicamente por viatura — o que aparece quando
 * alguém partilha o link no WhatsApp, Facebook, etc. Marca, modelo, ano, preço
 * e os KPIs principais sobre um fundo com a cor de acento da marca.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [vehicle, branding] = await Promise.all([
    getVehicleBySlug(slug),
    getBranding(),
  ]);

  const accent = branding.accent || "#E8B15A";

  if (!vehicle) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0A0A0A",
            color: "#F5F5F4",
            fontSize: 64,
          }}
        >
          {branding.companyName}
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(1200px 600px at 80% -10%, rgba(232,177,90,0.18), transparent), #0A0A0A",
          padding: "72px 80px",
          color: "#F5F5F4",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>
            {branding.companyName}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#0A0A0A",
              background: accent,
              padding: "8px 22px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {vehicle.year}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(245,245,244,0.6)", textTransform: "uppercase", letterSpacing: 2 }}>
            {vehicle.make}
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05, marginTop: 6 }}>
            {vehicle.model}
          </div>
          {vehicle.variant ? (
            <div style={{ display: "flex", fontSize: 34, color: "rgba(245,245,244,0.55)", marginTop: 10 }}>
              {vehicle.variant}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 40, fontSize: 30, color: "rgba(245,245,244,0.75)" }}>
            <div style={{ display: "flex" }}>{formatKm(vehicle.mileage)}</div>
            <div style={{ display: "flex" }}>{vehicle.fuel}</div>
            <div style={{ display: "flex" }}>{vehicle.transmission}</div>
          </div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: accent }}>
            {priceLabel(vehicle.price, vehicle.priceOnRequest)}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
