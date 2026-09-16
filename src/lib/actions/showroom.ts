"use server";
import { revalidatePath } from "next/cache";
import { requireSection } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { showroomSchema } from "@/lib/showroom";
export async function saveShowroom(
  input: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireSection("pagina-inicial");
  const parsed = showroomSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(" → ")}: ${i.message}`)
        .join("; "),
    };
  const db = await createClient();
  const { data: linked, error: readError } = await db
    .from("cars")
    .select("point_of_sale_id")
    .not("point_of_sale_id", "is", null);
  if (readError)
    return {
      ok: false,
      error:
        "Não foi possível verificar os pontos de venda. Confirme que a migração 0018 está aplicada.",
    };
  if (
    linked?.some(
      (c) =>
        c.point_of_sale_id &&
        !parsed.data.locations.some((p) => p.id === c.point_of_sale_id),
    )
  )
    return {
      ok: false,
      error:
        "Um ponto de venda está associado a viaturas. Reatribua essas viaturas antes de remover ou alterar o identificador.",
    };
  const { error } = await db
    .from("site_content")
    .upsert({ key: "showroom", content: parsed.data }, { onConflict: "key" });
  if (error)
    return { ok: false, error: "Não foi possível guardar os conteúdos." };
  revalidatePath("/", "layout");
  revalidatePath("/admin/pagina-inicial");
  revalidatePath("/admin/carros", "layout");
  revalidatePath("/sitemap.xml");
  return { ok: true };
}
