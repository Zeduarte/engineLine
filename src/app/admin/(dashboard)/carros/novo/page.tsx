import Link from "next/link";
import { CarForm } from "@/components/admin/CarForm";

export const dynamic = "force-dynamic";

export default function NewCarPage() {
  return (
    <>
      <div className="mb-6">
        <Link
          href="/admin/carros"
          className="text-sm text-paper/50 hover:text-paper"
        >
          ← Viaturas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-paper">Nova viatura</h1>
        <p className="mt-1 text-sm text-paper/50">
          Preencha os dados. Depois de criar, poderá adicionar fotografias e
          vídeo.
        </p>
      </div>
      <CarForm />
    </>
  );
}
