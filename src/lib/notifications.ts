import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
/** Deliver queued jobs with durable retry state. Called only by the protected worker or an admin. */
export async function processNotificationJobs() {
  const db = createAdminClient();
  if (!db) return {ok:false,error:"Chave de administração não configurada."};
  const {data: config,error: configError} = await db.from("integration_secrets").select("data").eq("id",1).single();
  if (configError) return {ok:false,error:"Não foi possível ler a configuração."};
  const webhook = config.data.lead_webhook;
  if (typeof webhook !== "string" || !webhook) return {ok:true};
  let url: URL;
  try { url = new URL(webhook); } catch { return {ok:false,error:"URL do webhook inválido."}; }
  const allowed = (process.env.NOTIFICATION_WEBHOOK_HOSTS ?? "hooks.slack.com,discord.com,discordapp.com,hook.eu1.make.com,hook.us1.make.com,hooks.zapier.com").split(",").map(x => x.trim());
  if (url.protocol !== "https:" || url.username || url.password || !allowed.includes(url.hostname)) return {ok:false,error:"Domínio do webhook não autorizado no servidor."};
  const {data: jobs,error} = await db.rpc("claim_notification_jobs");
  if (error) return {ok:false,error:"Não foi possível obter notificações pendentes."};
  for (const job of jobs ?? []) {
    try {
      const {data: lead,error: readError} = await db.from("leads").select("name,kind,car_label").eq("id",job.lead_id).single();
      if (readError) throw new Error("Contacto indisponível");
      const text = `Novo contacto: ${lead.name} (${lead.kind})${lead.car_label ? ` — ${lead.car_label}` : ""}. Consulte o backoffice.`;
      const response = await fetch(url, {method:"POST",headers:{"Content-Type":"application/json","Idempotency-Key":job.id},body:JSON.stringify({text,content:text}),signal:AbortSignal.timeout(5000),redirect:"error"});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const {error: saveError} = await db.from("notification_jobs").update({delivered_at:new Date().toISOString(),last_error:null}).eq("id",job.id);
      if (saveError) throw new Error("Falha ao guardar confirmação");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha no envio";
      await db.from("notification_jobs").update({last_error:message.slice(0,200),next_attempt_at:new Date(Date.now()+Math.min(3600,30*2**job.attempts)*1000).toISOString()}).eq("id",job.id);
    }
  }
  return {ok:true};
}
