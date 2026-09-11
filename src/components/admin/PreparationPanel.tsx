import { createClient } from "@/lib/supabase/server";
import { ActionForm, Field } from "./ActionForm";
import { savePreparationTask } from "@/lib/actions/operations";
import { preparationLabel, TASK_LABELS } from "@/lib/operations";
import type { PreparationTask, StaffMember } from "@/lib/operations-types";
function TaskFields({task,carId,staff}: {task?:PreparationTask;carId:string;staff:StaffMember[]}) {
  return <><input type="hidden" name="id" value={task?.id ?? ""}/><input type="hidden" name="car_id" value={carId}/>
    <Field label="Trabalho / verificação"><input name="title" className="field" required maxLength={200} defaultValue={task?.title ?? ""} placeholder="Ex.: Verificar travões"/></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Fase"><select name="stage" className="field" defaultValue={task?.stage ?? "preparation"}><option value="preparation">Preparação para venda</option><option value="delivery">Entrega ao cliente</option></select></Field>
    <Field label="Estado"><select name="status" className="field" defaultValue={task?.status ?? "pending"}>{Object.entries(TASK_LABELS).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></Field>
    <Field label="Responsável"><select name="assigned_to" className="field" defaultValue={task?.assigned_to ?? ""}><option value="">Por atribuir</option>{staff.map(p=><option value={p.id} key={p.id}>{p.full_name}</option>)}</select></Field>
    <Field label="Prazo"><input name="due_on" className="field" type="date" defaultValue={task?.due_on ?? ""}/></Field></div>
    <Field label="Peças / observações"><textarea name="parts" className="field" maxLength={1000} defaultValue={task?.parts ?? ""}/></Field>
  </>;
}
export async function PreparationPanel({carId}: {carId:string}) {
  const db = await createClient();
  const [{data:tasks,error},{data:staff}] = await Promise.all([db.from("preparation_tasks").select("*").eq("car_id",carId).order("created_at"),db.rpc("staff_directory")]);
  if(error) return <p role="alert">Não foi possível carregar a preparação.</p>;
  return <section className="space-y-4"><header><h2 className="text-xl font-semibold">Preparação e entrega</h2><p className="mt-1 text-accent">{preparationLabel(tasks ?? [])}</p></header>
    {tasks?.map(t=><details key={t.id} className="card p-4"><summary className="cursor-pointer">{t.status === "done" ? "✓ " : ""}{t.title} · {TASK_LABELS[t.status]}{t.due_on ? ` · ${t.due_on}` : ""}</summary><ActionForm action={savePreparationTask} className="mt-4 space-y-4"><TaskFields task={t} carId={carId} staff={staff ?? []}/></ActionForm></details>)}
    <details className="card p-4"><summary className="cursor-pointer text-accent">＋ Adicionar trabalho ou verificação</summary><ActionForm action={savePreparationTask} label="Adicionar" className="mt-4 space-y-4"><TaskFields carId={carId} staff={staff ?? []}/></ActionForm></details>
  </section>;
}
