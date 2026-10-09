import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { publicSubmissionClient } from "@/lib/public-submissions";
import { z } from "zod";
import { viewSkipReason } from "@/lib/view-filter";

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
  // Só contam visitantes reais: fora robôs, a equipa, o dev local e as previews.
  const skipped = viewSkipReason({
    userAgent: ua,
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "",
    nodeEnv: process.env.NODE_ENV,
    cookieNames: (request.headers.get("cookie") ?? "")
      .split(";")
      .map((c) => c.split("=")[0]!.trim())
      .filter(Boolean),
  });
  if (skipped) return NextResponse.json({ ok: true, skipped });

  const day = new Date().toISOString().slice(0, 10);
  const session = createHash("sha256")
    .update(`${ua}|${day}`)
    .digest("hex")
    .slice(0, 32);

  if (carId && !z.string().uuid().safeParse(carId).success) return NextResponse.json({ok:false},{status:400});
  let db;
  try { db = await publicSubmissionClient("view"); } catch { return NextResponse.json({ok:false},{status:429}); }
  const query = db.from("cars").select("id,slug").in("status",["published","reserved","sold"]);
  const {data:car} = await (carId ? query.eq("id",carId) : query.eq("slug",slug!)).maybeSingle();
  if (!car) return NextResponse.json({ok:false},{status:404});
  const { error } = await db.from("car_views").insert({
    car_id: car.id,
    slug: car.slug,
    session,
  });

  if (error) {
    // Não é crítico — nunca bloqueia a navegação do utilizador.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
