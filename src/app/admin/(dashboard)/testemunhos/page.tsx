import { getAllTestimonials } from "@/lib/admin-queries";
import {
  TestimonialsManager,
  type TestimonialItem,
} from "@/components/admin/TestimonialsManager";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const rows = await getAllTestimonials();
  const items = rows as TestimonialItem[];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Testemunhos</h1>
        <p className="mt-1 text-sm text-paper/50">
          Avaliações de clientes mostradas na página inicial.
        </p>
      </div>
      <TestimonialsManager items={items} />
    </>
  );
}
