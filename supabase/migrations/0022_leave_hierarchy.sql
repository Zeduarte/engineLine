-- Aprovação de férias segue a hierarquia: só decide quem está acima.
--
-- Antes, qualquer chefe podia decidir o plano de outro chefe — ou do próprio
-- administrador. Agora vale a mesma regra do resto do backoffice: o gestor
-- tem de ter rank estritamente superior ao do colaborador.
begin;

create or replace function public.can_decide_leave_for(target uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    -- O administrador está no topo: decide tudo, incluindo o seu próprio plano.
    when (select role::text from public.profiles where id = auth.uid()) = 'admin'
      then true
    -- O chefe decide quem está abaixo dele, nunca um par nem um superior.
    when (select role::text from public.profiles where id = auth.uid()) = 'chefe'
      then (select role::text from public.profiles where id = target)
           in ('vendedor', 'mecanico')
    else false
  end;
$$;
revoke all on function public.can_decide_leave_for(uuid) from public;
grant execute on function public.can_decide_leave_for(uuid) to authenticated, service_role;

-- As políticas passam a usar a regra da hierarquia em vez do "é chefe ou admin".
drop policy if exists "leave_days: own update" on public.leave_days;
create policy "leave_days: own update"
  on public.leave_days for update to authenticated
  using (
    (profile_id = auth.uid() and status in ('draft', 'pending'))
    or public.can_decide_leave_for(profile_id)
  )
  with check (profile_id = auth.uid() or public.can_decide_leave_for(profile_id));

drop policy if exists "leave_days: own delete" on public.leave_days;
create policy "leave_days: own delete"
  on public.leave_days for delete to authenticated
  using (
    (profile_id = auth.uid() and status in ('draft', 'pending'))
    or public.can_decide_leave_for(profile_id)
  );

-- O administrador aprova o próprio plano ao submetê-lo, por isso tem de poder
-- inserir já como aprovado. Os restantes continuam limitados a draft/pending.
drop policy if exists "leave_days: own insert" on public.leave_days;
create policy "leave_days: own insert"
  on public.leave_days for insert to authenticated
  with check (
    profile_id = auth.uid()
    and (
      status in ('draft', 'pending')
      or (status = 'approved' and public.can_decide_leave_for(auth.uid()))
    )
  );

-- Saldos: mesma regra. Cada um vê o seu; quem gere vê e altera os de baixo.
drop policy if exists "leave_balances: read own or approver" on public.leave_balances;
create policy "leave_balances: read own or approver"
  on public.leave_balances for select to authenticated
  using (profile_id = auth.uid() or public.can_decide_leave_for(profile_id));

drop policy if exists "leave_balances: approver writes" on public.leave_balances;
create policy "leave_balances: approver writes"
  on public.leave_balances for all to authenticated
  using (public.can_decide_leave_for(profile_id))
  with check (public.can_decide_leave_for(profile_id));

commit;
