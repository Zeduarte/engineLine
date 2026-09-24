import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { effectiveSections } from "@/lib/permissions";
import { WhatsAppSimulator } from "./WhatsAppSimulator";

/**
 * Estado do canal de ordens por WhatsApp, e o simulador.
 *
 * O simulador não é um extra: é a forma de ver isto a funcionar sem depender do
 * número da Meta, que leva dias a aprovar. Corre o mesmo código do webhook.
 */
export async function WhatsAppPanel({ baseUrl }: { baseUrl: string }) {
  const variaveis = [
    ["WHATSAPP_VERIFY_TOKEN", !!process.env.WHATSAPP_VERIFY_TOKEN],
    ["WHATSAPP_APP_SECRET", !!process.env.WHATSAPP_APP_SECRET],
    ["WHATSAPP_PHONE_NUMBER_ID", !!process.env.WHATSAPP_PHONE_NUMBER_ID],
    ["WHATSAPP_ACCESS_TOKEN", !!process.env.WHATSAPP_ACCESS_TOKEN],
    ["ANTHROPIC_API_KEY", !!process.env.ANTHROPIC_API_KEY],
  ] as const;
  const faltam = variaveis.filter(([, presente]) => !presente).map(([nome]) => nome);

  // Quem pode dar ordens: tem telefone no perfil e uma das duas secções.
  const db = await createClient();
  const { data: perfis } = await db
    .from("profiles")
    .select("id,full_name,role,phone,allowed_sections")
    .order("full_name");
  const ligados = (perfis ?? [])
    .filter((p) => {
      const secoes = effectiveSections(p.role, p.allowed_sections);
      return secoes.includes("oficina") || secoes.includes("financeiro");
    })
    .map((p) => ({
      nome: p.full_name?.trim() || "Sem nome",
      telefone: p.phone?.trim() ?? "",
      secoes: effectiveSections(p.role, p.allowed_sections).filter(
        (s) => s === "oficina" || s === "financeiro",
      ),
    }));

  // As últimas ordens, para diagnóstico. A tabela é de servidor, por isso é o
  // cliente de serviço que a lê.
  const admin = createAdminClient();
  const { data: ultimas } = admin
    ? await admin
        .from("wa_messages")
        .select("wam_id,from_phone,received_at,processed_at,reply_sent_at,last_error")
        .order("received_at", { ascending: false })
        .limit(10)
    : { data: null };

  return (
    <section className="card space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-paper">Ordens por WhatsApp</h2>
        <p className="mt-1 text-sm text-paper/60">
          Um colaborador manda uma mensagem — «coloca uma despesa de 450 de
          embraiagem ao bmw 320» — e o registo é feito na Oficina ou em Custos e
          margens, com as permissões dele. Confirma sempre antes de gravar.
        </p>
      </div>

      {/* Estado da ligação */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-medium text-paper">
          {faltam.length === 0
            ? "Ligação configurada."
            : `Faltam ${faltam.length} ${faltam.length === 1 ? "variável" : "variáveis"} de ambiente.`}
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          {variaveis.map(([nome, presente]) => (
            <li key={nome} className={presente ? "text-paper/70" : "text-amber-300"}>
              {presente ? "✓" : "—"} {nome}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-paper/50">
          Endereço a colar no painel da Meta (campo <em>messages</em>):
        </p>
        <code className="mt-1 block break-all rounded-lg bg-black/40 px-3 py-2 text-xs text-accent">
          {baseUrl}/api/whatsapp
        </code>
        <p className="mt-2 text-xs text-paper/50">
          O simulador abaixo funciona sem nada disto — só precisa da
          ANTHROPIC_API_KEY.
        </p>
      </div>

      {/* Quem pode dar ordens */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Quem pode dar ordens
        </h3>
        <p className="mt-1 text-xs text-paper/50">
          É o telefone do perfil que identifica a pessoa. Sem telefone, as
          mensagens dela são ignoradas.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {ligados.length === 0 && (
            <li className="text-paper/50">
              Ninguém com acesso à Oficina ou a Custos e margens.
            </li>
          )}
          {ligados.map((p) => (
            <li
              key={p.nome + p.telefone}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 py-2"
            >
              <span className="text-paper">{p.nome}</span>
              <span className="text-paper/60">
                {p.secoes.map((s) => (s === "oficina" ? "Oficina" : "Custos")).join(" + ")}
                {" · "}
                {p.telefone ? (
                  p.telefone
                ) : (
                  <span className="text-amber-300">telefone em falta</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <WhatsAppSimulator />

      {/* Histórico. Mostra-se sempre: "nada chegou" também é um diagnóstico —
          quer dizer que a Meta não está a entregar, ou que o App Secret está
          errado (esses pedidos são recusados antes de se gravar o que quer que
          seja, e só aparecem nos logs do Netlify). */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Últimas mensagens recebidas
        </h3>
        {!ultimas || ultimas.length === 0 ? (
          <div className="mt-2 space-y-1 text-sm text-paper/60">
            <p>Ainda não chegou nenhuma mensagem do WhatsApp.</p>
            <p className="text-xs text-paper/50">
              Se já enviou uma: confirme na Meta que o campo <em>messages</em>{" "}
              está subscrito no webhook, e experimente o botão <em>Test</em>{" "}
              ao lado dele. Se mesmo assim nada aparecer aqui, veja os logs das
              funções no Netlify e procure «api/whatsapp» — um App Secret
              errado só aparece lá.
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-paper/70">
            {ultimas.map((m) => (
              <li key={m.wam_id} className="border-b border-white/10 pb-2">
                <span className="text-paper/50">
                  {new Date(m.received_at).toLocaleString("pt-PT")} · {m.from_phone}
                </span>
                <span className="block">
                  {m.last_error ? (
                    <span className="text-red-300">{m.last_error}</span>
                  ) : m.reply_sent_at ? (
                    <span className="text-emerald-300">respondida</span>
                  ) : m.processed_at ? (
                    "processada, sem resposta enviada"
                  ) : (
                    "recebida, ainda a processar"
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
