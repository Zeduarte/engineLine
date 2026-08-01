import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Cliente Supabase para o BROWSER (Client Components).
 *
 * Usa a chave anónima — toda a segurança é imposta pelas políticas RLS.
 * Partilha a sessão via cookies com o servidor (@supabase/ssr).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
