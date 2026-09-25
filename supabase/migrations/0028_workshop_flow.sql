-- Fluxo oficina → viaturas (usa os estados criados na 0027).
--
--  1. O que se regista na oficina entra "Na oficina" (antes entrava em
--     rascunho e aparecia logo em Viaturas).
--  2. Quem tem a Oficina dá-a como preparada → "Preparado", e passa a aparecer
--     em Viaturas.
--  3. Uma viatura preparada (ou em rascunho) pode voltar para a oficina.
--
-- As mudanças 2 e 3 passam por funções, porque o mecânico não tem permissão de
-- escrita na tabela `cars` (só quem tem o separador Viaturas a tem).

-- Enquanto está na oficina ou preparada, a ficha pode estar incompleta — como
-- no rascunho. Publicar continua a exigir os dados todos.
alter table public.cars drop constraint if exists complete_public_car;
alter table public.cars add constraint complete_public_car check
(status in ('workshop', 'draft', 'prepared') or (year is not null and fuel is not null and transmission is not null and body is not null and model <> '—')) not valid;

create or replace function public.create_workshop_intake(vehicle_name text, plate text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid := gen_random_uuid();
begin
 if not public.has_section('oficina') then raise exception 'Sem permissão'; end if;
 if length(trim(vehicle_name)) not between 1 and 120 or length(trim(plate)) not between 2 and 20 then raise exception 'Dados inválidos'; end if;
 insert into public.cars(id,slug,make,model,year,license_plate,fuel,transmission,body,status,price_on_request,created_by)
 values(result,'oficina-'||result,trim(vehicle_name),'—',null,upper(trim(plate)),null,null,null,'workshop',true,auth.uid());
 return result;
end $$;

create or replace function public.create_workshop_intake_for_type(vehicle_name text,plate text,selected_type text) returns uuid
language plpgsql security definer set search_path=public as $$
declare result uuid := gen_random_uuid();
begin
  if not public.has_section('oficina') then raise exception 'Sem permissão'; end if;
  if selected_type is null or selected_type not in ('car','motorcycle') then raise exception 'Tipo inválido'; end if;
  if vehicle_name is null or plate is null or length(trim(vehicle_name)) not between 1 and 120 or length(trim(plate)) not between 2 and 20 then raise exception 'Dados inválidos'; end if;
  insert into public.cars(id,slug,make,model,year,license_plate,fuel,transmission,body,status,price_on_request,created_by,vehicle_type,doors,seats)
  values(result,'oficina-'||result,trim(vehicle_name),'—',null,upper(trim(plate)),null,null,null,'workshop',true,auth.uid(),selected_type,case when selected_type='motorcycle' then 0 else null end,case when selected_type='motorcycle' then 2 else null end);
  return result;
end $$;

-- Oficina → Preparado.
create or replace function public.mark_vehicle_prepared(vehicle uuid) returns void
language plpgsql security definer set search_path=public as $$
declare current_status public.car_status; vtype text;
begin
  if not public.has_section('oficina') then raise exception 'Sem permissão'; end if;
  select status, vehicle_type into current_status, vtype from public.cars where id = vehicle for update;
  if not found then raise exception 'Viatura não encontrada'; end if;
  if not public.has_vehicle_type_for(auth.uid(), vtype) then raise exception 'Sem permissão'; end if;
  if current_status <> 'workshop' then raise exception 'A viatura não está na oficina'; end if;
  update public.cars set status = 'prepared' where id = vehicle;
end $$;
revoke all on function public.mark_vehicle_prepared(uuid) from public, anon;
grant execute on function public.mark_vehicle_prepared(uuid) to authenticated;

-- Preparado (ou rascunho) → volta para a oficina.
create or replace function public.return_vehicle_to_workshop(vehicle uuid) returns void
language plpgsql security definer set search_path=public as $$
declare current_status public.car_status; vtype text;
begin
  if not (public.has_section('oficina') or public.has_section('carros')) then raise exception 'Sem permissão'; end if;
  select status, vehicle_type into current_status, vtype from public.cars where id = vehicle for update;
  if not found then raise exception 'Viatura não encontrada'; end if;
  if not public.has_vehicle_type_for(auth.uid(), vtype) then raise exception 'Sem permissão'; end if;
  if current_status not in ('prepared', 'draft') then
    raise exception 'Só uma viatura preparada ou em rascunho pode voltar para a oficina';
  end if;
  update public.cars set status = 'workshop' where id = vehicle;
end $$;
revoke all on function public.return_vehicle_to_workshop(uuid) from public, anon;
grant execute on function public.return_vehicle_to_workshop(uuid) to authenticated;

-- As viaturas registadas na oficina que ninguém completou (modelo ainda "—")
-- continuam na oficina: saem de Viaturas até serem dadas como preparadas.
update public.cars set status = 'workshop'
where status = 'draft' and slug like 'oficina-%' and model = '—';
