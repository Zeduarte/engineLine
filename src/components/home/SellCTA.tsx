import Link from "next/link";

/**
 * Chamada para retoma / encomenda. Colocada no fim da homepage e da ficha de
 * viatura — capta quem tem carro para trocar ou procura algo específico.
 */
export function SellCTA() {
  return (
    <section className="container-px">
      <div className="grid gap-8 overflow-hidden rounded-3xl border border-white/10 bg-ink-soft p-8 md:grid-cols-2 md:items-center md:p-12">
        <div>
          <p className="eyebrow mb-4">Retoma & Encomenda</p>
          <h2 className="text-3xl font-semibold text-paper md:text-4xl">
            Tem um carro para trocar? Ou procura algo específico?
          </h2>
          <p className="mt-4 max-w-md text-paper/60">
            Avalie a sua retoma em minutos ou peça a viatura ideal — mesmo que
            ainda não esteja no nosso stock.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
          <Link
            href="/vender"
            className="rounded-full bg-accent px-7 py-3.5 text-center text-sm font-semibold text-ink transition-transform hover:scale-[1.03]"
          >
            Avaliar a minha retoma
          </Link>
          <Link
            href="/vender"
            className="rounded-full border border-white/20 px-7 py-3.5 text-center text-sm font-medium text-paper transition-colors hover:border-white/60"
          >
            Encomendar viatura
          </Link>
        </div>
      </div>
    </section>
  );
}
