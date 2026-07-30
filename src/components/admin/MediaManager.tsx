"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, publicMediaUrl } from "@/lib/storage";
import {
  deleteMedia,
  registerMedia,
  reorderMedia,
  setCover,
} from "@/lib/actions/media";

export interface MediaItem {
  id: string;
  storage_path: string;
  kind: "image" | "video";
  alt: string;
  is_cover: boolean;
  position: number;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm";
const MAX_MB = 50;

/** Lê dimensões de uma imagem no browser (evita CLS no site público). */
function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve({ width: 0, height: 0 });
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

export function MediaManager({
  carId,
  initial,
}: {
  carId: string;
  initial: MediaItem[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const registered: Parameters<typeof registerMedia>[1] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`${file.name}: excede ${MAX_MB}MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const path = `${carId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) {
          toast.error(`Falha ao carregar ${file.name}.`);
          continue;
        }
        const { width, height } = await imageSize(file);
        registered.push({
          storage_path: path,
          kind: file.type.startsWith("video/") ? "video" : "image",
          alt: "",
          width,
          height,
        });
      }

      if (registered.length) {
        const res = await registerMedia(carId, registered);
        if (res.ok) {
          toast.success(`${registered.length} ficheiro(s) adicionado(s).`);
          router.refresh();
          // Otimista: acrescenta ao estado local.
          setItems((prev) => [
            ...prev,
            ...registered.map((r, i) => ({
              id: `tmp-${Date.now()}-${i}`,
              storage_path: r.storage_path,
              kind: r.kind,
              alt: "",
              is_cover: prev.length === 0 && i === 0,
              position: prev.length + i,
            })),
          ]);
        } else {
          toast.error(res.error ?? "Erro ao registar media.");
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  // ---- Reordenação por drag ----
  function onCardDragStart(index: number) {
    dragIndex.current = index;
  }
  function onCardDrop(index: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === index) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved!);
    setItems(next);
    startTransition(async () => {
      const res = await reorderMedia(
        carId,
        next.map((m) => m.id).filter((id) => !id.startsWith("tmp-")),
      );
      if (!res.ok) toast.error("Não foi possível reordenar.");
      else router.refresh();
    });
  }

  function makeCover(id: string) {
    setItems((prev) => prev.map((m) => ({ ...m, is_cover: m.id === id })));
    startTransition(async () => {
      const res = await setCover(carId, id);
      if (res.ok) toast.success("Capa definida.");
      else toast.error("Erro ao definir capa.");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Apagar este ficheiro? Esta ação é irreversível.")) return;
    setItems((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      const res = await deleteMedia(carId, id);
      if (res.ok) toast.success("Ficheiro apagado.");
      else toast.error("Erro ao apagar.");
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Fotografias e vídeo
        </h2>
        <span className="text-xs text-paper/40">
          {items.length} ficheiro(s) · arraste para reordenar
        </span>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-accent bg-accent/10"
            : "border-white/15 hover:border-white/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="text-sm text-paper/70">
          {uploading ? (
            "A carregar…"
          ) : (
            <>
              <span className="font-medium text-paper">Clique</span> ou arraste
              fotos / vídeo aqui
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-paper/40">
          JPG, PNG, WebP, AVIF, MP4, WebM · até {MAX_MB}MB
        </p>
      </div>

      {/* Grelha */}
      {items.length > 0 && (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m, i) => (
            <li
              key={m.id}
              draggable
              onDragStart={() => onCardDragStart(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onCardDrop(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-ink-muted"
            >
              {m.kind === "video" ? (
                <video
                  src={publicMediaUrl(m.storage_path)}
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={publicMediaUrl(m.storage_path)}
                  alt={m.alt || "Media da viatura"}
                  fill
                  sizes="(max-width:640px) 50vw, 25vw"
                  className="object-cover"
                />
              )}

              {m.is_cover && (
                <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink">
                  Capa
                </span>
              )}
              {m.kind === "video" && (
                <span className="absolute left-2 bottom-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] text-paper">
                  ▶ Vídeo
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-ink/90 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                {m.kind === "image" && !m.is_cover && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => makeCover(m.id)}
                    className="rounded bg-white/15 px-2 py-1 text-[10px] font-medium text-paper hover:bg-white/25"
                  >
                    Definir capa
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => remove(m.id)}
                  className="ml-auto rounded bg-red-500/80 px-2 py-1 text-[10px] font-medium text-white hover:bg-red-500"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
