import Link from "next/link";
import { getHomeContent } from "@/lib/queries";
import { HomeContentForm } from "@/components/admin/HomeContentForm";

export const dynamic = "force-dynamic";

export default async function HomeContentPage() {
  const content = await getHomeContent();

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-paper">Página inicial</h1>
          <p className="mt-1 text-sm text-paper/50">
            Edite os textos e botões do topo, marcas, secção de confiança e a
            chamada final. As viaturas em destaque gerem-se em Viaturas.
          </p>
        </div>
        <Link href="/" target="_blank" className="btn-ghost">
          ↗ Ver página
        </Link>
      </div>

      <HomeContentForm initial={content} />
    </>
  );
}
