-- Dono da conta: o único administrador que pode gerir os outros administradores.
--
-- Entre administradores ninguém mexe em ninguém (mesmo nível). Sem um dono,
-- um admin que se fosse embora não podia ser despromovido nem apagado a partir
-- do backoffice. O dono resolve isso sem dar esse poder a todos os admins.
--
-- A coluna só é escrita pelo servidor (service_role): o `authenticated` só tem
-- `update` em full_name, phone, birth_date e job_title (0013/0023), por isso
-- ninguém se promove a dono pelo browser.

alter table public.profiles
  add column if not exists is_owner boolean not null default false;

-- No máximo um dono.
create unique index if not exists profiles_single_owner_idx
  on public.profiles ((true)) where is_owner;

-- O primeiro administrador criado fica dono, se ainda não houver nenhum.
update public.profiles
set is_owner = true
where id = (
  select id from public.profiles
  where role = 'admin'
  order by created_at
  limit 1
)
and not exists (select 1 from public.profiles where is_owner);
