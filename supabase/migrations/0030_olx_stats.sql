-- Estatísticas dos anúncios do OLX (GET /adverts/{id}/statistics), guardadas
-- junto ao anúncio para o backoffice as mostrar sem ir ao OLX a cada página.
-- Atualizam-se uma vez por dia (/api/maintenance) e com um botão.

alter table public.channel_listings
  add column if not exists views integer check (views >= 0),
  add column if not exists phone_views integer check (phone_views >= 0),
  add column if not exists observers integer check (observers >= 0),
  add column if not exists stats_at timestamptz;
