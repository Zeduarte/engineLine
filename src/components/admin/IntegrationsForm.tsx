"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveIntegrations } from "@/lib/actions/settings";
import { CHANNELS } from "@/lib/schemas";

type Cred = { username?: string; token?: string; enabled?: boolean };
export type IntegrationsInitial = Record<string, unknown> & {
  stripe_secret?: string;
  feed_token?: string;
  lead_webhook?: string;
};

export function IntegrationsForm({
  initial,
}: {
  initial: IntegrationsInitial;
}) {
  const [pending, startTransition] = useTransition();

  const [creds, setCreds] = useState<Record<string, Cred>>(() => {
    const out: Record<string, Cred> = {};
    for (const c of CHANNELS) {
      const v = (initial[c.id] as Cred) ?? {};
      out[c.id] = {
        username: v.username ?? "",
        token: v.token ?? "",
        enabled: v.enabled ?? false,
      };
    }
    return out;
  });
  const [stripe, setStripe] = useState(initial.stripe_secret ?? "");
  const [leadWebhook, setLeadWebhook] = useState(initial.lead_webhook ?? "");

  function update(id: string, patch: Partial<Cred>) {
    setCreds((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await saveIntegrations({
        ...creds,
        stripe_secret: stripe,
        lead_webhook: leadWebhook,
      });
      if (res.ok) toast.success("Credenciais guardadas.");
      else toast.error(res.error ?? "Erro ao guardar.");
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Credenciais das plataformas
        </h2>
        <p className="mt-1 text-xs text-paper/40">
          Guarde aqui os acessos de cada portal. Ficam protegidos — só
          administradores conseguem ver ou alterar.
        </p>
      </div>

      <div className="space-y-4">
        {CHANNELS.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-white/10 p-4"
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-paper">
              <input
                type="checkbox"
                className="accent-[color:var(--accent)]"
                checked={creds[c.id]?.enabled ?? false}
                onChange={(e) => update(c.id, { enabled: e.target.checked })}
              />
              {c.label}
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <span className="field-label">Utilizador / conta</span>
                <input
                  className="field"
                  value={creds[c.id]?.username ?? ""}
                  onChange={(e) => update(c.id, { username: e.target.value })}
                  placeholder="Ex.: stand@exemplo.pt"
                />
              </div>
              <div>
                <span className="field-label">Chave / token de API</span>
                <input
                  type="password"
                  className="field"
                  value={creds[c.id]?.token ?? ""}
                  onChange={(e) => update(c.id, { token: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Pagamentos (Stripe — MB WAY / cartão)
        </h2>
        <p className="mt-1 text-xs text-paper/40">
          Chave secreta da conta Stripe, usada para cobrar o sinal das reservas.
        </p>
        <div className="mt-3 max-w-md">
          <span className="field-label">Stripe — chave secreta</span>
          <input
            type="password"
            className="field"
            value={stripe}
            onChange={(e) => setStripe(e.target.value)}
            placeholder="sk_live_…"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Notificações de leads
        </h2>
        <p className="mt-1 text-xs text-paper/40">
          Cole um webhook (Slack, Discord, Make ou Zapier) para receber um aviso
          automático sempre que entrar um novo lead pelo site. Deixe vazio para
          desligar.
        </p>
        <div className="mt-3 max-w-md">
          <span className="field-label">URL do webhook</span>
          <input
            type="url"
            className="field"
            value={leadWebhook}
            onChange={(e) => setLeadWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/… ou https://discord.com/api/webhooks/…"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "A guardar…" : "Guardar credenciais"}
      </button>
    </form>
  );
}
