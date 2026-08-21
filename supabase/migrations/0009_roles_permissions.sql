-- ===========================================================================
-- 0009_roles_permissions.sql
-- Hierarquia de papéis (admin > chefe > vendedor) e permissões por separador.
--  - Adiciona o papel "chefe".
--  - `allowed_sections`: lista de separadores do backoffice a que o utilizador
--    tem acesso. NULL = usar os defaults do papel (ver src/lib/permissions.ts).
--    O admin vê sempre tudo (este campo é ignorado para admin).
-- ===========================================================================

alter type public.user_role add value if not exists 'chefe';

alter table public.profiles
  add column if not exists allowed_sections text[];
