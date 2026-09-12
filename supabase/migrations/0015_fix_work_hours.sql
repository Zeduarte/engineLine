-- ============================================================================
-- 0015 — corrige o cálculo de horas na oficina
--
-- O trigger calculate_work_hours (criado em 0013) fazia `end_time - start_time`.
-- Se o start_time for NULL (registos antigos/incompletos), o resultado é NULL e
-- a coluna `hours` (not-null) rebentava ao "Terminar" um registo:
--   "null value in column 'hours' of relation 'vehicle_tasks'..."
--
-- Agora, se faltar o início OU o fim, as horas ficam a 0 (em vez de NULL).
-- ============================================================================

create or replace function public.calculate_work_hours()
returns trigger language plpgsql as $$
begin
  new.hours := case
    when new.end_time is null or new.start_time is null then 0
    else round(
      (mod(extract(epoch from (new.end_time - new.start_time))::numeric + 86400, 86400) / 3600),
      2
    )
  end;
  return new;
end;
$$;

-- O trigger já existe (0013) e passa a usar esta função corrigida.
