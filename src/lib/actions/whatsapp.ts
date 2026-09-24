"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSection } from "@/lib/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleInbound, toActor } from "@/lib/whatsapp/handle";

/**
 * Simulador das ordens por WhatsApp, para o backoffice.
 *
 * Corre EXACTAMENTE o mesmo `handleInbound` que o webhook vai correr, e grava a
 * sério — é esse o objectivo: demonstrar o produto antes de existir o número da
 * Meta, e ao mesmo tempo ser um teste de integração e não uma imitação.
 *
 * Duas coisas que fazem isto ser seguro, e que não se devem mexer:
 *  - não há rota nova sem autenticação; isto é uma Server Action atrás de
 *    `requireSection("integracoes")`;
 *  - o actor é FORÇADO ao utilizador com sessão. Não vem do formulário, por isso
 *    ninguém pode simular uma ordem em nome de outra pessoa.
 *
 * Deliberadamente NÃO se cria uma rota `/api/whatsapp/simular` com um segredo
 * partilhado, nem um desvio `?dev=1` dentro do webhook real: são as duas formas
 * de isto ir para produção por distracção.
 */

export interface SimulationResult {
  ok: boolean;
  error?: string;
  reply?: string;
  wrote?: boolean;
}

export async function simulateInbound(data: FormData): Promise<SimulationResult> {
  const me = await requireSection("integracoes");

  const parsed = z
    .object({ text: z.string().trim().min(1, "Escreva a mensagem.").max(1000) })
    .safeParse({ text: data.get("text") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Mensagem inválida." };
  }

  const db = createAdminClient();
  if (!db) return { ok: false, error: "A chave de serviço do Supabase não está configurada." };

  const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        ...(process.env.ANTHROPIC_BASE_URL
          ? { baseURL: process.env.ANTHROPIC_BASE_URL }
          : {}),
      })
    : null;

  // A conversa do simulador é separada da do telefone da pessoa, para uma
  // proposta de teste nunca poder ser confirmada por engano a partir do WhatsApp.
  const from = `sim:${me.id}`;

  try {
    const result = await handleInbound(
      { from, text: parsed.data.text, type: "text" },
      toActor(me),
      { db, anthropic },
    );
    if (result.wrote) {
      revalidatePath("/admin/financeiro", "layout");
      revalidatePath("/admin/oficina", "layout");
      revalidatePath("/admin/carros", "layout");
    }
    revalidatePath("/admin/integracoes");
    return { ok: true, reply: result.reply ?? "", wrote: result.wrote };
  } catch (error) {
    console.error("simulateInbound:", error);
    return { ok: false, error: "Não foi possível simular. Veja os registos do servidor." };
  }
}
