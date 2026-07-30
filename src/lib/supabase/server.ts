import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Cliente Supabase para o SERVIDOR (Server Components, Server Actions, Route
 * Handlers). Lê/escreve a sessão nos cookies via @supabase/ssr.
 *
 * Em Next 15 `cookies()` é assíncrono — daí o `await`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado a partir de um Server Component — o refresh de sessão é
            // tratado pelo middleware, por isso podemos ignorar em segurança.
          }
        },
      },
    },
  );
}
