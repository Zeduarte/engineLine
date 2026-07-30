import Link from "next/link";

/** Estado vazio da dashboard — desenhado, não uma tabela vazia. */
export function EmptyState() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="max-w-md text-center">
        <div
          aria-hidden
          className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl border border-white/10 bg-ink-soft text-4xl"
        >
          🚗
        </div>
        <h2 className="text-2xl font-semibold text-paper">
          Ainda não há viaturas
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-paper/60">
          Crie o seu primeiro anúncio. Adicione fotografias, defina o preço e
          publique — aparece de imediato no site público.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/admin/carros/novo" className="btn-primary">
            ＋ Criar primeira viatura
          </Link>
        </div>
        <p className="mt-6 text-xs text-paper/40">
          Dica: pode importar o inventário de exemplo com o seed em{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">
            supabase/seed.sql
          </code>
          .
        </p>
      </div>
    </div>
  );
}
