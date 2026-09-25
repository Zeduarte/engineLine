import "server-only";
import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConnection, olxConfigured, olxFetch } from "@/lib/olx/client";
import { markPending, syncListing } from "@/lib/olx/sync";

/**
 * Ponte entre o backoffice e a sincronização com o OLX.
 *
 * Quem grava uma viatura não pode ficar à espera do OLX (que pode demorar ou
 * estar em baixo), nem ver a gravação falhar por causa dele. Por isso aqui só
 * se marca como pendente, e a sincronização corre depois de a resposta sair
 * (`after`). O que falhar fica pendente e o /api/maintenance repete.
 */
export async function queueOlxSync(carIds: string[]): Promise<void> {
  if (!olxConfigured() || !carIds.length) return;
  const db = createAdminClient();
  if (!db) return;
  try {
    for (const id of carIds) await markPending(db, id);
  } catch (e) {
    console.error("queueOlxSync:", e);
    return;
  }
  after(async () => {
    const conn = await getConnection(db);
    if (!conn) return;
    for (const id of carIds) await syncListing(db, id);
  });
}

/**
 * Antes de apagar viaturas: tira os anúncios do OLX. Depois de apagada, a
 * linha de `channel_listings` desaparece em cascata e o anúncio ficava órfão
 * no OLX, a mostrar uma viatura que já não existe.
 */
export async function retireOlxAdverts(carIds: string[]): Promise<void> {
  if (!olxConfigured() || !carIds.length) return;
  const db = createAdminClient();
  if (!db || !(await getConnection(db))) return;
  const { data } = await db
    .from("channel_listings")
    .select("external_id")
    .eq("channel", "olx")
    .in("car_id", carIds)
    .not("external_id", "is", null);
  for (const row of data ?? []) {
    const r = await olxFetch(db, `/adverts/${row.external_id}/commands`, {
      method: "POST",
      body: { command: "deactivate", is_success: false },
    });
    if (!r.ok) console.error("retireOlxAdverts:", row.external_id, r.error);
  }
}
