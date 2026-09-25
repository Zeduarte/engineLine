"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSection } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { olxConfigured } from "@/lib/olx/client";
import { unwrap, type OlxCategory } from "@/lib/olx/categories";
import { olxFetch } from "@/lib/olx/client";
import { loadCategories, storeCategory, syncListing, syncPending } from "@/lib/olx/sync";

/**
 * Ações do painel do OLX em Integrações e da ficha da viatura.
 *
 * Correm com o cliente de serviço (os tokens do OLX não são legíveis por
 * nenhuma sessão), por isso cada uma começa por verificar o separador de quem
 * a chama.
 */

export interface OlxActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  /** Categorias para o administrador escolher quando há dúvida. */
  candidates?: Partial<Record<"car" | "motorcycle", OlxCategory[]>>;
}

function admin() {
  const db = createAdminClient();
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY em falta.");
  return db;
}

export async function disconnectOlx(): Promise<OlxActionResult> {
  await requireSection("integracoes");
  const { error } = await admin().from("olx_connection").delete().eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/integracoes");
  return { ok: true, message: "Conta do OLX desligada. Os anúncios já publicados continuam no OLX." };
}

export async function loadOlxCategories(): Promise<OlxActionResult> {
  await requireSection("integracoes");
  if (!olxConfigured()) return { ok: false, error: "Faltam OLX_CLIENT_ID e OLX_CLIENT_SECRET no Netlify." };
  try {
    const r = await loadCategories(admin());
    revalidatePath("/admin/integracoes");
    if (!r.ok) return { ok: false, error: r.error };
    const escolhidas = Object.entries(r.chosen).map(([t, c]) => `${t === "car" ? "carros" : "motas"}: ${c!.name}`);
    const duvidas = Object.keys(r.ambiguous).length;
    return {
      ok: true,
      message: escolhidas.length
        ? `Categorias carregadas (${escolhidas.join(", ")}).${duvidas ? " Há categorias por escolher." : ""}`
        : duvidas
          ? "Há mais de uma categoria possível — escolha abaixo."
          : "Não encontrei categorias de carros nem de motas nesta conta do OLX.",
      candidates: r.ambiguous,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao carregar categorias." };
  }
}

export async function chooseOlxCategory(data: FormData): Promise<OlxActionResult> {
  await requireSection("integracoes");
  const parsed = z
    .object({ vehicle_type: z.enum(["car", "motorcycle"]), category_id: z.coerce.number().int().positive() })
    .safeParse({ vehicle_type: data.get("vehicle_type"), category_id: data.get("category_id") });
  if (!parsed.success) return { ok: false, error: "Escolha uma categoria." };
  const db = admin();
  const c = await olxFetch<unknown>(db, `/categories/${parsed.data.category_id}`);
  if (!c.ok) return { ok: false, error: c.error ?? "Categoria inválida." };
  const erro = await storeCategory(db, parsed.data.vehicle_type, unwrap<OlxCategory>(c.data));
  revalidatePath("/admin/integracoes");
  return erro ? { ok: false, error: erro } : { ok: true, message: "Categoria guardada." };
}

export async function syncOlxNow(): Promise<OlxActionResult> {
  await requireSection("integracoes");
  const n = await syncPending(admin(), 50);
  revalidatePath("/admin/integracoes");
  return { ok: true, message: n ? `${n} anúncio(s) sincronizado(s).` : "Não havia nada por sincronizar." };
}

/** "Tentar outra vez", na ficha da viatura. */
export async function retryOlxListing(carId: string): Promise<OlxActionResult> {
  await requireSection("carros");
  if (!z.string().uuid().safeParse(carId).success) return { ok: false, error: "Viatura inválida." };
  const db = admin();
  await db.from("channel_listings").update({ sync_state: "pending", attempts: 0 }).eq("car_id", carId).eq("channel", "olx");
  const r = await syncListing(db, carId);
  revalidatePath(`/admin/carros/${carId}`);
  return r.ok ? { ok: true, message: "Sincronizado com o OLX." } : { ok: false, error: r.error };
}
