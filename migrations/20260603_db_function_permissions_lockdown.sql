revoke execute on function public.get_user_books_page_preview(integer, integer, text) from anon;
revoke execute on function public.get_user_books_page_preview(integer, integer, text) from public;
grant execute on function public.get_user_books_page_preview(integer, integer, text) to authenticated;

revoke execute on function public.handle_new_user_membership() from anon;
revoke execute on function public.handle_new_user_membership() from authenticated;
revoke execute on function public.handle_new_user_membership() from public;

revoke execute on function public.set_updated_at_user_memberships() from anon;
revoke execute on function public.set_updated_at_user_memberships() from authenticated;
revoke execute on function public.set_updated_at_user_memberships() from public;

alter function public.set_updated_at_user_memberships() set search_path = public;
