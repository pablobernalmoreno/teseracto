drop policy if exists "Enable users to view their own memberships" on public.user_memberships;

create policy "Enable users to view their own memberships"
on public.user_memberships
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view own profile" on public.user_profile;
drop policy if exists "Users can insert own profile" on public.user_profile;
drop policy if exists "Users can update own profile" on public.user_profile;

create policy "Users can view own profile"
on public.user_profile
for select
to authenticated
using (id = (select auth.uid()));

create policy "Users can insert own profile"
on public.user_profile
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "Users can update own profile"
on public.user_profile
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Users can view own books" on public.user_books;
drop policy if exists "Users can insert own books" on public.user_books;
drop policy if exists "Users can update own books" on public.user_books;
drop policy if exists "Users can delete own books" on public.user_books;

create policy "Users can view own books"
on public.user_books
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.id = (select auth.uid())
      and up.book_id::text = owner_id::text
  )
);

create policy "Users can insert own books"
on public.user_books
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profile up
    where up.id = (select auth.uid())
      and up.book_id::text = owner_id::text
  )
);

create policy "Users can update own books"
on public.user_books
for update
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.id = (select auth.uid())
      and up.book_id::text = owner_id::text
  )
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.id = (select auth.uid())
      and up.book_id::text = owner_id::text
  )
);

create policy "Users can delete own books"
on public.user_books
for delete
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.id = (select auth.uid())
      and up.book_id::text = owner_id::text
  )
);
