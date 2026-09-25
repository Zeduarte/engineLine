-- Dois estados novos para as viaturas que entram pela oficina:
--   workshop  → "Na oficina": só aparece na Oficina, não em Viaturas;
--   prepared  → "Preparado": a oficina acabou; aparece em Viaturas para o
--               vendedor completar a ficha e publicar.
--
-- Fica numa migração à parte porque o Postgres não deixa usar um valor novo de
-- um enum na mesma transação em que foi criado. A 0028 é que os usa.

alter type public.car_status add value if not exists 'workshop' before 'draft';
alter type public.car_status add value if not exists 'prepared' after 'draft';
