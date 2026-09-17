import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { publicSubmissionClient } from "@/lib/public-submissions";
import { getBranding, getVehicleBySlug } from "@/lib/queries";
import { CHAT_RULES, buildContextBlock } from "@/lib/chat/prompt";
import { SEARCH_TOOL, SEARCH_TOOL_NAME, SearchInput, runSearch } from "@/lib/chat/tools";
import { resolveActions, splitActionMarker } from "@/lib/chat/actions";
import { MarkerBuffer } from "@/lib/chat/stream-marker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Assistente virtual do site público.
 *
 * O cliente envia só o histórico da conversa e a página onde está; é aqui que
 * se decide o que o modelo sabe. A chave da API nunca sai do servidor.
 *
 * Resposta: NDJSON (uma linha JSON por evento) —
 *   {"type":"text","value":"…"}      pedaço de texto
 *   {"type":"actions","value":[…]}   botões de encaminhamento
 *   {"type":"error","value":"…"}     falha depois de o stream ter começado
 */

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1024;
/** Uma resposta precisa de 1 pesquisa; 3 dá folga sem permitir um ciclo caro. */
const MAX_TOOL_ROUNDS = 3;

const Body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(40),
  pathname: z.string().max(300).default("/"),
});

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "O assistente não está configurado." },
      { status: 503 },
    );
  }

  let parsed;
  try {
    parsed = Body.safeParse(await request.json());
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const { messages, pathname } = parsed.data;
  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await publicSubmissionClient("chat");
  } catch {
    return NextResponse.json(
      {
        error:
          "Demasiadas mensagens em pouco tempo. Aguarde uns minutos ou fale connosco por telefone.",
      },
      { status: 429 },
    );
  }

  const branding = await getBranding();
  const slug = vehicleSlug(pathname);
  const vehicle = slug ? await getVehicleBySlug(slug) : undefined;

  // `baseURL` explícito: o bundler do Next não garante que o SDK veja as
  // variáveis de ambiente sozinho. Vazio = API da Anthropic.
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(process.env.ANTHROPIC_BASE_URL
      ? { baseURL: process.env.ANTHROPIC_BASE_URL }
      : {}),
  });

  // As regras vão num bloco próprio com cache: são iguais em todos os pedidos,
  // por isso a partir da segunda mensagem são lidas da cache (~90% mais baratas).
  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: CHAT_RULES, cache_control: { type: "ephemeral" } },
    {
      type: "text",
      text: buildContextBlock({
        branding,
        vehicle,
        pageLabel: pageLabel(pathname, slug, !!vehicle),
      }),
    },
  ];

  const conversation: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Slugs que o servidor realmente devolveu — só estes podem virar links.
  const knownSlugs = new Map<string, string>();
  if (vehicle) knownSlugs.set(vehicle.slug, `${vehicle.make} ${vehicle.model}`);

  const encoder = new TextEncoder();
  const marker = new MarkerBuffer();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));

      try {
        for (let round = 0; ; round++) {
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            tools: [SEARCH_TOOL],
            messages: conversation,
          });

          stream.on("text", (delta) => {
            const chunk = marker.push(delta);
            if (chunk) send({ type: "text", value: chunk });
          });

          const message = await stream.finalMessage();

          if (message.stop_reason === "refusal") break;
          if (message.stop_reason === "pause_turn") {
            conversation.push({ role: "assistant", content: message.content });
            continue;
          }

          const toolUses = message.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
          );
          if (toolUses.length === 0) break;

          // Um input cortado a meio ainda pode parecer válido — não o corremos.
          if (message.stop_reason === "max_tokens") break;
          if (round >= MAX_TOOL_ROUNDS) break;

          conversation.push({ role: "assistant", content: message.content });

          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const use of toolUses) {
            results.push({
              type: "tool_result",
              tool_use_id: use.id,
              ...(await executeTool(use, knownSlugs)),
            });
          }
          conversation.push({ role: "user", content: results });
        }

        // Retira o marcador e entrega o que ficou retido no buffer.
        const { text, keys } = splitActionMarker(marker.raw);
        if (text.length > marker.emittedLength) {
          send({ type: "text", value: text.slice(marker.emittedLength) });
        }
        const actions = resolveActions(keys, branding, knownSlugs, !!vehicle);
        if (actions.length) send({ type: "actions", value: actions });
      } catch (error) {
        // A mensagem real fica no log do servidor; o visitante vê texto neutro.
        console.error("api/chat:", error);
        send({
          type: "error",
          value:
            "Houve um problema a responder. Tente de novo ou fale connosco por telefone.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Corre a ferramenta pedida, validando o input antes de lhe tocar. */
async function executeTool(
  use: Anthropic.ToolUseBlock,
  knownSlugs: Map<string, string>,
): Promise<{ content: string; is_error?: boolean }> {
  if (use.name !== SEARCH_TOOL_NAME) {
    return { content: "Ferramenta desconhecida.", is_error: true };
  }
  const input = SearchInput.safeParse(use.input);
  if (!input.success) {
    return { content: "Filtros inválidos. Tente outros critérios.", is_error: true };
  }
  try {
    const outcome = await runSearch(input.data);
    for (const [slug, label] of outcome.slugs) knownSlugs.set(slug, label);
    return { content: outcome.content };
  } catch (error) {
    console.error("api/chat pesquisa:", error);
    return { content: "Não foi possível consultar o stock agora.", is_error: true };
  }
}

/** Slug da viatura quando o visitante está numa ficha (`/viaturas/<slug>`). */
function vehicleSlug(pathname: string): string | null {
  const match = /^\/viaturas\/([a-z0-9-]{1,200})\/?$/i.exec(pathname);
  return match?.[1] ?? null;
}

const PAGE_LABELS: Record<string, string> = {
  "/": "Página inicial do site.",
  "/inventario": "Lista de viaturas em stock, com filtros.",
  "/vendidos": "Lista de viaturas já vendidas.",
  "/vender": "Página de venda/retoma: o visitante quer vender o carro dele.",
  "/contactos": "Página de contactos, com morada e mapa.",
  "/sobre": "Página sobre o stand.",
  "/favoritos": "Viaturas que o visitante guardou como favoritas.",
  "/comparar": "Comparação lado a lado de viaturas.",
  "/quiz": "Questionário que sugere uma viatura ao visitante.",
};

function pageLabel(
  pathname: string,
  slug: string | null,
  hasVehicle: boolean,
): string {
  if (hasVehicle) return "Ficha de uma viatura — os dados estão abaixo.";
  if (slug) return "Ficha de uma viatura que já não está disponível no site.";
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PAGE_LABELS[clean] ?? `Página ${clean} do site.`;
}
