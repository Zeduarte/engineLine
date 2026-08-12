import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { supabasePublic } from "@/lib/supabase/public";

export const runtime = "nodejs";

/**
 * Regista uma visita à ficha de uma viatura.
 *
 * Chamado pelo cliente (`navigator.sendBeacon`/fetch) quando a página de
 * detalhe carrega. A RLS permite `insert` anónimo em `car_views`; ninguém
 * (exceto staff) consegue LER a tabela. Guardamos apenas um hash anónimo da
 * sessão (UA + dia) — sem dados pessoais nem IP em claro.
 */
export async function POST(request: Request) {
  let body: { car_id?: string; slug?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const carId = typeof body.car_id === "string" ? body.car_id : null;
  const slug = typeof body.slug === "string" ? body.slug.slice(0, 200) : null;
  if (!carId && !slug) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ua = request.headers.get("user-agent") ?? "";
  const day = new Date().toISOString().slice(0, 10);
  const session = createHash("sha256")
    .update(`${ua}|${day}`)
    .digest("hex")
    .slice(0, 32);

  const { error } = await supabasePublic.from("car_views").insert({
    car_id: carId,
    slug,
    session,
  });

  if (error) {
    // Não é crítico — nunca bloqueia a navegação do utilizador.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
