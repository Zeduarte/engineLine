"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CHANNELS } from "@/lib/schemas";
import { saveListing } from "@/lib/actions/channels";
import type {
  ChannelListingRow,
  ChannelListingStatus,
} from "@/lib/supabase/database.types";

const STATUS_OPTIONS: { value: ChannelListingStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "published", label: "Publicado" },
  { value: "removed", label: "Removido" },
  { value: "error", label: "Erro" },
];

const STATUS_TONE: Record<ChannelListingStatus, string> = {
  pending: "bg-white/10 text-paper/70",
  published: "bg-emerald-500/20 text-emerald-300",
  removed: "bg-white/10 text-paper/40",
  error: "bg-red-500/20 text-red-300",
};

function feedBase() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/**
 * Gere o estado de publicação de UMA viatura em cada portal selecionado.
 * A publicação em si é por feed (o portal importa /api/feeds/<canal>.xml);
 * aqui o stand regista o estado real, o link do anúncio e a data.
 */
export function ChannelListings({
  carId,
  channels,
  listings,
}: {
  carId: string;
  channels: string[];
  listings: ChannelListingRow[];
}) {
  const byChannel = new Map(listings.map((l) => [l.channel, l]));
  const selected = CHANNELS.filter((c) => channels.includes(c.id));

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Publicação nos portais
        </h2>
        <p className="mt-1 text-xs text-paper/50">
          A publicação é feita por feed (o portal importa o inventário). Aqui
          registas o estado real em cada portal e o link do anúncio.
        </p>
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-paper/60">
          Nenhum portal selecionado. Escolhe os portais em{" "}
          <strong className="text-paper/80">
            &quot;Publicar noutras plataformas&quot;
          </strong>{" "}
          no formulário e guarda a viatura — depois aparecem aqui para gerires o
          estado.
        </p>
      ) : (
        <div className="space-y-4">
          {selected.map((c) => (
            <ChannelRow
              key={c.id}
              carId={carId}
              channelId={c.id}
              channelLabel={c.label}
              listing={byChannel.get(c.id) ?? null}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ChannelRow({
  carId,
  channelId,
  channelLabel,
  listing,
}: {
  carId: string;
  channelId: string;
  channelLabel: string;
  listing: ChannelListingRow | null;
}) {
  const [status, setStatus] = useState<ChannelListingStatus>(
    listing?.status ?? "pending",
  );
  const [url, setUrl] = useState(listing?.external_url ?? "");
  const [pending, startTransition] = useTransition();

  const feedUrl = `${feedBase()}/api/feeds/${channelId}.xml`;
  const publishedAt = listing?.published_at
    ? new Date(listing.published_at).toLocaleDateString("pt-PT")
    : null;

  function save() {
    startTransition(async () => {
      const res = await saveListing({
        car_id: carId,
        channel: channelId,
        status,
        external_url: url,
      });
      if (res.ok) toast.success(`${channelLabel}: estado guardado.`);
      else toast.error(res.error ?? "Não foi possível guardar.");
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-paper">{channelLabel}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}
          >
            {STATUS_OPTIONS.find((s) => s.value === status)?.label}
          </span>
        </div>
        {publishedAt && (
          <span className="text-xs text-paper/40">
            desde {publishedAt}
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <label className="block">
          <span className="field-label">Estado</span>
          <select
            className="field"
            value={status}
            onChange={(e) => setStatus(e.target.value as ChannelListingStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Link do anúncio (opcional)</span>
          <input
            className="field"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`https://…/${channelId}/…`}
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn-primary h-auto whitespace-nowrap px-5 py-2.5"
        >
          {pending ? "A guardar…" : "Guardar"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-paper/45">
        <span>Feed deste portal:</span>
        <a
          href={feedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {feedUrl}
        </a>
        {listing?.external_url && (
          <a
            href={listing.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-paper/70 hover:text-paper"
          >
            ↗ Ver anúncio
          </a>
        )}
      </div>
    </div>
  );
}
