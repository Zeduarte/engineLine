-- Novos campos opcionais: os anúncios existentes mantêm os dados atuais.
alter type public.body_type add value if not exists 'Scooter';
alter type public.body_type add value if not exists 'Naked';
alter type public.body_type add value if not exists 'Desportiva';
alter type public.body_type add value if not exists 'Trail';
alter type public.body_type add value if not exists 'Touring';
alter type public.body_type add value if not exists 'Chopper/Cruiser';
alter type public.body_type add value if not exists 'Enduro';
alter table public.cars add column if not exists registration_month integer check (registration_month between 1 and 12);
alter table public.cars add column if not exists vehicle_type text not null default 'car' check (vehicle_type in ('car','motorcycle'));
alter table public.cars add column if not exists point_of_sale_id text;
alter table public.cars drop constraint if exists cars_doors_check;
alter table public.cars add constraint cars_doors_check check (doors between 0 and 9 and (vehicle_type = 'motorcycle' or doors >= 1));
-- Comparação textual evita usar os novos valores enum antes do COMMIT.
alter table public.cars add constraint cars_vehicle_category_check check (
 body is null or ((vehicle_type = 'motorcycle') = (body::text in ('Scooter','Naked','Desportiva','Trail','Touring','Chopper/Cruiser','Enduro')))
);
alter table public.cars add constraint cars_motorcycle_doors_check check (vehicle_type <> 'motorcycle' or doors = 0);
insert into public.site_content(key,content) values ('showroom','{}'::jsonb) on conflict(key) do nothing;

-- Serializa alterações de locais e associações, incluindo viaturas ocultas por RLS.
create function public.validate_showroom_location() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare cfg jsonb;
begin
  if tg_table_name = 'cars' then
    if new.point_of_sale_id is null then return new; end if;
    select content into cfg from public.site_content where key = 'showroom' for update;
    if not exists (select 1 from jsonb_array_elements(coalesce(cfg->'locations','[]'::jsonb)) p where p->>'id' = new.point_of_sale_id) then
      raise exception 'Ponto de venda inexistente';
    end if;
    return new;
  end if;
  if old.key <> 'showroom' then return new; end if;
  if tg_op = 'DELETE' then cfg := '{}'::jsonb;
  elsif new.key <> 'showroom' then cfg := '{}'::jsonb; else cfg := new.content; end if;
  if exists (select 1 from public.cars c where c.point_of_sale_id is not null and not exists
    (select 1 from jsonb_array_elements(coalesce(cfg->'locations','[]'::jsonb)) p where p->>'id' = c.point_of_sale_id)) then
    raise exception 'Reatribua as viaturas antes de remover o ponto de venda';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.validate_showroom_location() from public;
create trigger validate_car_location before insert or update of point_of_sale_id on public.cars
for each row execute function public.validate_showroom_location();
create trigger protect_showroom_locations before update or delete on public.site_content
for each row execute function public.validate_showroom_location();
