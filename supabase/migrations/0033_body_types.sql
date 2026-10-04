-- Segmentos que faltavam: "Utilitário" nos carros (ex.: Renault Mégane) e
-- "Moto 4" nas motas (quads/ATV, ex.: Suzuki LTR 450).
alter type public.body_type add value if not exists 'Utilitário' after 'Citadino';
alter type public.body_type add value if not exists 'Moto 4';

-- A regra que liga o segmento ao tipo tinha a lista das motas fechada: sem
-- "Moto 4" lá, uma moto 4 era recusada. Comparação textual (como na 0018)
-- para não usar os valores novos do enum antes do COMMIT.
alter table public.cars drop constraint if exists cars_vehicle_category_check;
alter table public.cars add constraint cars_vehicle_category_check check (
  body is null or ((vehicle_type = 'motorcycle') = (body::text in ('Scooter','Naked','Desportiva','Trail','Touring','Chopper/Cruiser','Enduro','Moto 4')))
);
