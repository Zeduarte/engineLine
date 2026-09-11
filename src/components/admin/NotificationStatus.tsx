import { createClient } from "@/lib/supabase/server";
import { ActionForm } from "./ActionForm";
import { retryNotifications,expireReservationsNow,requeueNotification } from "@/lib/actions/operations";
export async function NotificationStatus() {
 const db=await createClient();const {data:jobs,error}=await db.from("notification_jobs").select("id,attempts,last_error,created_at,next_attempt_at").is("delivered_at",null).order("created_at").limit(30);
 return <section className="card space-y-4 p-5"><h2 className="text-lg font-semibold">Notificações e reservas</h2><p className="text-sm text-paper/60">Os envios pendentes são repetidos pelo processamento periódico. As reservas são libertadas quando termina o prazo.</p>
 {error?<p role="alert">Não foi possível carregar as notificações.</p>:<ul className="space-y-2 text-sm">{jobs?.map(j=><li key={j.id}>{j.attempts>=8?"Requer atenção":j.last_error?"A repetir":"Pendente"} · {j.attempts} tentativas{j.last_error&&` · ${j.last_error}`}{j.attempts>=8&&<ActionForm action={requeueNotification} label="Voltar a tentar" className="mt-2"><input type="hidden" name="id" value={j.id}/></ActionForm>}</li>)}</ul>}
 <div className="flex flex-wrap gap-3"><ActionForm action={retryNotifications} label="Processar notificações" className=""/><ActionForm action={expireReservationsNow} label="Libertar reservas expiradas" className=""/></div>
 </section>;
}
