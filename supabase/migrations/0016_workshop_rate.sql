-- ============================================================================
-- 0016 — valor/hora da mão de obra da oficina
--
-- Guarda o custo por hora (€) usado para converter as horas registadas na
-- Oficina em custo de mão de obra na página "Custos e margens". Só o admin
-- define (backoffice → Definições).
-- ============================================================================

alter table public.site_settings
  add column if not exists workshop_hourly_rate numeric(8,2) not null default 0;
