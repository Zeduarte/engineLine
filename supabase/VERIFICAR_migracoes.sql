-- ============================================================================
-- VERIFICAR migrações aplicadas
--
-- Corre este bloco no Supabase → SQL Editor. Devolve uma tabela com cada
-- migração e se está APLICADA (true) ou EM FALTA (false), verificando se o
-- artefacto que essa migração cria já existe na base de dados.
--
-- Ordem de aplicação recomendada (as em falta, de cima para baixo):
--   0007 → 0008 → 0009 → 0010 → 0011 → 0012 → 0013 → 0014
-- ============================================================================

with checks as (
  select '0007_company' as migracao,
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='site_settings'
                   and column_name='phone') as aplicada
  union all
  select '0008_public_submissions',
         exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                 where t.typname='lead_kind' and e.enumlabel='offer')
  union all
  select '0009_roles_permissions',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='profiles'
                   and column_name='allowed_sections')
  union all
  select '0010_messenger',
         exists (select 1 from information_schema.columns
                 where table_schema='public' and table_name='site_settings'
                   and column_name='messenger')
  union all
  select '0011_lead_alert',
         exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                 where t.typname='lead_kind' and e.enumlabel='alert')
  union all
  select '0012_mechanic',
         to_regclass('public.vehicle_tasks') is not null
         and exists (select 1 from pg_enum e join pg_type t on t.oid=e.enumtypid
                     where t.typname='user_role' and e.enumlabel='mecanico')
  union all
  select '0013_operations',
         to_regclass('public.reservations') is not null
         and to_regclass('public.vehicle_costs') is not null
         and to_regclass('public.audit_log') is not null
  union all
  select '0014_channel_listings',
         to_regclass('public.channel_listings') is not null
)
select
  migracao,
  aplicada,
  case when aplicada then '✅ aplicada' else '❌ EM FALTA — correr' end as estado
from checks
order by migracao;
