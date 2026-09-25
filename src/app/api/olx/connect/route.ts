import { NextResponse } from "next/server";
import { requireSection } from "@/lib/guard";
import { olxBase, olxConfigured } from "@/lib/olx/client";
import { createState } from "@/lib/olx/oauth";
import { STATE_COOKIE, olxRedirectUri } from "../redirect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Ligar conta OLX": envia o administrador para o OLX, que lhe pede para
 * autorizar a aplicação e o devolve a /api/olx/callback com um `code`.
 */
export async function GET(request: Request) {
  await requireSection("integracoes");
  const back = new URL("/admin/integracoes", request.url);
  if (!olxConfigured()) {
    back.searchParams.set("olx", "sem-credenciais");
    return NextResponse.redirect(back);
  }

  const state = createState(process.env.OLX_CLIENT_SECRET!);
  const url = new URL(`${olxBase()}/oauth/authorize/`);
  url.searchParams.set("client_id", process.env.OLX_CLIENT_ID!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read write v2");
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", olxRedirectUri(request));

  const response = NextResponse.redirect(url);
  // O retorno só é aceite neste navegador: é o cookie que o prova.
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/olx",
    maxAge: 600,
  });
  return response;
}
