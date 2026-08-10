import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente com a chave SERVICE_ROLE — ignora a RLS e permite operações de
 * administração (criar/apagar utilizadores no Auth). NUNCA usar no browser.
 *
 * Requer `SUPABASE_SERVICE_ROLE_KEY` no ambiente. Devolve `null` se não estiver
 * configurada, para o backoffice poder mostrar uma mensagem em vez de rebentar.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
