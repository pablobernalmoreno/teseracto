create or replace function public.get_user_books_page_preview(
  p_owner_id text,
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
as $$
  with filtered as (
    select ub.*
    from public.user_books ub
    where ub.owner_id::text = p_owner_id
      and (
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
  offset greatest(p_from, 0)
  limit greatest(p_to - p_from + 1, 0);
$$;

grant execute on function public.get_user_books_page_preview(text, integer, integer, text) to authenticated;