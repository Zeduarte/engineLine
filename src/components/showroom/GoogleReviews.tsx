"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { ShowroomContent } from "@/lib/showroom";
import { googlePlaceSchema, type GooglePlace } from "@/lib/google-reviews";
export function GoogleReviews({
  config,
}: {
  config: ShowroomContent["google"];
}) {
  const [place, setPlace] = useState<GooglePlace | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "loaded" | "unavailable"
  >("idle");
  if (!config.enabled) return null;
  const profile =
    config.mapsUrl ||
    (config.placeId
      ? `https://www.google.com/maps/search/?api=1&query=Stand&query_place_id=${encodeURIComponent(config.placeId)}`
      : "");
  async function load() {
    setStatus("loading");
    try {
      const r = await fetch("/api/google-reviews", { cache: "no-store" });
      const data = await r.json();
      const parsed = googlePlaceSchema.safeParse(data.place);
      if (data.available && parsed.success) {
        setPlace(parsed.data);
        setStatus("loaded");
      } else setStatus("unavailable");
    } catch {
      setStatus("unavailable");
    }
  }
  return (
    <section className="my-12 rounded-2xl border border-white/10 bg-ink-soft p-6">
      <h2 className="text-2xl font-semibold">Avaliações no Google</h2>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {place?.rating != null && (
          <p className="text-2xl text-accent">
            {place.rating.toLocaleString("pt-PT")}/5{" "}
            <span className="text-sm text-paper/60">
              ({place.userRatingCount ?? 0} avaliações)
            </span>
          </p>
        )}
        {profile && (
          <a
            className="btn-ghost"
            href={place?.googleMapsUri || profile}
            target="_blank"
            rel="noopener noreferrer"
          >
            Consultar no Google Maps ↗
          </a>
        )}
        {config.placeId && (status === "idle" || status === "loading") && (
          <button
            type="button"
            disabled={status === "loading"}
            onClick={load}
            className="btn-primary"
          >
            {status === "loading" ? "A carregar…" : "Mostrar avaliações"}
          </button>
        )}
      </div>
      <p role="status" className="mt-3 text-sm text-paper/60">
        {status === "unavailable"
          ? "Não foi possível carregar as avaliações. Pode consultá-las no perfil Google."
          : status === "loaded"
            ? "Avaliações selecionadas e ordenadas por relevância pelo Google; apresentadas no idioma original."
            : ""}
      </p>
      {place?.reviews && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {place.reviews.map((r, i) => (
            <article
              className="rounded-xl border border-white/10 p-4"
              key={r.name || i}
            >
              <div className="flex items-center gap-3">
                {r.authorAttribution.photoUri && (
                  <img
                    src={r.authorAttribution.photoUri}
                    alt={`Fotografia de ${r.authorAttribution.displayName}`}
                    width={40}
                    height={40}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="rounded-full"
                  />
                )}
                <a
                  href={r.authorAttribution.uri || r.googleMapsUri || profile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  {r.authorAttribution.displayName}
                </a>
              </div>
              <p
                className="mt-3 text-accent"
                aria-label={`${r.rating} de 5 estrelas`}
              >
                {"★".repeat(Math.round(r.rating))}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-paper/75">
                {r.originalText?.text || r.text?.text}
              </p>
              <p className="mt-3 text-xs text-paper/50">
                {r.relativePublishTimeDescription}
              </p>
              {r.googleMapsUri && (
                <a
                  className="mt-3 inline-block text-sm text-accent"
                  href={r.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver avaliação original ↗
                </a>
              )}
            </article>
          ))}
        </div>
      )}
      {place && (
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
          {" "}
          <span
            translate="no"
            className="whitespace-nowrap font-normal not-italic tracking-normal text-white"
          >
            Google Maps
          </span>
          {place.attributions?.map((a, i) => (
            <a
              key={i}
              href={a.providerUri}
              target="_blank"
              rel="noopener noreferrer"
            >
              {a.provider}
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
