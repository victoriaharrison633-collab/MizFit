-- 0009_provision_in_app.sql — take the signup trigger off the hot path.
--
-- WHY
--
-- On the hosted project every insert into auth.users was rejected by the
-- `on_auth_user_created` trigger: signup and the demo door both failed while
-- login worked, and the local stack could not reproduce it. The trigger is
-- dropped and `src/lib/auth/provision.ts` does the same five inserts under the
-- service role instead, where a failure is visible in the application log.
--
-- The 54-item baseline list is NOT duplicated: provisioning calls the same
-- `seed_baseline_pantry()` function this migration grants access to, so there
-- is still exactly one copy of that list (SPEC.md § 5).
--
-- The trigger can be reinstated later — provisioning is idempotent and checks
-- for an existing membership first, so both can safely be in place at once.
drop trigger if exists on_auth_user_created on auth.users;

-- The service role calls this through PostgREST; 0007 revoked it from PUBLIC.
grant execute on function public.seed_baseline_pantry(uuid) to service_role;
