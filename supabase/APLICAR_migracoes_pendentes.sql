-- ===========================================================================
-- APLICAR_migracoes_pendentes.sql
-- Junta as migrações 0007 → 0011 num só script para colar no
-- Supabase → SQL Editor → New query → Run.
--
-- É seguro correr mais do que uma vez: usa "if not exists" em tudo, por isso
-- o que já existir é ignorado (não dá erro nem duplica nada).
--
-- Se o editor devolver o erro
--   "ALTER TYPE ... ADD VALUE cannot run inside a transaction block"
-- corre primeiro APENAS as 3 linhas "alter type ... add value ..." (uma a uma),
-- e depois o resto do script.
-- ===========================================================================

-- ---- 0007: dados de contacto/empresa (editáveis no backoffice) -------------
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

-- ---- 0010: link do Messenger -----------------------------------------------
alter table public.site_settings add column if not exists messenger text;

-- ---- 0009: hierarquia de papéis + permissões por separador -----------------
alter type public.user_role add value if not exists 'chefe';
alter table public.profiles add column if not exists allowed_sections text[];

-- ---- 0008 + 0011: novos tipos de lead --------------------------------------
alter type public.lead_kind add value if not exists 'offer';  -- propostas de preço
alter type public.lead_kind add value if not exists 'alert';  -- "avise-me quando entrar"

-- ---- 0008: submissão pública de testemunhos (fica sempre por aprovar) -------
drop policy if exists "testimonials: public submit" on public.testimonials;
create policy "testimonials: public submit"
  on public.testimonials for insert
  to anon
  with check (published = false);
