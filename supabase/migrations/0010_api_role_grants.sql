-- 0010_api_role_grants.sql — grant the Supabase API roles access to the schema.
--
-- WHY THIS EXISTS
--
-- Tables created through the hosted SQL Editor do not automatically carry
-- privileges for `anon`, `authenticated` and `service_role`, the roles PostgREST
-- and the auth admin API connect as. Every request through the API therefore
-- failed with "permission denied for table workspaces" — including the service
-- role, which bypasses RLS but still needs a GRANT.
--
-- The local Supabase stack applies these privileges as part of its own setup, so
-- a database that works perfectly under `supabase db reset` can fail completely
-- once the same migrations are pasted into a hosted project. That asymmetry cost
-- this build an entire deployment window.
--
-- This does NOT weaken row-level security. RLS still governs what `anon` and
-- `authenticated` can see — a GRANT only says the role may attempt the
-- operation; the policies still decide the outcome.
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- And for anything a later migration adds.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;
