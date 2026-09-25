import { createAdminClient } from "@/lib/supabase/admin";
import { olxConfigured } from "@/lib/olx/client";
import { REMOTE_STATUS_LABEL } from "@/lib/olx/lifecycle";
import { OlxActions } from "./OlxActions";

/**
 * Ligação ao OLX, em Integrações.
 *
 * Lê pelo cliente de serviço porque as tabelas do OLX não são legíveis por
 * nenhuma sessão (têm os tokens da conta). Daqui só sai o que é seguro
 * mostrar: o nome da conta, a validade, as categorias e os erros.
 */
export async function OlxPanel({ status, detalhe }: { status?: string; detalhe?: string }) {
  const configured = olxConfigured();
  const db = createAdminClient();
  const [conn, cats, erros, contagem] = db
    ? await Promise.all([
        db.from("olx_connection").select("olx_user_name,expires_at,city_id,updated_at").eq("id", 1).maybeSingle(),
        db.from("olx_category_cache").select("vehicle_type,category_id,category_name,fetched_at"),
        db
          .from("channel_listings")
          .select("car_id,last_error,remote_status,cars(make,model,license_plate)")
          .eq("channel", "olx")
          .not("last_error", "is", null)
          .limit(20),
        db.from("channel_listings").select("remote_status").eq("channel", "olx"),
      ])
    : [null, null, null, null];

  const ligado = !!conn?.data;
  const ativos = (contagem?.data ?? []).filter((l) => l.remote_status === "active").length;
  const categorias = new Map((cats?.data ?? []).map((c) => [c.vehicle_type, c]));

  const aviso: Record<string, string> = {
    ligado: "Conta do OLX ligada. Carregue agora as categorias.",
    "sem-credenciais": "Faltam OLX_CLIENT_ID e OLX_CLIENT_SECRET nas variáveis do Netlify.",
    recusado: "A autorização foi recusada no OLX.",
    "estado-invalido": "O pedido de ligação expirou ou não veio deste navegador. Tente outra vez.",
    erro: "Não foi possível ligar ao OLX.",
  };

  return (
    <section className="card space-y-5 p-5">
      <div>
        <h2 className="text-lg font-semibold text-paper">OLX</h2>
        <p className="mt-1 text-sm text-paper/60">
          As viaturas com <strong>OLX</strong> marcado nos canais são publicadas
          e mantidas atualizadas no OLX: preço, fotos e texto. Vendidas saem;
          reservadas ficam.
        </p>
      </div>

      {status && aviso[status] && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${status === "ligado" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/15 text-red-200"}`}
        >
          {aviso[status]}
          {detalhe ? ` (${detalhe})` : ""}
        </p>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
        {!configured ? (
          <p className="text-amber-300">
            Faltam as variáveis <code>OLX_CLIENT_ID</code> e <code>OLX_CLIENT_SECRET</code> no
            Netlify (com o valor que o OLX enviou por email). Depois de as criar, faça um
            novo deploy.
          </p>
        ) : ligado ? (
          <div className="space-y-1 text-paper/80">
            <p>
              Ligado à conta <strong>{conn!.data!.olx_user_name ?? "do OLX"}</strong>.
            </p>
            <p className="text-xs text-paper/50">
              O acesso renova-se sozinho todos os dias.
              {conn!.data!.city_id ? "" : " Falta resolver a cidade do stand — carregue as categorias."}
            </p>
            <p className="text-xs text-paper/50">{ativos} anúncio(s) ativo(s) no OLX.</p>
          </div>
        ) : (
          <p className="text-paper/70">
            Ainda não ligado. O botão abaixo leva-o ao OLX para autorizar esta aplicação
            na conta do stand; volta aqui sozinho.
          </p>
        )}
      </div>

      {ligado && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
            Categorias
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-paper/70">
            {(["car", "motorcycle"] as const).map((t) => {
              const c = categorias.get(t);
              return (
                <li key={t}>
                  {t === "car" ? "Carros" : "Motas"}:{" "}
                  {c ? (
                    <span className="text-paper">
                      {c.category_name} (ID {c.category_id})
                    </span>
                  ) : (
                    <span className="text-amber-300">por carregar</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <OlxActions configured={configured} connected={ligado} />

      {ligado && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
            Anúncios com problemas
          </h3>
          {!erros?.data?.length ? (
            <p className="mt-2 text-sm text-paper/60">Nenhum.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {erros.data.map((e) => {
                const car = e.cars as unknown as { make: string; model: string; license_plate: string | null } | null;
                return (
                  <li key={e.car_id} className="border-b border-white/10 pb-2">
                    <a href={`/admin/carros/${e.car_id}`} className="text-paper underline">
                      {car ? `${car.make} ${car.model}` : "Viatura"}
                      {car?.license_plate ? ` · ${car.license_plate}` : ""}
                    </a>
                    {e.remote_status && (
                      <span className="text-paper/50"> · {REMOTE_STATUS_LABEL[e.remote_status] ?? e.remote_status}</span>
                    )}
                    <span className="block text-red-300">{e.last_error}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
