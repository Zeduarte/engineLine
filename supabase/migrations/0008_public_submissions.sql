-- ===========================================================================
-- 0008_public_submissions.sql
-- (1) Novo tipo de lead: "offer" (proposta de preço numa viatura).
-- (2) Submissão PÚBLICA de testemunhos: qualquer visitante pode inserir um
--     testemunho, mas SEMPRE por publicar (published = false). Só o staff o
--     pode aprovar (tornar published = true) — a política de escrita do staff
--     já existe (0005). Assim, nada aparece no site sem aprovação.
-- ===========================================================================

-- (1) ----------------------------------------------------------------------
alter type public.lead_kind add value if not exists 'offer';

-- (2) ----------------------------------------------------------------------
-- Inserção anónima permitida apenas quando published = false (fica pendente).
drop policy if exists "testimonials: public submit" on public.testimonials;
create policy "testimonials: public submit"
  on public.testimonials for insert
  to anon
  with check (published = false);
