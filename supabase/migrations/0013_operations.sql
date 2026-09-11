-- Apply after 0012. All schema/security changes are transactional.
begin;

create or replace function public.has_section(section text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select case
    when role::text = 'admin' then true
    when role::text = 'mecanico' then section = 'oficina'
    when section = 'dashboard' then true
    when cardinality(allowed_sections) > 0 then section = any(allowed_sections)
    when role::text = 'chefe' then section = any(array['carros','pagina-inicial','leads','testemunhos','financeiro'])
    when role::text = 'vendedor' then section = any(array['carros','leads'])
    else false end from public.profiles where id = auth.uid()), false);
$$;
revoke all on function public.has_section(text) from public;
grant execute on function public.has_section(text) to anon, authenticated, service_role;

-- Auth registration must never manufacture staff or trust user-controlled metadata.
-- Staff creation now explicitly inserts the profile through the server admin API.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin return new; end;
$$;
revoke update on public.profiles from anon, authenticated;
grant update(full_name) on public.profiles to authenticated;
drop policy if exists "profiles: admin update all" on public.profiles;
drop policy if exists "profiles: admin delete" on public.profiles;
drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: managers read" on public.profiles for select to authenticated
using (public.has_section('utilizadores'));
revoke insert, delete on public.profiles from anon, authenticated;

-- Replace permissive legacy policies (policies otherwise combine with OR).
drop policy if exists "cars: public read published" on public.cars;
create policy "cars: read" on public.cars for select using
(status in ('published','reserved','sold') or public.has_section('carros') or public.has_section('oficina') or public.has_section('financeiro'));
drop policy if exists "cars: staff insert" on public.cars;
drop policy if exists "cars: staff update" on public.cars;
drop policy if exists "cars: staff delete" on public.cars;
create policy "cars: write" on public.cars for all to authenticated
using (public.has_section('carros')) with check (public.has_section('carros'));
drop policy if exists "car_media: staff write" on public.car_media;
drop policy if exists "car_media: public read published" on public.car_media;
create policy "media: read" on public.car_media for select using (
 public.has_section('carros') or public.has_section('oficina') or exists
 (select 1 from public.cars c where c.id = car_id and c.status in ('published','reserved','sold')));
create policy "media: write" on public.car_media for all to authenticated
using (public.has_section('carros')) with check (public.has_section('carros'));
drop policy if exists "car-media: staff insert" on storage.objects;
drop policy if exists "car-media: staff update" on storage.objects;
drop policy if exists "car-media: staff delete" on storage.objects;
create policy "car-media: editor insert" on storage.objects for insert to authenticated
with check (bucket_id = 'car-media' and (public.has_section('carros') or public.is_admin()));
create policy "car-media: editor update" on storage.objects for update to authenticated
using (bucket_id = 'car-media' and (public.has_section('carros') or public.is_admin()))
with check (bucket_id = 'car-media' and (public.has_section('carros') or public.is_admin()));
create policy "car-media: editor delete" on storage.objects for delete to authenticated
using (bucket_id = 'car-media' and (public.has_section('carros') or public.is_admin()));

drop policy if exists "leads: public insert" on public.leads;
drop policy if exists "leads: staff read" on public.leads;
drop policy if exists "leads: staff update" on public.leads;
drop policy if exists "leads: staff delete" on public.leads;
create policy "leads: commercial" on public.leads for all to authenticated
using (public.has_section('leads')) with check (public.has_section('leads'));
drop policy if exists "car_views: public insert" on public.car_views;
drop policy if exists "car_views: staff read" on public.car_views;
create policy "views: analytics" on public.car_views for select to authenticated using (public.has_section('carros'));
drop policy if exists "testimonials: public submit" on public.testimonials;
drop policy if exists "testimonials: public read" on public.testimonials;
drop policy if exists "testimonials: staff write" on public.testimonials;
create policy "testimonials: read" on public.testimonials for select using (published or public.has_section('testemunhos'));
create policy "testimonials: write" on public.testimonials for all to authenticated
using (public.has_section('testemunhos')) with check (public.has_section('testemunhos'));
drop policy if exists "vehicle_tasks: staff all" on public.vehicle_tasks;
create policy "tasks: workshop" on public.vehicle_tasks for all to authenticated
using (public.has_section('oficina')) with check (public.has_section('oficina'));
-- Drop all old content write policies irrespective of their original name.
do $$ declare p record; begin
 for p in select policyname from pg_policies where schemaname='public' and tablename='site_content' and cmd <> 'SELECT' loop
 execute format('drop policy %I on public.site_content',p.policyname); end loop;
end $$;
create policy "content: editor" on public.site_content for all to authenticated
using (public.has_section('pagina-inicial')) with check (public.has_section('pagina-inicial'));

-- Draft intake can have unknown specifications. A published car cannot.
alter table public.cars alter column year drop not null;
alter table public.cars alter column fuel drop not null;
alter table public.cars alter column transmission drop not null;
alter table public.cars alter column body drop not null;
alter table public.cars add constraint complete_public_car check
(status = 'draft' or (year is not null and fuel is not null and transmission is not null and body is not null and model <> '—')) not valid;

alter table public.leads add column assigned_to uuid references public.profiles(id) on delete set null;
alter table public.leads add column next_action text;
alter table public.leads add column next_action_at timestamptz;
alter table public.leads add column loss_reason text;
alter table public.leads add column first_contacted_at timestamptz;
create index leads_followup_idx on public.leads(next_action_at) where status in ('new','contacted','proposal');
create index leads_assignee_idx on public.leads(assigned_to);
create table public.lead_activities (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade,
 kind text not null check(kind in ('call','message','proposal','visit','note')),
 body text not null check(length(body) between 1 and 4000), created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.lead_activities enable row level security;
create policy "activities: read" on public.lead_activities for select to authenticated using (public.has_section('leads'));
create policy "activities: append" on public.lead_activities for insert to authenticated
with check (public.has_section('leads') and created_by = auth.uid());
create index on public.lead_activities(lead_id,created_at desc);

-- Private financial data must never live on the publicly readable cars row.
create table public.vehicle_financials (
 car_id uuid primary key references public.cars(id) on delete cascade,
 acquired_on date, purchase_price numeric(12,2) check(purchase_price >= 0),
 sale_lead_id uuid unique references public.leads(id),
 sale_price numeric(12,2) check(sale_price >= 0), sold_on date,
 updated_at timestamptz not null default now()
);
create table public.vehicle_costs (
 id uuid primary key default gen_random_uuid(), car_id uuid not null references public.cars(id) on delete cascade,
 category text not null check(category in ('transport','parts','labour','preparation','other')),
 description text not null check(length(description) between 1 and 500),
 amount numeric(12,2) not null check(amount > 0), incurred_on date not null default current_date,
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create index on public.vehicle_costs(car_id);
alter table public.vehicle_financials enable row level security;
alter table public.vehicle_costs enable row level security;
create policy "financials: finance" on public.vehicle_financials for all to authenticated
using(public.has_section('financeiro')) with check(public.has_section('financeiro'));
create policy "costs: finance" on public.vehicle_costs for all to authenticated
using(public.has_section('financeiro')) with check(public.has_section('financeiro'));

create table public.preparation_tasks (
 id uuid primary key default gen_random_uuid(), car_id uuid not null references public.cars(id) on delete cascade,
 title text not null check(length(title) between 1 and 200),
 stage text not null default 'preparation' check(stage in ('preparation','delivery')),
 status text not null default 'pending' check(status in ('pending','in_progress','waiting_parts','done')),
 assigned_to uuid references public.profiles(id) on delete set null,
 parts text, due_on date, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.preparation_tasks(car_id);
alter table public.preparation_tasks enable row level security;
create policy "preparation: operations" on public.preparation_tasks for all to authenticated
using(public.has_section('oficina') or public.has_section('carros'))
with check(public.has_section('oficina') or public.has_section('carros'));

create table public.reservations (
 id uuid primary key default gen_random_uuid(), car_id uuid not null references public.cars(id),
 lead_id uuid not null references public.leads(id), expires_at timestamptz not null,
 status text not null default 'active' check(status in ('active','cancelled','expired','completed')),
 deposit_amount numeric(12,2) not null default 0 check(deposit_amount >= 0),
 deposit_received boolean not null default false,
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);
create unique index one_active_reservation on public.reservations(car_id) where status = 'active';
alter table public.reservations enable row level security;
create policy "reservations: read" on public.reservations for select to authenticated using(public.has_section('leads'));
-- Writes exclusively through transactional RPCs below.

create table public.audit_log (
 id bigint generated always as identity primary key, entity text not null, record_id text not null,
 action text not null, actor_id uuid, changed_fields jsonb not null, created_at timestamptz not null default now()
);
create index on public.audit_log(entity,record_id,created_at desc);
alter table public.audit_log enable row level security;
create policy "audit: read" on public.audit_log for select to authenticated using (
 public.is_admin() or (entity in ('cars','preparation_tasks') and public.has_section('carros')) or
 (entity in ('leads','reservations') and public.has_section('leads')) or
 (entity in ('vehicle_financials','vehicle_costs') and public.has_section('financeiro')) or
 (entity in ('vehicle_tasks','preparation_tasks') and public.has_section('oficina')));
create function public.audit_change() returns trigger language plpgsql security definer set search_path=public as $$
declare before_row jsonb := '{}'::jsonb; after_row jsonb := '{}'::jsonb; diff jsonb;
begin
 if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
 if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
 select coalesce(jsonb_object_agg(k,jsonb_build_object('before',before_row->k,'after',after_row->k)),'{}') into diff
 from (select jsonb_object_keys(before_row || after_row) k) keys
 where k <> 'updated_at' and before_row->k is distinct from after_row->k;
 if diff <> '{}'::jsonb then
 insert into public.audit_log(entity,record_id,action,actor_id,changed_fields)
 values(tg_table_name,case when tg_table_name in ('vehicle_financials','vehicle_costs','preparation_tasks','vehicle_tasks') then coalesce(after_row->>'car_id',before_row->>'car_id') else coalesce(after_row->>'id',before_row->>'id') end,tg_op,auth.uid(),diff);
 end if;
 return coalesce(new,old);
end $$;
do $$ declare t text; begin
 foreach t in array array['cars','leads','reservations','vehicle_financials','vehicle_costs','vehicle_tasks','preparation_tasks','profiles'] loop
 execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function public.audit_change()',t);
 end loop;
end $$;

-- Server-only counters: callers cannot reset their quota or bypass it via PostgREST.
create table public.submission_limits (key text primary key, window_start timestamptz not null, hits int not null);
alter table public.submission_limits enable row level security;
create function public.consume_submission(key_value text, max_hits int, window_seconds int) returns boolean
language plpgsql security definer set search_path=public as $$
declare n int;
begin
 insert into submission_limits as l(key,window_start,hits) values(key_value,now(),1)
 on conflict(key) do update set
 hits=case when l.window_start < now()-make_interval(secs=>window_seconds) then 1 else l.hits+1 end,
 window_start=case when l.window_start < now()-make_interval(secs=>window_seconds) then now() else l.window_start end returning hits into n;
 return n <= max_hits;
end $$;
revoke all on function public.consume_submission(text,int,int) from public,anon,authenticated;
grant execute on function public.consume_submission(text,int,int) to service_role;

create table public.notification_jobs (
 id uuid primary key default gen_random_uuid(), lead_id uuid not null unique references public.leads(id) on delete cascade,
 attempts int not null default 0, next_attempt_at timestamptz not null default now(),
 delivered_at timestamptz, last_error text, created_at timestamptz not null default now()
);
alter table public.notification_jobs enable row level security;
create policy "notifications: admin read" on public.notification_jobs for select to authenticated using(public.is_admin());
create function public.queue_lead_notification() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.notification_jobs(lead_id) values(new.id); return new; end $$;
create trigger queue_notification after insert on public.leads for each row execute function public.queue_lead_notification();

-- Recalculate hours at the database boundary; direct API writes cannot forge totals.
create function public.calculate_work_hours() returns trigger language plpgsql as $$
begin
 new.hours := case when new.end_time is null then 0 else round((mod(extract(epoch from (new.end_time-new.start_time))::numeric+86400,86400)/3600),2) end;
 new.updated_at := now(); return new;
end $$;
create trigger calculate_hours before insert or update on public.vehicle_tasks for each row execute function public.calculate_work_hours();

create function public.create_workshop_intake(vehicle_name text, plate text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid := gen_random_uuid();
begin
 if not public.has_section('oficina') then raise exception 'Sem permissão'; end if;
 if length(trim(vehicle_name)) not between 1 and 120 or length(trim(plate)) not between 2 and 20 then raise exception 'Dados inválidos'; end if;
 insert into public.cars(id,slug,make,model,year,license_plate,fuel,transmission,body,status,price_on_request,created_by)
 values(result,'oficina-'||result,trim(vehicle_name),'—',null,upper(trim(plate)),null,null,null,'draft',true,auth.uid());
 return result;
end $$;

create function public.reserve_vehicle(lead uuid, expiry timestamptz, deposit numeric) returns uuid
language plpgsql security definer set search_path=public as $$
declare vehicle uuid; current_status public.car_status; result uuid;
begin
 if not public.has_section('leads') or not public.has_section('carros') then raise exception 'É necessário acesso a contactos e viaturas'; end if;
 if expiry <= now() or expiry > now()+interval '30 days' or deposit < 0 then raise exception 'Prazo ou sinal inválido'; end if;
 select car_id into vehicle from public.leads where id=lead and status in ('new','contacted','proposal') for update;
 if vehicle is null then raise exception 'Associe uma viatura ao contacto'; end if;
 select status into current_status from public.cars where id=vehicle for update;
 if current_status <> 'published' then raise exception 'A viatura não está disponível'; end if;
 insert into public.reservations(car_id,lead_id,expires_at,deposit_amount,created_by) values(vehicle,lead,expiry,deposit,auth.uid()) returning id into result;
 update public.cars set status='reserved' where id=vehicle;
 return result;
end $$;

create function public.release_reservation(reservation_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare vehicle uuid;
begin
 if not public.has_section('leads') or not public.has_section('carros') then raise exception 'Sem permissão'; end if;
 select car_id into vehicle from public.reservations where id=reservation_id;
 perform 1 from public.cars where id=vehicle for update;
 update public.reservations set status='cancelled' where id=reservation_id and status='active';
 if not found then raise exception 'Reserva já terminada'; end if;
 update public.cars set status='published' where id=vehicle and status='reserved';
end $$;
create function public.confirm_reservation_deposit(reservation_id uuid) returns void
language plpgsql security definer set search_path=public as $$
begin
 if not public.has_section('leads') then raise exception 'Sem permissão'; end if;
 update public.reservations set deposit_received=true where id=reservation_id and status='active' and expires_at>now();
 if not found then raise exception 'Reserva não está ativa'; end if;
end $$;
create function public.expire_reservations() returns int
language plpgsql security definer set search_path=public as $$
declare expired_car record; n int:=0;
begin
 for expired_car in select c.id from public.cars c where exists(select 1 from public.reservations r where r.car_id=c.id and r.status='active' and r.expires_at<=now()) for update skip locked loop
 update public.reservations set status='expired' where car_id=expired_car.id and status='active' and expires_at<=now();
 if found then update public.cars set status='published' where id=expired_car.id and status='reserved'; n:=n+1; end if;
 end loop; return n;
end $$;
revoke all on function public.expire_reservations() from public,anon,authenticated;
grant execute on function public.expire_reservations() to service_role;

create function public.close_vehicle_sale(lead uuid, amount numeric, sale_date date) returns void
language plpgsql security definer set search_path=public as $$
declare vehicle uuid; current_status public.car_status;
begin
 if not public.has_section('leads') or not public.has_section('carros') or not public.has_section('financeiro') then raise exception 'É necessário acesso a contactos, viaturas e financeiro'; end if;
 if amount <= 0 or sale_date > current_date then raise exception 'Valor ou data inválida'; end if;
 select car_id into vehicle from public.leads where id=lead and status in ('new','contacted','proposal') for update;
 if vehicle is null then raise exception 'Associe uma viatura'; end if;
 select status into current_status from public.cars where id=vehicle for update;
 if current_status not in ('published','reserved') then raise exception 'Viatura indisponível'; end if;
 if exists(select 1 from public.reservations where car_id=vehicle and status='active' and lead_id<>lead) then raise exception 'Viatura reservada para outro contacto'; end if;
 update public.reservations set status='completed' where car_id=vehicle and status='active';
 update public.cars set status='sold',sold_at=sale_date::timestamptz where id=vehicle;
 insert into public.vehicle_financials(car_id,sale_price,sold_on,sale_lead_id) values(vehicle,amount,sale_date,lead)
 on conflict(car_id) do update set sale_price=excluded.sale_price,sold_on=excluded.sold_on,sale_lead_id=excluded.sale_lead_id,updated_at=now();
 update public.leads set status='won',next_action=null,next_action_at=null where id=lead;
end $$;

-- Prevent ordinary edits from bypassing an active reservation.
create function public.protect_reserved_car() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.status is distinct from old.status and exists(select 1 from public.reservations where car_id=old.id and status='active') and new.status <> 'reserved' then
 raise exception 'Termine a reserva antes de alterar a disponibilidade'; end if;
 return new;
end $$;
create trigger protect_reservation before update on public.cars for each row execute function public.protect_reserved_car();

create function public.staff_directory() returns table(id uuid, full_name text, role text)
language sql stable security definer set search_path=public as $$
 select p.id,coalesce(p.full_name,p.email,'Utilizador'),p.role::text from public.profiles p
 where public.has_section('leads') or public.has_section('oficina') or public.has_section('carros');
$$;
-- Safe counts, aggregated before API row limits. Respect the caller's table RLS.
create function public.analytics_summary() returns jsonb language sql stable security invoker set search_path=public as $$
 select jsonb_build_object(
 'views', (select count(*) from public.car_views),
 'month_views',(select count(*) from public.car_views where created_at>=date_trunc('month',now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon'),
 'leads',(select count(*) from public.leads),
 'new_leads',(select count(*) from public.leads where status='new'),
 'by_car',coalesce((select jsonb_agg(x) from (select c.id,
 (select count(*) from public.car_views v where v.car_id=c.id) as views,
 (select count(*) from public.leads l where l.car_id=c.id) as leads from public.cars c) x),'[]'::jsonb));
$$;
-- Every client RPC is explicit; trigger functions need no public execution.
do $$ declare signature text; begin
 foreach signature in array array['create_workshop_intake(text,text)','reserve_vehicle(uuid,timestamptz,numeric)','release_reservation(uuid)','confirm_reservation_deposit(uuid)','close_vehicle_sale(uuid,numeric,date)','staff_directory()','analytics_summary()'] loop
 execute 'revoke all on function public.'||signature||' from public,anon';
 execute 'grant execute on function public.'||signature||' to authenticated';
 end loop;
end $$;
grant select,insert,update,delete on public.lead_activities,public.vehicle_financials,public.vehicle_costs,public.preparation_tasks,public.reservations,public.audit_log,public.notification_jobs,public.submission_limits to authenticated,service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;

create function public.validate_lead_followup() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if tg_op='UPDATE' then
   if new.car_id is distinct from old.car_id and (old.status='won' or exists(select 1 from public.reservations where lead_id=old.id and status='active')) then raise exception 'Não pode trocar a viatura de uma reserva ativa ou venda concluída'; end if;
   if old.status='won' and new.status<>'won' then raise exception 'A venda já está concluída'; end if;
 end if;
 if new.status='won' and new.car_id is not null and not exists(select 1 from public.vehicle_financials f join public.cars c on c.id=f.car_id where f.car_id=new.car_id and f.sale_lead_id=new.id and f.sale_price is not null and c.status='sold') then raise exception 'Conclua a venda com o preço efetivo'; end if;
 if new.status='lost' and nullif(trim(new.loss_reason),'') is null then raise exception 'Indique o motivo de perda'; end if;
 if new.status in ('contacted','proposal','won') and new.first_contacted_at is null then new.first_contacted_at:=now(); end if;
 if new.status in ('won','lost','closed') then new.next_action:=null; new.next_action_at:=null; end if;
 if (new.next_action_at is null) <> (nullif(trim(new.next_action),'') is null) then raise exception 'Preencha ação e data'; end if;
 return new;
end $$;
create trigger validate_followup before insert or update on public.leads for each row execute function public.validate_lead_followup();
create or replace function public.cars_status_timestamps() returns trigger language plpgsql as $$
begin
 if new.status='published' and old.status is distinct from 'published' and new.published_at is null then new.published_at:=now(); end if;
 if new.status='sold' and old.status is distinct from 'sold' and new.sold_at is not distinct from old.sold_at then new.sold_at:=now(); end if;
 return new;
end $$;

create function public.claim_notification_jobs() returns setof public.notification_jobs language sql security definer set search_path=public as $$
 update public.notification_jobs set attempts=attempts+1,next_attempt_at=now()+interval '2 minutes'
 where id in (select id from public.notification_jobs where delivered_at is null and attempts<8 and next_attempt_at<=now() order by created_at limit 3 for update skip locked)
 returning *;
$$;
create function public.prune_submission_limits() returns void language sql security definer set search_path=public as $$
 delete from public.submission_limits where window_start<now()-interval '1 day';
$$;
revoke all on function public.claim_notification_jobs(),public.prune_submission_limits() from public,anon,authenticated;
grant execute on function public.claim_notification_jobs(),public.prune_submission_limits() to service_role;
commit;
