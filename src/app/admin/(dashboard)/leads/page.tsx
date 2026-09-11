import Link from "next/link";
import { requireSection } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS,leadFilters } from "@/lib/lead-filters";
export const dynamic="force-dynamic";
export default async function LeadsPage({searchParams}: {searchParams:Promise<Record<string,string|undefined>>}) {
 await requireSection("leads");const raw=await searchParams;const f=leadFilters(raw);const db=await createClient();
 let query=db.from("leads").select("*",{count:"exact"});
 if(f.status)query=query.eq("status",f.status);
 if(f.q)query=query.or(`name.ilike.%${f.q}%,email.ilike.%${f.q}%,phone.ilike.%${f.q}%,car_label.ilike.%${f.q}%`);
 if(f.assigned)query=query.eq("assigned_to",f.assigned);
 if(f.due==="overdue")query=query.in("status",["new","contacted","proposal"]).lt("next_action_at",new Date().toISOString());
 if(f.due==="unanswered")query=query.eq("status","new").is("first_contacted_at",null);
 if(f.due==="unassigned")query=query.is("assigned_to",null).in("status",["new","contacted","proposal"]);
 const [{data:leads,count,error},{data:staff}]=await Promise.all([query.order("created_at",{ascending:false}).order("id").range((f.page-1)*50,f.page*50-1),db.rpc("staff_directory")]);
 if(error)throw new Error("Não foi possível carregar os contactos.");
 const pages=Math.max(1,Math.ceil((count??0)/50));
 function href(page:number){const p=new URLSearchParams();for(const[k,v]of Object.entries(raw))if(v&&k!=="page")p.set(k,v);p.set("page",String(page));return `/admin/leads?${p}`;}
 const exportParams=new URLSearchParams();for(const[k,v]of Object.entries(raw))if(v&&k!=="page")exportParams.set(k,v);
 return <div className="space-y-6"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Contactos e acompanhamento</h1><p className="mt-1 text-sm text-paper/50">{count??0} contactos encontrados</p></div><a className="btn-ghost" href={`/api/admin/leads/export?${exportParams}`}>Exportar resultados CSV</a></header>
 <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5"><label className="text-sm">Pesquisar<input className="field mt-1" name="q" defaultValue={f.q} placeholder="Nome, telefone, email ou viatura"/></label>
 <label className="text-sm">Estado<select className="field mt-1" name="status" defaultValue={f.status??""}><option value="">Todos</option>{Object.entries(LEAD_STATUS_LABELS).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>
 <label className="text-sm">Responsável<select className="field mt-1" name="assigned" defaultValue={f.assigned??""}><option value="">Todos</option>{staff?.map(p=><option value={p.id} key={p.id}>{p.full_name}</option>)}</select></label>
 <label className="text-sm">Prioridade<select className="field mt-1" name="due" defaultValue={f.due??""}><option value="">Todas</option><option value="overdue">Ações em atraso</option><option value="unanswered">Sem resposta</option><option value="unassigned">Por atribuir</option></select></label><button className="btn-primary self-end">Filtrar</button></form>
 <div className="space-y-3">{leads?.map(l=><Link key={l.id} href={`/admin/leads/${l.id}`} className="card block p-4 transition-colors hover:border-accent/50"><div className="flex flex-wrap justify-between gap-2"><strong>{l.name}</strong><span className="text-sm text-accent">{LEAD_STATUS_LABELS[l.status]}</span></div><p className="mt-1 text-sm text-paper/60">{l.car_label??"Contacto geral"} · {l.phone??l.email}</p><p className="mt-2 text-sm">{staff?.find(p=>p.id===l.assigned_to)?.full_name??"Por atribuir"}{l.next_action&&` · ${l.next_action}`}</p>{l.next_action_at&&<p className={`mt-1 text-sm ${new Date(l.next_action_at)<new Date()?"text-amber-300":"text-paper/50"}`}>{new Date(l.next_action_at).toLocaleString("pt-PT",{timeZone:"Europe/Lisbon"})}</p>}</Link>)}{!leads?.length&&<p className="card p-8 text-paper/60">Nenhum contacto corresponde aos filtros.</p>}</div>
 <nav aria-label="Paginação" className="flex items-center justify-between gap-3">{f.page>1?<Link className="btn-ghost" href={href(f.page-1)}>← Anterior</Link>:<span/>}<p className="text-sm">Página {f.page} de {pages}</p>{f.page<pages?<Link className="btn-ghost" href={href(f.page+1)}>Seguinte →</Link>:<span/>}</nav></div>;
}
