-- Keep the vehicle category across sales enquiries, workshop and reporting.
-- Older enquiries without a linked vehicle stay explicitly unclassified.
alter table public.leads add column vehicle_type text check (vehicle_type in ('car','motorcycle'));
update public.leads l set vehicle_type=c.vehicle_type from public.cars c where c.id=l.car_id;
create index cars_vehicle_type_status_idx on public.cars(vehicle_type,status);
create index leads_vehicle_type_created_idx on public.leads(vehicle_type,created_at desc);

create function public.sync_lead_vehicle_type() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.car_id is not null then
    select vehicle_type into new.vehicle_type from public.cars where id=new.car_id;
  end if;
  return new;
end $$;
revoke all on function public.sync_lead_vehicle_type() from public;
create trigger leads_vehicle_type before insert or update of car_id,vehicle_type on public.leads
for each row execute function public.sync_lead_vehicle_type();

create function public.sync_car_lead_types() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  update public.leads set vehicle_type=new.vehicle_type where car_id=new.id;
  return new;
end $$;
revoke all on function public.sync_car_lead_types() from public;
create trigger cars_lead_types after update of vehicle_type on public.cars
for each row when (old.vehicle_type is distinct from new.vehicle_type) execute function public.sync_car_lead_types();

create function public.create_workshop_intake_for_type(vehicle_name text,plate text,selected_type text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid := gen_random_uuid();
begin
  if not public.has_section('oficina') then raise exception 'Sem permissão'; end if;
  if selected_type is null or selected_type not in ('car','motorcycle') then raise exception 'Tipo inválido'; end if;
  if vehicle_name is null or plate is null or length(trim(vehicle_name)) not between 1 and 120 or length(trim(plate)) not between 2 and 20 then raise exception 'Dados inválidos'; end if;
  insert into public.cars(id,slug,make,model,year,license_plate,fuel,transmission,body,status,price_on_request,created_by,vehicle_type,doors,seats)
  values(result,'oficina-'||result,trim(vehicle_name),'—',null,upper(trim(plate)),null,null,null,'draft',true,auth.uid(),selected_type,case when selected_type='motorcycle' then 0 else null end,case when selected_type='motorcycle' then 2 else null end);
  return result;
end $$;
revoke all on function public.create_workshop_intake_for_type(text,text,text) from public;
grant execute on function public.create_workshop_intake_for_type(text,text,text) to authenticated;

create function public.analytics_summary_by_type(selected_type text) returns jsonb
language sql stable security invoker set search_path=public as $$
 select jsonb_build_object(
  'views',(select count(*) from public.car_views v join public.cars c on c.id=v.car_id where c.vehicle_type=selected_type),
  'month_views',(select count(*) from public.car_views v join public.cars c on c.id=v.car_id where c.vehicle_type=selected_type and v.created_at>=date_trunc('month',now() at time zone 'Europe/Lisbon') at time zone 'Europe/Lisbon'),
  'leads',(select count(*) from public.leads where vehicle_type=selected_type),
  'new_leads',(select count(*) from public.leads where vehicle_type=selected_type and status='new'),
  'by_car',coalesce((select jsonb_agg(x) from (select c.id,
    (select count(*) from public.car_views v where v.car_id=c.id) as views,
    (select count(*) from public.leads l where l.car_id=c.id) as leads
    from public.cars c where c.vehicle_type=selected_type) x),'[]'::jsonb)
 );
$$;
revoke all on function public.analytics_summary_by_type(text) from public;
grant execute on function public.analytics_summary_by_type(text) to authenticated;
