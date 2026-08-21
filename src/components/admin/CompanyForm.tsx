"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCompany } from "@/lib/actions/settings";
import { DEFAULT_COMPANY } from "@/lib/branding";

// O mapa (Leaflet) depende de `window` — carrega só no cliente.
const AddressMapPicker = dynamic(
  () => import("@/components/admin/AddressMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-72 place-items-center rounded-xl border border-white/10 text-sm text-paper/40">
        A carregar mapa…
      </div>
    ),
  },
);

interface CompanyInitial {
  phone: string;
  email: string;
  whatsapp: string;
  messenger: string;
  address_street: string;
  address_city: string;
  address_postal: string;
  address_country: string;
  hours: string;
  geo_lat: number | null;
  geo_lng: number | null;
}

/**
 * Dados de contacto/empresa. Aparecem no rodapé, cabeçalho, página de
 * Contactos, botão de WhatsApp, ficha PDF e dados estruturados (SEO).
 */
export function CompanyForm({ initial }: { initial: CompanyInitial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    phone: initial.phone,
    email: initial.email,
    whatsapp: initial.whatsapp,
    messenger: initial.messenger,
    address_street: initial.address_street,
    address_city: initial.address_city,
    address_postal: initial.address_postal,
    address_country: initial.address_country,
    hours: initial.hours,
    geo_lat: initial.geo_lat?.toString() ?? "",
    geo_lng: initial.geo_lng?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Coordenadas seguras para o mapa (vazio → default; evita NaN enquanto se
  // escreve "-", "38.").
  const safeCoord = (raw: string, fallback: number) => {
    if (raw.trim() === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };
  const mapLat = safeCoord(form.geo_lat, DEFAULT_COMPANY.geo.lat);
  const mapLng = safeCoord(form.geo_lng, DEFAULT_COMPANY.geo.lng);

  async function save() {
    setSaving(true);
    const res = await saveCompany({
      ...form,
      geo_lat: form.geo_lat.trim() === "" ? null : form.geo_lat,
      geo_lng: form.geo_lng.trim() === "" ? null : form.geo_lng,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Dados de contacto atualizados.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível guardar.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">
          Contactos
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefone" hint="Ex.: +351 210 000 000">
            <input
              className="field"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+351 210 000 000"
            />
          </Field>
          <Field label="Email">
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="geral@empresa.pt"
            />
          </Field>
          <Field
            label="WhatsApp"
            hint="Só dígitos, com indicativo (351…). Sem espaços nem +."
          >
            <input
              className="field"
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="351910000000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Horário">
            <input
              className="field"
              value={form.hours}
              onChange={(e) => set("hours", e.target.value)}
              placeholder="Seg–Sáb · 09h00–19h00"
            />
          </Field>
          <Field
            label="Messenger (link m.me)"
            hint="Link da tua página no Messenger. Ex.: https://m.me/aminhapagina"
          >
            <input
              className="field"
              value={form.messenger}
              onChange={(e) => set("messenger", e.target.value)}
              placeholder="https://m.me/aminhapagina"
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">
          Morada
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Rua / número">
              <input
                className="field"
                value={form.address_street}
                onChange={(e) => set("address_street", e.target.value)}
                placeholder="Av. da Liberdade 100"
              />
            </Field>
          </div>
          <Field label="Código postal">
            <input
              className="field"
              value={form.address_postal}
              onChange={(e) => set("address_postal", e.target.value)}
              placeholder="1250-096"
            />
          </Field>
          <Field label="Localidade">
            <input
              className="field"
              value={form.address_city}
              onChange={(e) => set("address_city", e.target.value)}
              placeholder="Lisboa"
            />
          </Field>
          <Field label="País">
            <input
              className="field"
              value={form.address_country}
              onChange={(e) => set("address_country", e.target.value)}
              placeholder="Portugal"
            />
          </Field>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-paper/50">
          Localização no mapa
        </h2>
        <p className="mb-4 text-xs text-paper/40">
          Preenche a morada acima e clica em «Localizar morada no mapa» — o pin
          salta para lá. Podes sempre arrastar o pin (ou clicar no mapa) para
          afinar a posição exata do stand. É esta a localização mostrada na
          página de Contactos.
        </p>

        <AddressMapPicker
          lat={mapLat}
          lng={mapLng}
          address={[
            form.address_street,
            form.address_postal,
            form.address_city,
            form.address_country,
          ]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", ")}
          onChange={(lat, lng) => {
            set("geo_lat", String(lat));
            set("geo_lng", String(lng));
          }}
        />

        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-paper/40 hover:text-paper/70">
            Introduzir coordenadas manualmente
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <input
                className="field"
                value={form.geo_lat}
                onChange={(e) => set("geo_lat", e.target.value)}
                placeholder="38.7223"
                inputMode="decimal"
              />
            </Field>
            <Field label="Longitude">
              <input
                className="field"
                value={form.geo_lng}
                onChange={(e) => set("geo_lng", e.target.value)}
                placeholder="-9.1447"
                inputMode="decimal"
              />
            </Field>
          </div>
        </details>
      </section>

      <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-3 border-t border-white/10 bg-ink/90 px-2 py-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? "A guardar…" : "Guardar contactos"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-paper/40">{hint}</p>}
    </div>
  );
}
