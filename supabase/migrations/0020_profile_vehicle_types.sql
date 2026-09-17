-- Acesso por tipo de viatura: o admin decide se cada utilizador trabalha com
-- carros e motas, só carros ou só motas.
--
-- NULL = sem restrição (os dois mundos). É o que fica para todos os perfis
-- existentes, para nada mudar em contas já criadas.
alter table public.profiles
  add column allowed_vehicle_types text[]
  check (
    allowed_vehicle_types is null
    or (
      cardinality(allowed_vehicle_types) between 1 and 2
      and allowed_vehicle_types <@ array['car','motorcycle']::text[]
    )
  );

comment on column public.profiles.allowed_vehicle_types is
  'Tipos de viatura a que o utilizador acede no backoffice. NULL = ambos.';
