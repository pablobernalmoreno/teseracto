-- Trigger-only function: Postgres checks EXECUTE when a trigger is created, not when it fires,
-- so on_auth_user_created_user_profile keeps working. Direct /rest/v1/rpc calls now fail closed.
revoke execute on function public.handle_new_user_profile() from anon;
revoke execute on function public.handle_new_user_profile() from authenticated;
revoke execute on function public.handle_new_user_profile() from public;
