import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-px flex min-h-dvh flex-col items-center justify-center text-center">
      <p className="eyebrow mb-6">Erro 404</p>
      <h1 className="text-headline font-semibold text-paper">
        Esta viatura já saiu do stand
      </h1>
      <p className="mt-4 max-w-md font-light text-paper/60">
        A página que procura não existe ou foi movida. Volte ao stock para
        ver o que temos disponível.
      </p>
      <Link
        href="/inventario"
        className="mt-8 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 ease-premium hover:scale-[1.03]"
      >
        Ver stock
      </Link>
    </div>
  );
}
