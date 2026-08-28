-- 0011_lead_alert.sql
-- Novo tipo de lead: "alert" — pedidos de "avise-me quando entrar" feitos por
-- visitantes que procuram uma viatura que ainda não está em stock.
alter type public.lead_kind add value if not exists 'alert';
