-- Ordens do backoffice vindas do WhatsApp.
--
-- O colaborador manda uma mensagem ("coloca uma despesa de 450 de embraiagem ao
-- bmw 320") e o sistema registra-a na oficina ou nos custos. O que se resolve
-- aqui é o problema de fundo desse canal: QUEM escreve na base de dados.
--
-- Um webhook não tem sessão Supabase, logo `auth.uid()` é nulo. E tudo o que
-- protege estas tabelas depende dele: `has_section()` decide por `auth.uid()`, a
-- RLS de vehicle_costs/vehicle_tasks/cars está construída sobre `has_section()`,
-- e o gatilho `audit_change()` grava `actor_id := auth.uid()`. Escrever com a
-- chave de serviço resolveria o acesso ao preço de saltar a RLS e de gravar
-- auditoria sem autor — as duas coisas que não se podem perder num canal que
-- mexe em dinheiro.
--
-- A solução tem duas metades que NÃO se devem confundir:
--
--   Autorização  → sempre com o id explícito do colaborador
--                  (`has_section_for(actor, …)`), nunca com `auth.uid()`.
--   Atribuição   → assume-se a identidade da pessoa dentro da transacção, para
--                  que o histórico da viatura mostre quem deu a ordem.
--
-- Separá-las é o ponto: se a autorização dependesse da impersonação, uma falha
-- da impersonação abriria a porta em vez de a fechar.
--
-- Saída de emergência, se algum dia a impersonação deixar de ser possível:
-- assinar aqui um JWT curto com o segredo do projecto e usar um cliente
-- autenticado normal. Faz a RLS aplicar-se inteira, mas dá ao webhook um
-- cliente de uso geral — tudo o que a pessoa pode fazer, um erro de código
-- passaria a poder fazer. Três verbos batem essa elegância.
begin;

-- ---------------------------------------------------------------------------
-- Permissões com o id explícito
-- ---------------------------------------------------------------------------

-- O MESMO `case` que a 0013 já tinha, agora parametrizado pelo utilizador. A
-- regra continua a existir numa só cópia em SQL.
create or replace function public.has_section_for(uid uuid, section text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select case
    when role::text = 'admin' then true
    when role::text = 'mecanico' then section = 'oficina'
    when section = 'dashboard' then true
    when cardinality(allowed_sections) > 0 then section = any(allowed_sections)
    when role::text = 'chefe' then section = any(array['carros','pagina-inicial','leads','testemunhos','financeiro'])
    when role::text = 'vendedor' then section = any(array['carros','leads'])
    else false end from public.profiles where id = uid), false);
$$;
revoke all on function public.has_section_for(uuid, text) from public, anon;
grant execute on function public.has_section_for(uuid, text) to authenticated, service_role;

-- `has_section` passa a invólucro: mesma assinatura, mesmas políticas RLS, zero
-- duplicação da regra.
create or replace function public.has_section(section text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_section_for(auth.uid(), section);
$$;

-- A permissão de tipo de viatura só existia em TypeScript (`effectiveVehicleTypes`),
-- por isso não protegia nada que escrevesse com a chave de serviço. Nulo ou vazio
-- = sem restrição, como no TypeScript.
create or replace function public.has_vehicle_type_for(uid uuid, vtype text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role::text = 'admin'
    or allowed_vehicle_types is null
    or cardinality(allowed_vehicle_types) = 0
    or vtype = any(allowed_vehicle_types)
    from public.profiles where id = uid), false);
$$;
revoke all on function public.has_vehicle_type_for(uuid, text) from public, anon;
grant execute on function public.has_vehicle_type_for(uuid, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- A porta única das escritas vindas do WhatsApp
-- ---------------------------------------------------------------------------

create or replace function public.wa_begin_as(actor uuid, sections text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if actor is null then raise exception 'Ator em falta'; end if;
  if not exists (select 1 from public.profiles where id = actor) then
    raise exception 'Colaborador desconhecido';
  end if;
  -- Autoriza com o id explícito: basta uma das secções pedidas.
  if not exists (select 1 from unnest(sections) s where public.has_section_for(actor, s)) then
    raise exception 'Sem permissão';
  end if;

  -- Só agora se assume a identidade, e só nesta transacção (is_local = true).
  -- Definem-se os dois nomes porque não se sabe qual deles o `auth.uid()` da
  -- Supabase lê nesta versão — a função vive no esquema `auth`, que não é nosso.
  perform set_config('request.jwt.claim.sub', actor::text, true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', actor::text, 'role', 'authenticated')::text, true);

  -- E verifica-se. Sem isto, o modo de falha mais provável de todo este desenho
  -- — o `auth.uid()` ler um nome que não definimos — seria silencioso e
  -- produziria exactamente a auditoria sem autor que isto existe para evitar.
  if auth.uid() is distinct from actor then
    raise exception 'Falha ao assumir a identidade do colaborador';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Escritas: três verbos, nada mais
-- ---------------------------------------------------------------------------

create or replace function public.wa_create_workshop_vehicle(
  actor uuid, vehicle_name text, plate text, selected_type text) returns uuid
language plpgsql security definer set search_path = public as $$
begin
  perform public.wa_begin_as(actor, array['oficina']);
  if not public.has_vehicle_type_for(actor, selected_type) then
    raise exception 'Sem acesso a este tipo de viatura';
  end if;
  -- Delega na RPC de 0019, que já usa auth.uid() e has_section por dentro — e a
  -- partir do wa_begin_as os dois dizem o que queremos. Nada é duplicado.
  return public.create_workshop_intake_for_type(vehicle_name, plate, selected_type);
end $$;

create or replace function public.wa_add_cost(
  actor uuid, car uuid, kind text, note text, value numeric, incurred date)
returns uuid language plpgsql security definer set search_path = public as $$
declare novo uuid; vtype text;
begin
  -- Material basta a Oficina; mão de obra, transporte e preparação são dinheiro
  -- de gestão e exigem Financeiro. Espelha a regra que `addWorkshopCost` já
  -- aplica no backoffice.
  if kind in ('parts', 'other') then
    perform public.wa_begin_as(actor, array['oficina', 'financeiro']);
  else
    perform public.wa_begin_as(actor, array['financeiro']);
  end if;

  if kind not in ('transport','parts','labour','preparation','other') then
    raise exception 'Categoria inválida';
  end if;
  if value is null or value <= 0 or value > 9999999 then
    raise exception 'Valor inválido';
  end if;
  if length(trim(coalesce(note, ''))) not between 1 and 500 then
    raise exception 'Descrição inválida';
  end if;
  if incurred is null or incurred > current_date
     or incurred < current_date - interval '1 year' then
    raise exception 'Data inválida';
  end if;

  select vehicle_type into vtype from public.cars where id = car;
  if vtype is null then raise exception 'Viatura inexistente'; end if;
  if not public.has_vehicle_type_for(actor, vtype) then
    raise exception 'Sem acesso a este tipo de viatura';
  end if;

  insert into public.vehicle_costs(car_id, category, description, amount, incurred_on, created_by)
  values (car, kind, trim(note), value, incurred, actor)
  returning id into novo;
  return novo;
end $$;

create or replace function public.wa_log_hours(
  actor uuid, car uuid, work_day date, starts time, ends time, note text)
returns uuid language plpgsql security definer set search_path = public as $$
declare novo uuid; vtype text;
begin
  perform public.wa_begin_as(actor, array['oficina']);
  if starts is null then raise exception 'Hora de início em falta'; end if;
  if ends is not null and ends = starts then raise exception 'Fim igual ao início'; end if;
  if work_day is null or work_day > current_date then raise exception 'Data inválida'; end if;

  select vehicle_type into vtype from public.cars where id = car;
  if vtype is null then raise exception 'Viatura inexistente'; end if;
  if not public.has_vehicle_type_for(actor, vtype) then
    raise exception 'Sem acesso a este tipo de viatura';
  end if;

  -- `hours` não é passado de propósito: o gatilho `calculate_work_hours` (0013)
  -- recalcula-o sempre a partir do início e do fim.
  insert into public.vehicle_tasks(car_id, work_date, start_time, end_time, description, created_by)
  values (car, work_day, starts, ends, nullif(trim(coalesce(note, '')), ''), actor)
  returning id into novo;
  return novo;
end $$;

-- ---------------------------------------------------------------------------
-- Leituras, já filtradas pelas permissões
-- ---------------------------------------------------------------------------

-- Um número nacional de 9 dígitos gravado sem indicativo é completado com o 351,
-- como faz o `normalizeWhatsApp` do TypeScript. `immutable` para poder indexar.
create or replace function public.normalize_phone(raw text)
returns text language sql immutable strict as $$
  select case
    when regexp_replace(raw, '\D', '', 'g') ~ '^[29]\d{8}$'
      then '351' || regexp_replace(raw, '\D', '', 'g')
    else regexp_replace(raw, '\D', '', 'g') end;
$$;

create or replace function public.wa_actor_for_phone(raw_phone text)
returns uuid language plpgsql stable security definer set search_path = public as $$
declare alvo uuid; quantos int;
begin
  if raw_phone is null or public.normalize_phone(raw_phone) = '' then return null; end if;
  select count(*) into quantos from public.profiles p
   where p.phone is not null
     and public.normalize_phone(p.phone) = public.normalize_phone(raw_phone);
  -- Dois perfis com o mesmo telefone: falha fechada. Mais vale não responder do
  -- que atribuir uma ordem à pessoa errada.
  if quantos <> 1 then return null; end if;
  select p.id into alvo from public.profiles p
   where p.phone is not null
     and public.normalize_phone(p.phone) = public.normalize_phone(raw_phone);
  return alvo;
end $$;

create or replace function public.wa_vehicles_for_actor(actor uuid)
returns table(id uuid, make text, model text, variant text, color text,
              license_plate text, status text, vehicle_type text)
language sql stable security definer set search_path = public as $$
  select c.id, c.make, c.model, c.variant, c.color, c.license_plate,
         c.status::text, c.vehicle_type
    from public.cars c
   where (public.has_section_for(actor, 'oficina')
       or public.has_section_for(actor, 'carros')
       or public.has_section_for(actor, 'financeiro'))
     and public.has_vehicle_type_for(actor, c.vehicle_type)
   order by c.updated_at desc;
$$;

create or replace function public.wa_vehicle_summary(actor uuid, car uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (
      select 1 from public.wa_vehicles_for_actor(actor) v where v.id = car
    ) then null else jsonb_build_object(
    'costs', coalesce((select sum(amount) from public.vehicle_costs where car_id = car), 0),
    'cost_count', (select count(*) from public.vehicle_costs where car_id = car),
    'hours', coalesce((select sum(hours) from public.vehicle_tasks where car_id = car), 0),
    'status', (select status::text from public.cars where id = car)
  ) end;
$$;

-- ---------------------------------------------------------------------------
-- Estado do canal: idempotência e propostas à espera de confirmação
-- ---------------------------------------------------------------------------

-- A Meta reentrega a mesma mensagem quando não recebe 200 a tempo. Sem esta
-- tabela, uma reentrega lançava o custo duas vezes.
create table if not exists public.wa_messages (
  wam_id        text primary key,
  from_phone    text not null,
  actor_id      uuid references public.profiles(id) on delete set null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  reply_sent_at timestamptz,
  error         text
);
create index if not exists wa_messages_received_idx on public.wa_messages(received_at);

-- A acção já interpretada e validada, à espera do "sim". Guarda-se o que vai ser
-- escrito, não o texto original: a confirmação nunca reinterpreta nada, por isso
-- o que é gravado é forçosamente o que a pessoa leu.
create table if not exists public.wa_pending_actions (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  from_phone text not null,
  kind       text not null check (kind in ('register_vehicle','add_cost','log_hours')),
  payload    jsonb not null,
  summary    text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes',
  status     text not null default 'pending'
             check (status in ('pending','confirmed','cancelled','expired','superseded')),
  settled_at timestamptz,
  result_id  uuid
);
-- Um número só pode ter uma proposta em aberto: a nova substitui a anterior.
create unique index if not exists wa_pending_one_open
  on public.wa_pending_actions(from_phone) where status = 'pending';

-- Canalização de servidor, como `submission_limits`: RLS activa e nenhuma
-- política, logo só o service_role (que a ignora) lhes toca.
alter table public.wa_messages enable row level security;
alter table public.wa_pending_actions enable row level security;
revoke all on public.wa_messages from anon, authenticated;
revoke all on public.wa_pending_actions from anon, authenticated;

-- As matrículas na base de dados são inconsistentes: a RPC da oficina grava
-- `upper(trim(plate))` sem tirar hífenes e o formulário grava-os. Comparar
-- sempre pela forma canónica — e indexá-la, para a procura não varrer a tabela.
create index if not exists cars_plate_key_idx on public.cars
  ((upper(regexp_replace(coalesce(license_plate, ''), '[^A-Za-z0-9]', '', 'g'))));
create index if not exists profiles_phone_key_idx on public.profiles
  (public.normalize_phone(phone)) where phone is not null;

create or replace function public.prune_whatsapp() returns void
language sql security definer set search_path = public as $$
  delete from public.wa_messages where received_at < now() - interval '7 days';
  delete from public.wa_pending_actions
   where status <> 'pending' and created_at < now() - interval '1 day';
$$;

-- Só o servidor. O bloco faz o revoke e o grant juntos, para não se poder
-- acrescentar uma função e esquecer o revoke.
do $$ declare sig text; begin
  foreach sig in array array[
    'wa_begin_as(uuid,text[])',
    'wa_create_workshop_vehicle(uuid,text,text,text)',
    'wa_add_cost(uuid,uuid,text,text,numeric,date)',
    'wa_log_hours(uuid,uuid,date,time,time,text)',
    'wa_actor_for_phone(text)',
    'wa_vehicles_for_actor(uuid)',
    'wa_vehicle_summary(uuid,uuid)',
    'prune_whatsapp()'
  ] loop
    execute 'revoke all on function public.' || sig || ' from public, anon, authenticated';
    execute 'grant execute on function public.' || sig || ' to service_role';
  end loop;
end $$;

commit;
