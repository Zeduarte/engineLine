-- Perfil pessoal e gestão de férias.
--
-- Cada colaborador passa a ter dados próprios (contacto, data de nascimento,
-- função) e um plano de férias por ano. Os colegas veem quem está fora, mas
-- não veem saldos nem dados pessoais uns dos outros.
begin;

-- ---------------------------------------------------------------------------
-- Perfil: dados que o próprio mantém
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text,
  add column if not exists birth_date date,
  add column if not exists job_title text;

comment on column public.profiles.birth_date is
  'Usada para o dia de aniversário nas férias; o dia e mês bastam.';

-- Quem é chefe ou administrador aprova pedidos de férias.
create or replace function public.can_approve_leave() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role::text in ('admin', 'chefe') from public.profiles where id = auth.uid()),
    false);
$$;
revoke all on function public.can_approve_leave() from public;
grant execute on function public.can_approve_leave() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Dias especiais da empresa (além dos feriados nacionais, que são calculados)
-- ---------------------------------------------------------------------------
create table if not exists public.company_days (
  id    uuid primary key default gen_random_uuid(),
  day   date not null,
  -- holiday: feriado municipal ou outro; tolerance: tolerância de ponto;
  -- mandatory: dia de fecho obrigatório, descontado no saldo.
  kind  text not null check (kind in ('holiday', 'tolerance', 'mandatory')),
  label text not null default '',
  unique (day, kind)
);
alter table public.company_days enable row level security;

drop policy if exists "company_days: staff read" on public.company_days;
create policy "company_days: staff read"
  on public.company_days for select to authenticated
  using (public.is_staff());

drop policy if exists "company_days: settings write" on public.company_days;
create policy "company_days: settings write"
  on public.company_days for all to authenticated
  using (public.has_section('definicoes'))
  with check (public.has_section('definicoes'));

-- ---------------------------------------------------------------------------
-- Saldo anual. Sem linha, aplicam-se os valores por defeito (22 + 0 + 1).
-- ---------------------------------------------------------------------------
create table if not exists public.leave_balances (
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  year         int  not null check (year between 2000 and 2100),
  base_days    numeric(4,1) not null default 22 check (base_days between 0 and 60),
  carried_days numeric(4,1) not null default 0  check (carried_days between 0 and 60),
  birthday_day numeric(2,1) not null default 1  check (birthday_day in (0, 1)),
  updated_at   timestamptz not null default now(),
  primary key (profile_id, year)
);
alter table public.leave_balances enable row level security;

-- O saldo é pessoal: cada um vê o seu; quem aprova vê todos.
drop policy if exists "leave_balances: read own or approver" on public.leave_balances;
create policy "leave_balances: read own or approver"
  on public.leave_balances for select to authenticated
  using (profile_id = auth.uid() or public.can_approve_leave());

drop policy if exists "leave_balances: approver writes" on public.leave_balances;
create policy "leave_balances: approver writes"
  on public.leave_balances for all to authenticated
  using (public.can_approve_leave())
  with check (public.can_approve_leave());

-- ---------------------------------------------------------------------------
-- Dias marcados
-- ---------------------------------------------------------------------------
create table if not exists public.leave_days (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  day         date not null,
  -- Meio dia conta 0,5 no saldo.
  half        boolean not null default false,
  -- draft: ainda por submeter; pending: à espera de decisão.
  status      text not null default 'draft'
              check (status in ('draft', 'pending', 'approved', 'rejected')),
  note        text not null default '',
  decided_by  uuid references public.profiles(id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (profile_id, day)
);
create index if not exists leave_days_day_idx on public.leave_days(day);
create index if not exists leave_days_profile_year_idx
  on public.leave_days(profile_id, day);

drop trigger if exists trg_leave_days_updated_at on public.leave_days;
create trigger trg_leave_days_updated_at
  before update on public.leave_days
  for each row execute function public.set_updated_at();

alter table public.leave_days enable row level security;

-- Os colegas veem os dias uns dos outros — é para isso que serve o mapa de
-- equipa. O que não é partilhado (saldos, notas de decisão) vive noutras
-- colunas e tabelas, e a aplicação não as mostra a quem não é o próprio.
drop policy if exists "leave_days: staff read" on public.leave_days;
create policy "leave_days: staff read"
  on public.leave_days for select to authenticated
  using (public.is_staff());

-- Cada um marca e apaga os seus dias, enquanto não estiverem decididos.
drop policy if exists "leave_days: own insert" on public.leave_days;
create policy "leave_days: own insert"
  on public.leave_days for insert to authenticated
  with check (profile_id = auth.uid() and status in ('draft', 'pending'));

drop policy if exists "leave_days: own update" on public.leave_days;
create policy "leave_days: own update"
  on public.leave_days for update to authenticated
  using (
    (profile_id = auth.uid() and status in ('draft', 'pending'))
    or public.can_approve_leave()
  )
  with check (profile_id = auth.uid() or public.can_approve_leave());

drop policy if exists "leave_days: own delete" on public.leave_days;
create policy "leave_days: own delete"
  on public.leave_days for delete to authenticated
  using (
    (profile_id = auth.uid() and status in ('draft', 'pending'))
    or public.can_approve_leave()
  );

-- Lista de colegas para o mapa de equipa: nome e id, nada mais.
create or replace function public.leave_directory()
returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select p.id, coalesce(nullif(p.full_name, ''), p.email, 'Utilizador')
  from public.profiles p
  where public.is_staff()
  order by 2;
$$;
revoke all on function public.leave_directory() from public;
grant execute on function public.leave_directory() to authenticated, service_role;

commit;
