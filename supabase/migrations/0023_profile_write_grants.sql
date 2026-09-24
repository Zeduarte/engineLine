-- Deixar o colaborador gravar os próprios dados de perfil.
--
-- A migração 0013 fez `revoke update on public.profiles` e devolveu apenas
-- `grant update(full_name)`, para que ninguém pudesse promover-se a si mesmo
-- mexendo no papel ou nas secções. Quando a 0021 acrescentou telefone, data de
-- nascimento e função, esse grant não foi alargado — a política RLS "profiles:
-- self update" autorizava a linha, mas o Postgres recusava as colunas, e a
-- gravação do perfil falhava com um erro genérico.
--
-- Aqui alarga-se o grant às três colunas novas. O papel (`role`) e as secções
-- continuam de fora, de propósito: essas mudam-se em Utilizadores, por quem
-- gere pessoas, nunca no próprio perfil.
begin;

grant update(phone, birth_date, job_title) on public.profiles to authenticated;

commit;
