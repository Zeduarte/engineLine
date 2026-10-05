"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCompany } from "@/lib/actions/settings";

interface CompanyInitial {
  whatsapp: string;
  messenger: string;
}

/**
 * Canais de conversa da empresa (WhatsApp e Messenger). Telefone, email,
 * morada, horário e mapa já não se editam aqui: vêm do ponto de venda
 * principal em Página inicial → Pontos de venda, para existirem num só sítio.
 */
export function CompanyForm({ initial }: { initial: CompanyInitial }) {
  const router = useRouter();
  const [form, setForm] = useState({ whatsapp: initial.whatsapp, messenger: initial.messenger });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await saveCompany(form);
    setSaving(false);
    if (res.ok) {
      toast.success("Canais de contacto atualizados.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível guardar.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-paper/70">
        <strong className="text-paper">Telefone, email, morada, horário e localização no mapa</strong> editam-se num só sítio:{" "}
        <Link href="/admin/pagina-inicial#pontos-de-venda" className="text-accent underline">
          Página inicial → Pontos de venda
        </Link>
        . O primeiro ponto de venda é o principal e é o que aparece no rodapé, na página de Contactos, na ficha das viaturas e
        nos anúncios do OLX.
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-paper/50">Conversas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp" hint="Só dígitos, com indicativo (351…). Sem espaços nem +.">
            <input
              className="field"
              value={form.whatsapp}
              onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
              placeholder="351910000000"
              inputMode="numeric"
            />
          </Field>
          <Field label="Messenger (link m.me)" hint="Link da página no Messenger. Ex.: https://m.me/aminhapagina">
            <input
              className="field"
              value={form.messenger}
              onChange={(e) => setForm((f) => ({ ...f, messenger: e.target.value }))}
              placeholder="https://m.me/aminhapagina"
            />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={save} disabled={saving} className="btn-primary">
            {saving ? "A guardar…" : "Guardar"}
          </button>
        </div>
      </section>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      {children}
      {hint && <p className="mt-1 text-xs text-paper/40">{hint}</p>}
    </div>
  );
}
