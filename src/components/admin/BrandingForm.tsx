"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MEDIA_BUCKET, publicMediaUrl } from "@/lib/storage";
import { saveSiteSettings } from "@/lib/actions/settings";

export function BrandingForm({
  initial,
}: {
  initial: { company_name: string; logo_url: string | null; tagline: string | null };
}) {
  const router = useRouter();
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(initial.company_name);
  const [tagline, setTagline] = useState(initial.tagline ?? "");
  const [logoPath, setLogoPath] = useState<string | null>(initial.logo_url);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const logoPreview = logoPath ? publicMediaUrl(logoPath) : null;

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O logótipo deve ter menos de 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const path = `branding/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (error) {
        toast.error("Falha ao carregar o logótipo.");
        return;
      }
      setLogoPath(path);
      toast.success("Logótipo carregado. Não esqueça de guardar.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function save() {
    if (!companyName.trim()) {
      toast.error("Indique o nome da empresa.");
      return;
    }
    setSaving(true);
    const res = await saveSiteSettings({
      company_name: companyName.trim(),
      tagline: tagline.trim(),
      logo_url: logoPath,
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Marca atualizada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível guardar.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">
          Identidade
        </h2>
        <div className="space-y-4">
          <div>
            <span className="field-label">Nome da empresa</span>
            <input
              className="field"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <span className="field-label">Slogan / descrição curta (opcional)</span>
            <input
              className="field"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Aparece no rodapé"
            />
          </div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">
          Logótipo
        </h2>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="grid h-20 w-40 place-items-center overflow-hidden rounded-xl border border-white/10 bg-ink">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logótipo"
                width={160}
                height={80}
                className="h-full w-full object-contain p-2"
              />
            ) : (
              <span className="text-xs text-paper/40">Sem logótipo</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              hidden
              onChange={(e) => handleLogo(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-ghost"
            >
              {uploading ? "A carregar…" : logoPreview ? "Trocar logótipo" : "Carregar logótipo"}
            </button>
            {logoPath && (
              <button
                type="button"
                onClick={() => setLogoPath(null)}
                className="rounded-full border border-red-500/40 px-4 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
              >
                Remover
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-paper/40">
          PNG, JPG, WebP ou SVG · fundo transparente recomendado · até 5MB. Sem
          logótipo, mostra-se o nome da empresa.
        </p>
      </section>

      <div className="sticky bottom-0 -mx-2 flex items-center justify-end gap-3 border-t border-white/10 bg-ink/90 px-2 py-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={saving || uploading}
          className="btn-primary"
        >
          {saving ? "A guardar…" : "Guardar marca"}
        </button>
      </div>
    </div>
  );
}
