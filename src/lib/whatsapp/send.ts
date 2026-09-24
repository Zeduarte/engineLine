import "server-only";

/**
 * Envio de mensagens pelo WhatsApp Cloud API da Meta.
 *
 * É o ÚNICO sítio do projecto que envia mensagens (o resto só gera links
 * `wa.me`). Nunca lança: uma resposta que não chega não pode fazer a rota
 * devolver erro à Meta, senão ela reentrega a mensagem e a pessoa recebe tudo
 * em duplicado.
 *
 * A versão do Graph API vem de `WHATSAPP_GRAPH_VERSION` porque a Meta a
 * descontinua periodicamente; o valor por defeito deve ser confirmado no painel
 * da app antes de ir para produção.
 */

const DEFAULT_GRAPH_VERSION = "v21.0";
/** O WhatsApp aceita mais, mas uma ordem nunca precisa de tanto. */
const MAX_BODY = 4000;

export interface SendResult {
  ok: boolean;
  error?: string;
}

export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { ok: false, error: "WhatsApp não configurado" };

  const version = process.env.WHATSAPP_GRAPH_VERSION || DEFAULT_GRAPH_VERSION;
  // Destino configurável como o ANTHROPIC_BASE_URL, para os testes poderem
  // apontar a um servidor local. Vazio = a Meta.
  const base = (process.env.WHATSAPP_GRAPH_BASE_URL || "https://graph.facebook.com").replace(/\/$/, "");
  try {
    const response = await fetch(
      `${base}/${version}/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to,
          type: "text",
          text: { preview_url: false, body: body.slice(0, MAX_BODY) },
        }),
        // Como em src/lib/notifications.ts: tempo limite curto e sem seguir
        // redireccionamentos, que num pedido com o token seriam uma fuga.
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      },
    );
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "Falha no envio" };
  }
}
