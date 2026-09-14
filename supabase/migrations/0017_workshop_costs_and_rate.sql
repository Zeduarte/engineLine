-- ============================================================================
-- 0017 — valor/hora por viatura + a oficina pode registar custos (peças)
--
-- 1) hourly_rate_override: valor/hora só para esta viatura. NULL = usa o
--    valor por defeito definido em Custos e margens.
-- 2) A oficina passa a poder registar custos (o mecânico vai buscar material
--    e lança ali o valor das peças). Sem isto a RLS ("costs: finance")
--    bloqueava o mecânico. As políticas são permissivas (somam-se à existente).
-- ============================================================================

-- 1) Valor/hora específico da viatura ----------------------------------------
alter table public.vehicle_financials
  add column if not exists hourly_rate_override numeric(8,2)
  check (hourly_rate_override is null or hourly_rate_override >= 0);

-- 2) Oficina nos custos -------------------------------------------------------
-- Ler: o mecânico vê os custos da viatura em que está a trabalhar.
drop policy if exists "costs: workshop read" on public.vehicle_costs;
create policy "costs: workshop read" on public.vehicle_costs
  for select to authenticated
  using (public.has_section('oficina'));

-- Inserir: pode lançar peças/material.
drop policy if exists "costs: workshop insert" on public.vehicle_costs;
create policy "costs: workshop insert" on public.vehicle_costs
  for insert to authenticated
  with check (public.has_section('oficina') and created_by = auth.uid());

-- Apagar: só o que ele próprio lançou (corrigir enganos), nunca custos de outros.
drop policy if exists "costs: workshop delete" on public.vehicle_costs;
create policy "costs: workshop delete" on public.vehicle_costs
  for delete to authenticated
  using (public.has_section('oficina') and created_by = auth.uid());
