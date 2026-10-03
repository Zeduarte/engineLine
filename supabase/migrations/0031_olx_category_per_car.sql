-- Categoria do OLX por viatura.
--
-- Cada tipo continua a ter a sua categoria padrão (`olx_category_cache`), mas
-- uma viatura pode ir para outra — por exemplo uma moto 4, que no OLX não é
-- "Motociclos". Os atributos de cada categoria escolhida (padrão ou exceção)
-- guardam-se aqui, porque são eles que dizem que campos o anúncio leva.

create table if not exists public.olx_category_details (
  category_id  bigint primary key,
  -- Caminho legível: "Carros, motos e barcos › Motociclos - Scooters › …".
  category_name text not null default '',
  photos_limit int not null default 0,
  attributes   jsonb not null default '[]'::jsonb,
  fetched_at   timestamptz not null default now()
);

-- Canalização de servidor, como as outras tabelas do OLX: só o cliente de
-- serviço lê e escreve.
alter table public.olx_category_details enable row level security;
revoke all on public.olx_category_details from anon, authenticated;

-- Nulo = usa a categoria padrão do tipo.
alter table public.cars add column if not exists olx_category_id bigint;
