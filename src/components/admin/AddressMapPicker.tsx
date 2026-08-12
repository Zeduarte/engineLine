"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

/**
 * Mapa interativo para escolher a localização da empresa.
 *  - Mostra um pin na posição atual (lat/lng).
 *  - "Localizar morada" geocodifica o texto da morada (Nominatim/OSM, sem chave
 *    de API) e move o pin para lá.
 *  - O pin é arrastável — largá-lo atualiza as coordenadas (ajuste fino).
 *
 * Carregado só no cliente (o Leaflet precisa de `window`); ver o `dynamic`
 * com `ssr: false` no CompanyForm.
 */

// Pin em SVG com a cor de acento — evita o problema clássico das imagens de
// marker do Leaflet partirem no bundler.
const pinIcon = L.divIcon({
  className: "",
  html: `<svg width="34" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="var(--accent, #E8B15A)" stroke="#0A0A0A" stroke-width="1.2"/>
    <circle cx="12" cy="10" r="2.6" fill="#0A0A0A"/>
  </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
});

export default function AddressMapPicker({
  lat,
  lng,
  address,
  onChange,
}: {
  lat: number;
  lng: number;
  address: string;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);

  // Inicializa o mapa uma única vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 15,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChangeRef.current(
        Number(p.lat.toFixed(6)),
        Number(p.lng.toFixed(6)),
      );
    });
    // Clicar no mapa também recoloca o pin.
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeRef.current(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6)),
      );
    });

    mapRef.current = map;
    markerRef.current = marker;
    // O contentor pode ter acabado de aparecer — recalcula o tamanho.
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando as coordenadas mudam de fora (ex.: após geocodificar), segue o pin.
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng]);
  }, [lat, lng]);

  async function locate() {
    const q = address.trim();
    if (!q) {
      toast.error("Preencha a morada primeiro.");
      return;
    }
    setLocating(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
        q,
      )}`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "pt" },
      });
      const results = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (!results.length) {
        toast.error("Morada não encontrada. Ajuste o pin manualmente.");
        return;
      }
      const found = results[0]!;
      onChange(
        Number(Number(found.lat).toFixed(6)),
        Number(Number(found.lon).toFixed(6)),
      );
      toast.success("Pin colocado na morada. Arraste para ajustar.");
    } catch {
      toast.error("Falha a localizar a morada.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="btn-ghost h-auto px-4 py-2 text-sm"
        >
          {locating ? "A localizar…" : "📍 Localizar morada no mapa"}
        </button>
        <p className="text-xs text-paper/40">
          Ou arraste o pin (ou clique no mapa) para ajustar.
        </p>
      </div>
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-xl border border-white/10"
        // O Leaflet precisa de uma altura explícita para renderizar os tiles.
      />
    </div>
  );
}
