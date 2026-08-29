-- ===========================================================================
-- 0012_mechanic.sql
-- Papel "mecanico" + tabela de tarefas de oficina ligadas às viaturas.
--
--  - O mecânico vê todas as viaturas (via is_staff, que já cobre qualquer
--    utilizador com perfil) mas, na app, só o separador "Oficina".
--  - As tarefas ligam-se à viatura por car_id (a viatura guarda a matrícula
--    única em license_plate).
-- ===========================================================================

-- Nota: ALTER TYPE ... ADD VALUE tem de ser uma instrução isolada; corre bem
-- no editor SQL do Supabase.
alter type public.user_role add value if not exists 'mecanico';

create table if not exists public.vehicle_tasks (
  id          uuid primary key default gen_random_uuid(),
  car_id      uuid not null references public.cars(id) on delete cascade,
  title       text not null,
  notes       text,
  hours       numeric(6,2) not null default 0 check (hours >= 0),
  done        boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists vehicle_tasks_car_id_idx
  on public.vehicle_tasks(car_id);

alter table public.vehicle_tasks enable row level security;

-- Todo o staff (inclui o mecânico) pode gerir tarefas.
drop policy if exists "vehicle_tasks: staff all" on public.vehicle_tasks;
create policy "vehicle_tasks: staff all"
  on public.vehicle_tasks for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
