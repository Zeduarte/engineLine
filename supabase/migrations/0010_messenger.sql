-- ===========================================================================
-- 0010_messenger.sql
-- Link do Facebook Messenger da empresa (ex.: https://m.me/aminhapagina).
-- Usado no botão flutuante de contacto (WhatsApp + Messenger).
-- ===========================================================================

alter table public.site_settings add column if not exists messenger text;
