-- ===========================================================================
-- 0007_company.sql
-- Dados de contacto/empresa editáveis no backoffice (linha única id=1 da
-- tabela site_settings). Todos opcionais: se ficarem a NULL, o site usa os
-- valores por defeito de `src/lib/site.ts`.
-- ===========================================================================

alter table public.site_settings add column if not exists phone text;
alter table public.site_settings add column if not exists email text;
alter table public.site_settings add column if not exists whatsapp text;
alter table public.site_settings add column if not exists address_street text;
alter table public.site_settings add column if not exists address_city text;
alter table public.site_settings add column if not exists address_postal text;
alter table public.site_settings add column if not exists address_country text;
alter table public.site_settings add column if not exists hours text;
alter table public.site_settings add column if not exists geo_lat double precision;
alter table public.site_settings add column if not exists geo_lng double precision;
