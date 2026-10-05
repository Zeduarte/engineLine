import { requireSection } from "@/lib/guard";
import { OlxPanel } from "@/components/admin/OlxPanel";
import { CHANNELS, COMING_SOON } from "@/lib/schemas";

export const dynamic = "force-dynamic";

/**
 * Plataformas de anúncios: a gestão dos anúncios nos portais onde o stand
 * publica. Por agora só o OLX está ligado; os restantes aparecem como
 * «Brevemente disponível».
 */
export default async function AnunciosPage({
  searchParams,
}: {
  // O retorno do OAuth do OLX volta aqui com ?olx=ligado|erro|… para avisar.
  searchParams: Promise<{ olx?: string; detalhe?: string }>;
}) {
  await requireSection("anuncios");
  const { olx, detalhe } = await searchParams;
  const upcoming = CHANNELS.filter((c) => !c.available);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Plataformas de anúncios</h1>
        <p className="mt-1 text-sm text-paper/50">
          Os anúncios das viaturas nos portais: ligação à conta, categorias, publicação automática e estatísticas.
          Em cada viatura escolhe-se onde anunciar, em «Publicação».
        </p>
      </div>

      <div className="space-y-6">
        <OlxPanel status={olx} detalhe={detalhe} />

        <section className="card p-5">
          <h2 className="text-lg font-semibold text-paper">Outras plataformas</h2>
          <p className="mt-1 text-sm text-paper/60">
            A publicação automática nestes portais está a ser preparada.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-paper">{c.label}</p>
                <span className="mt-2 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-paper/70">
                  {COMING_SOON}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
