-- supabase/seed/baseline_pantry.sql — re-seed the 54 baseline pantry items
-- (SPEC.md § 5) into an existing workspace.
--
-- The 54 rows themselves are deliberately NOT restated here. They live in
-- `public.seed_baseline_pantry(uuid)`, created by
-- supabase/migrations/0007_handle_new_user.sql, because the `handle_new_user`
-- trigger has to insert them and a trigger cannot read a file outside the
-- migration path. One definition, called from both places — a second copy in
-- this file would be free to drift from the one that actually runs at signup,
-- and the drift would only surface as a thin meal plan weeks later.
--
-- A normal account never needs this: seeding happens inside the signup
-- transaction. Use it in local development after manually clearing a pantry.
--
-- Usage:
--   psql "$DATABASE_URL" -v workspace_id="'<uuid>'" -f supabase/seed/baseline_pantry.sql

\if :{?workspace_id}
\else
\echo 'ERROR: name the target workspace, e.g. -v workspace_id="''<uuid>''"'
\quit 1
\endif

select public.seed_baseline_pantry(:workspace_id::uuid) as items_seeded;
