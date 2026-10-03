-- Campos do OLX na ficha e na pesquisa do site.
--
-- Cada categoria do OLX tem a sua lista de campos (marca, modelo, segmento,
-- cor, condição, …), que o site já guarda ao escolher a categoria. Agora:
--  - os valores que o stand escolhe para cada campo ficam na viatura;
--  - o site público pode ler a lista de campos, para mostrar os mesmos filtros.

-- { "codigo_do_campo": "valor" | ["valor", …] } — os códigos são os do OLX.
alter table public.cars add column if not exists olx_attributes jsonb not null default '{}'::jsonb;

-- Os campos das categorias padrão, sem nada da ligação (tokens) nem das
-- categorias de exceção. As tabelas do OLX continuam fechadas; isto só expõe
-- a lista de campos, que é pública no próprio OLX.
create or replace function public.olx_category_fields()
returns table (vehicle_type text, category_id bigint, category_name text, attributes jsonb)
language sql stable security definer set search_path = public as $$
  select vehicle_type, category_id, category_name, attributes from public.olx_category_cache;
$$;
revoke all on function public.olx_category_fields() from public;
grant execute on function public.olx_category_fields() to anon, authenticated;
