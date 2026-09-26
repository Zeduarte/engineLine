-- Separador "Horas": cada utilizador regista as suas horas e tarefas.
--
-- As horas feitas numa viatura já vivem em `vehicle_tasks` (com `created_by`)
-- e aparecem sozinhas nas Horas de quem as registou. Esta tabela guarda o
-- resto: trabalho que não é numa viatura (limpeza, atendimento, recados…).
--
-- Cada um só vê e mexe nas suas; o administrador vê e corrige as de todos.

create table if not exists public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  work_date   date not null default current_date,
  start_time  time not null,
  end_time    time,
  hours       numeric(6,2) not null default 0 check (hours >= 0),
  description text not null check (length(trim(description)) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists time_entries_profile_date_idx on public.time_entries(profile_id, work_date);

-- As horas calculam-se na BD, como nas viaturas: um pedido direto à API não
-- consegue gravar um total inventado.
drop trigger if exists calculate_hours on public.time_entries;
create trigger calculate_hours before insert or update on public.time_entries
for each row execute function public.calculate_work_hours();

alter table public.time_entries enable row level security;
revoke all on public.time_entries from anon;
grant select, insert, update, delete on public.time_entries to authenticated;

drop policy if exists "time: read" on public.time_entries;
create policy "time: read" on public.time_entries for select to authenticated
using (profile_id = auth.uid() or public.is_admin());

-- Só se regista em nome próprio.
drop policy if exists "time: insert" on public.time_entries;
create policy "time: insert" on public.time_entries for insert to authenticated
with check (profile_id = auth.uid());

drop policy if exists "time: update" on public.time_entries;
create policy "time: update" on public.time_entries for update to authenticated
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "time: delete" on public.time_entries;
create policy "time: delete" on public.time_entries for delete to authenticated
using (profile_id = auth.uid() or public.is_admin());
