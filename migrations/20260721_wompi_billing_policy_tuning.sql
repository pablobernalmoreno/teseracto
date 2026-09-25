drop policy if exists "Users can view own billing payments" on public.billing_payments;

create policy "Users can view own billing payments"
on public.billing_payments
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "No direct access to billing webhook events" on public.billing_webhook_events;

create policy "No direct access to billing webhook events"
on public.billing_webhook_events
for all
to authenticated
using (false)
with check (false);
