-- 0008_auth_admin_grants.sql — let the hosted auth service fire the signup trigger.
--
-- WHY THIS EXISTS
--
-- 0007 attaches `handle_new_user` to `auth.users` and then revokes execute on it
-- from PUBLIC, which is correct hardening. On the local Supabase stack the auth
-- service connects as a superuser role, so the trigger fires regardless and the
-- revoke costs nothing.
--
-- On hosted Supabase the auth service connects as the restricted
-- `supabase_auth_admin` role, which was relying on that PUBLIC grant. Without it
-- every insert into auth.users is rejected and *every* signup fails — the local
-- stack cannot reproduce it.
--
-- The function stays SECURITY DEFINER, so it still executes as its owner and the
-- role gains no access to the tables it touches; this only lets the trigger be
-- invoked at all.
grant usage on schema public to supabase_auth_admin;

grant execute on function public.handle_new_user() to supabase_auth_admin;
