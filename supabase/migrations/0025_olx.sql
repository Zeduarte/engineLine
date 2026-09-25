-- Publicação automática no OLX (Partner API).
--
-- Até aqui o estado em cada portal era registado à mão em `channel_listings`.
-- Para o OLX passa a ser o próprio sistema a criar, atualizar e retirar o
-- anúncio, por isso a tabela ganha o estado da sincronização e o último erro.
--
-- Os tokens OAuth da conta do stand ficam numa tabela só de servidor: dão
-- acesso total à conta do OLX (o OLX avisa que um token é "como uma
-- password"), e por isso nenhuma sessão do backoffice os pode ler — nem um
-- administrador. As credenciais da aplicação (client_id/secret) nem sequer
-- vivem na base de dados: estão nas variáveis de ambiente do Netlify.
begin;

-- Ligação à conta do stand no OLX. Uma linha só (id = 1).
create table if not exists public.olx_connection (
  id             int primary key default 1 check (id = 1),
  access_token   text not null,
  refresh_token  text not null,
  expires_at     timestamptz not null,
  olx_user_id    text,
  olx_user_name  text,
  -- Localização do stand no OLX (a cidade é obrigatória em cada anúncio),
  -- resolvida a partir das coordenadas das Definições.
  city_id        bigint,
  district_id    bigint,
  connected_by   uuid references public.profiles(id) on delete set null,
  connected_at   timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Categoria do OLX para carros e para motas, com a definição dos atributos.
-- Os IDs variam por país e não vêm na documentação: são lidos da API pelo
-- botão "Carregar categorias" em Integrações.
create table if not exists public.olx_category_cache (
  vehicle_type text primary key check (vehicle_type in ('car', 'motorcycle')),
  category_id  bigint not null,
  category_name text not null default '',
  photos_limit int not null default 0,
  attributes   jsonb not null default '[]'::jsonb,
  fetched_at   timestamptz not null default now()
);

-- Canalização de servidor: RLS ativa e nenhuma política, como `wa_messages`.
-- O painel de Integrações lê o estado através do cliente de serviço, e só
-- mostra o que é seguro mostrar (nunca os tokens).
alter table public.olx_connection enable row level security;
alter table public.olx_category_cache enable row level security;
revoke all on public.olx_connection from anon, authenticated;
revoke all on public.olx_category_cache from anon, authenticated;

-- Estado da sincronização automática, por viatura e canal.
alter table public.channel_listings
  add column if not exists sync_state text not null default 'idle'
    check (sync_state in ('idle', 'pending', 'syncing', 'error')),
  add column if not exists last_error text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists remote_status text,
  add column if not exists attempts int not null default 0;

create index if not exists idx_channel_listings_sync
  on public.channel_listings (channel, sync_state)
  where sync_state in ('pending', 'error');

commit;
