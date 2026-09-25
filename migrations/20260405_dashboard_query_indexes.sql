create extension if not exists pg_trgm;

create index if not exists user_books_owner_creation_id_idx
  on public.user_books (owner_id, "creationTime" desc, id desc);

create index if not exists user_books_owner_id_idx
  on public.user_books (owner_id, id);

create index if not exists user_books_title_trgm_idx
  on public.user_books using gin (title gin_trgm_ops);