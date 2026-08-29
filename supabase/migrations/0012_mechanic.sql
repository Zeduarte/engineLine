-- ===========================================================================
-- 0012_mechanic.sql
-- Papel "mecanico" + registo de HORAS de oficina por viatura.
--
--  - O mecânico vê todas as viaturas (via is_staff) mas só o separador
--    "Oficina".
--  - Cada registo tem data + hora de início + hora de fim; as horas são
--    calculadas. Liga-se à viatura por car_id (a viatura guarda a matrícula
--    única em license_plate).
-- ===========================================================================

-- ALTER TYPE ... ADD VALUE tem de ser instrução isolada no editor SQL.
alter type public.user_role add value if not exists 'mecanico';

create table if not exists public.vehicle_tasks (
  id          uuid primary key default gen_random_uuid(),
  car_id      uuid not null references public.cars(id) on delete cascade,
  work_date   date not null default current_date,
  start_time  time not null,
  end_time    time,
  description text,
  hours       numeric(6,2) not null default 0 check (hours >= 0),
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Compatibilidade: se uma versão anterior (com title/done/notes) já existir,
-- ajusta as colunas para o novo formato de registo de horas.
alter table public.vehicle_tasks add column if not exists work_date  date not null default current_date;
alter table public.vehicle_tasks add column if not exists start_time time;
alter table public.vehicle_tasks add column if not exists end_time   time;
alter table public.vehicle_tasks add column if not exists description text;
alter table public.vehicle_tasks drop column if exists title;
alter table public.vehicle_tasks drop column if exists done;
alter table public.vehicle_tasks drop column if exists notes;

create index if not exists vehicle_tasks_car_id_idx
  on public.vehicle_tasks(car_id);

alter table public.vehicle_tasks enable row level security;

drop policy if exists "vehicle_tasks: staff all" on public.vehicle_tasks;
create policy "vehicle_tasks: staff all"
  on public.vehicle_tasks for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());
