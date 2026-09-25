-- applied as 20260617202640
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.user_profile (id, name, book_id)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    gen_random_uuid()
  )
  on conflict (id) do update
    set name = excluded.name,
        book_id = coalesce(public.user_profile.book_id, excluded.book_id);

  return new;
end;
$$;

update public.user_profile
set book_id = gen_random_uuid()
where book_id is null;
