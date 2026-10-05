-- Etiquetas do stand marcadas em cada viatura (ex.: "IVA dedutível").
-- Guarda os ids das etiquetas criadas em Definições → Etiquetas; o texto e a
-- cor vivem lá (site_content, chave 'badges'), para se mudarem num só sítio.
alter table public.cars add column if not exists badges text[] not null default '{}';
