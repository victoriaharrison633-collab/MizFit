-- 0003_profiles.sql — `profiles` (SPEC.md § 4.4).
--
-- Per-person, NOT per-household. SPEC.md § 4.4 cites PRD SEC-4: personal
-- tracking data stays private even inside a household. So these policies scope
-- on `user_id`, not on workspace membership — a second household member in
-- Phase 3 must not be able to read their partner's weight or calorie target.
-- `workspace_id` is still carried as an FK, and INSERT additionally requires
-- membership so a row cannot be attached to someone else's workspace.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  display_name text,

  -- TDEE inputs (SPEC.md § 7)
  age int check (age between 13 and 120),
  biological_sex public.profile_sex,
  height_cm numeric(5, 1),
  current_weight_lbs numeric(5, 1),
  goal_weight_lbs numeric(5, 1),
  target_date date,
  activity_level public.activity_level,

  -- Recomputed, never stored once (SPEC.md § 4.4, § 7).
  calorie_target int,
  daily_deficit int,
  estimated_completion_date date,

  diet_methodology public.diet_methodology,
  servings_per_meal int not null default 1 check (servings_per_meal between 1 and 12),

  -- Fixed value set per SPEC.md § 4.4. Zod validates it at the API boundary
  -- (Rule 8); this constraint is the defence-in-depth half of the same rule.
  dietary_exclusions text[] not null default '{}',

  onboarding_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_dietary_exclusions_allowed check (
    dietary_exclusions <@ array['nuts', 'dairy', 'gluten', 'soy', 'shellfish']::text[]
  )
);

create index profiles_workspace_id_idx on public.profiles (workspace_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_workspace_member(workspace_id)
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and public.is_workspace_member(workspace_id)
  );

create policy profiles_delete on public.profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));
