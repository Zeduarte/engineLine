-- ============================================================================
-- 0013 — Estado de publicação por canal (OLX, StandVirtual, CustoJusto, …)
--
-- Regista, por viatura e por canal, se o anúncio está publicado, o link do
-- anúncio no portal e as datas. Como a publicação é feita por FEED (o portal
-- importa o inventário), esta tabela é a "verdade" do estado em cada portal —
-- gerida no backoffice, na ficha da viatura.
--
-- Nota: `status` é TEXT com CHECK (evita ALTER TYPE, que não corre dentro de
-- transação e complica a aplicação das migrações).
-- ============================================================================

create table if not exists public.channel_listings (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars (id) on delete cascade,
  channel      text not null,
  status       text not null default 'pending'
               check (status in ('pending', 'published', 'removed', 'error')),
  external_url text,
  external_id  text,
  published_at timestamptz,
  notes        text,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (car_id, channel)
);

create index if not exists idx_channel_listings_car     on public.channel_listings (car_id);
create index if not exists idx_channel_listings_channel on public.channel_listings (channel, status);

-- updated_at automático (reutiliza a função criada em 0001).
drop trigger if exists trg_channel_listings_updated_at on public.channel_listings;
create trigger trg_channel_listings_updated_at
  before update on public.channel_listings
  for each row execute function public.set_updated_at();

-- RLS: apenas staff lê/escreve (nada público).
alter table public.channel_listings enable row level security;

drop policy if exists "channel_listings: staff all" on public.channel_listings;
create policy "channel_listings: staff all"
  on public.channel_listings
  for all
  using (public.is_staff())
  with check (public.is_staff());
