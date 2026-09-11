import "server-only";
import { headers } from "next/headers";
import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** Only the server can write public submissions; RLS denies direct anonymous inserts. */
export async function publicSubmissionClient(kind: "lead" | "testimonial" | "view", identity = "") {
  const db = createAdminClient();
  if (!db) throw new Error("Submissões temporariamente indisponíveis. Contacte-nos por telefone.");
  const h = await headers();
  // Only trust an explicitly configured ingress header that the hosting proxy overwrites.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const ip = header ? h.get(header)?.split(",")[0]?.trim() : null;
  const secret = process.env.SUBMISSION_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const hash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  const keys = [ {value: `${kind}:global`, max: kind === "view" ? 3000 : 100} ];
  if (ip) keys.push({value: `${kind}:ip:${hash(ip)}`, max: kind === "view" ? 120 : 10});
  if (identity) keys.push({value: `${kind}:identity:${hash(identity.toLowerCase())}`, max: kind === "view" ? 30 : 5});
  for (const key of keys) {
    const {data, error} = await db.rpc("consume_submission", {key_value:key.value,max_hits:key.max,window_seconds:600});
    if (error || !data) throw new Error("Demasiados pedidos. Aguarde alguns minutos e tente novamente.");
  }
  return db;
}
