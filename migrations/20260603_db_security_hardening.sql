alter table if exists public.user_profile enable row level security;
alter table if exists public.user_books enable row level security;
alter table if exists public.user_memberships enable row level security;

alter table if exists public.user_profile force row level security;
alter table if exists public.user_books force row level security;
alter table if exists public.user_memberships force row level security;

drop policy if exists "Users can view own profile" on public.user_profile;
drop policy if exists "Users can insert own profile" on public.user_profile;
drop policy if exists "Users can update own profile" on public.user_profile;
drop policy if exists "Enable users to view their own data only" on public.user_profile;
drop policy if exists "Enable insert for users based on user_id" on public.user_profile;

create policy "Users can view own profile"
on public.user_profile
for select
to authenticated
using (id = auth.uid());

create policy "Users can insert own profile"
on public.user_profile
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update own profile"
on public.user_profile
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can view own books" on public.user_books;
drop policy if exists "Users can insert own books" on public.user_books;
drop policy if exists "Users can update own books" on public.user_books;
drop policy if exists "Users can delete own books" on public.user_books;
drop policy if exists "select_user_books_by_bookid" on public.user_books;
drop policy if exists "insert_user_books_by_bookid" on public.user_books;
drop policy if exists "update_user_books_by_bookid" on public.user_books;
drop policy if exists "delete_user_books_by_bookid" on public.user_books;
drop policy if exists "select_user_books_by_owner" on public.user_books;
drop policy if exists "insert_user_books_by_owner" on public.user_books;
drop policy if exists "update_user_books_by_owner" on public.user_books;
drop policy if exists "delete_user_books_by_owner" on public.user_books;

create policy "Users can view own books"
on public.user_books
for select
to authenticated
using (
  exists (
    select 1
    from public.user_profile up
    where up.id = auth.uid()
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
    where up.id = auth.uid()
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
    where up.id = auth.uid()
      and up.book_id::text = owner_id::text
  )
)
with check (
  exists (
    select 1
    from public.user_profile up
    where up.id = auth.uid()
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
    where up.id = auth.uid()
      and up.book_id::text = owner_id::text
  )
);

revoke all on table public.user_profile from anon;
revoke all on table public.user_profile from authenticated;
revoke all on table public.user_books from anon;
revoke all on table public.user_books from authenticated;
revoke all on table public.user_memberships from anon;
revoke all on table public.user_memberships from authenticated;

grant select, insert, update on public.user_profile to authenticated;
grant select, insert, update, delete on public.user_books to authenticated;
grant select on public.user_memberships to authenticated;

revoke execute on function public.get_user_books_page_preview(text, integer, integer, text) from authenticated;
drop function if exists public.get_user_books_page_preview(text, integer, integer, text);

create or replace function public.get_user_books_page_preview(
  p_from integer,
  p_to integer,
  p_search_query text default null
)
returns table(
  id text,
  title text,
  content jsonb,
  owner_id text,
  "creationTime" text,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with current_owner as (
    select up.book_id::text as owner_id
    from public.user_profile up
    where up.id = auth.uid()
    limit 1
  ),
  filtered as (
    select ub.*
    from public.user_books ub
    join current_owner co on co.owner_id = ub.owner_id::text
    where (
      p_search_query is null
      or p_search_query = ''
      or ub.title ilike '%' || p_search_query || '%'
    )
  ),
  ranked as (
    select
      ub.id::text as id,
      ub.title,
      (
        select coalesce(jsonb_agg(entry.value order by entry.ordinality), '[]'::jsonb)
        from jsonb_array_elements(coalesce(ub.content::jsonb, '[]'::jsonb)) with ordinality as entry(value, ordinality)
        where entry.ordinality <= 3
      ) as content,
      ub.owner_id::text as owner_id,
      ub."creationTime"::text as "creationTime",
      count(*) over() as total_count
    from filtered ub
    order by ub."creationTime" desc, ub.id desc
  )
  select *
  from ranked
  offset greatest(coalesce(p_from, 0), 0)
  limit greatest(coalesce(p_to, 0) - coalesce(p_from, 0) + 1, 0);
$$;

grant execute on function public.get_user_books_page_preview(integer, integer, text) to authenticated;