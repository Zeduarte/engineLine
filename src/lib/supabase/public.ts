import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente Supabase PÚBLICO e sem cookies (anón).
 *
 * Usado nas leituras do site público (Server Components, ISR,
 * `generateStaticParams`, sitemap). Como não depende de `cookies()`, funciona
 * tanto em contexto de request como em build/prerender — ao contrário do
 * cliente `server.ts`, que só pode ser usado dentro de um request.
 *
 * A RLS garante que só devolve viaturas `published`.
 */
export const supabasePublic = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);
