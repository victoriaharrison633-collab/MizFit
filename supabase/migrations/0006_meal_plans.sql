-- 0006_meal_plans.sql — `meal_plans` and `meal_plan_days` (SPEC.md § 4.7, § 4.8).

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,

  -- Always a Sunday, always a UTC calendar date with no time component
  -- (SPEC.md § 4.11). The next Sunday on or after the current UTC date.
  week_start_date date not null check (extract(isodow from week_start_date) = 7),

  status public.meal_plan_status not null default 'generating',

  -- Per-week, NOT stored on the profile. Fixed value set from SPEC.md § 4.7;
  -- Prompt 10 pins the same five as a Zod enum at the API boundary.
  cuisine_preferences text[] not null default '{}',

  -- Snapshots at generation time — a later profile edit must not rewrite a
  -- plan that was already generated.
  diet_methodology public.diet_methodology not null,
  calorie_target int not null,
  servings_per_meal int not null,

  -- 'ai' or 'mock' — makes dev-mode plans identifiable (Rule 13).
  generation_source text not null check (generation_source in ('ai', 'mock')),
  model_id text,

  schema_version int not null default 1,
  error_message text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint meal_plans_cuisine_preferences_allowed check (
    cuisine_preferences
      <@ array['italian', 'mexican', 'asian', 'mediterranean', 'american_comfort']::text[]
  ),
  constraint meal_plans_mock_has_no_model check (
    generation_source <> 'mock' or model_id is null
  )
);

-- The idempotency guard against a double-tapped "Generate my week" burning two
-- AI calls. Failed plans are excluded so a retry after a failure is allowed.
create unique index meal_plans_workspace_week_uniq
  on public.meal_plans (workspace_id, week_start_date)
  where status <> 'failed';

create index meal_plans_workspace_id_idx on public.meal_plans (workspace_id);

create trigger meal_plans_set_updated_at
  before update on public.meal_plans
  for each row execute function public.set_updated_at();

create table public.meal_plan_days (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans (id) on delete cascade,

  -- 0 = Sunday.
  day_index smallint not null check (day_index between 0 and 6),

  day_macro_type public.day_macro_type not null,
  macro_targets jsonb not null,

  -- Single recipe object each.
  breakfast jsonb not null,
  lunch jsonb not null,
  snack jsonb not null,

  -- Exactly 3 substantively unique options, regenerated together as a set
  -- (SPEC.md § 8.5).
  supper_options jsonb not null,

  -- NULL means the day is not approvable yet.
  selected_supper_index smallint check (selected_supper_index in (0, 1, 2)),

  approved_at timestamptz,
  regenerated_count int not null default 0 check (regenerated_count >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (meal_plan_id, day_index),

  constraint meal_plan_days_three_supper_options check (
    jsonb_typeof(supper_options) = 'array' and jsonb_array_length(supper_options) = 3
  ),
  -- A day cannot be approved without a supper selection (SPEC.md § 4.8).
  constraint meal_plan_days_approved_requires_selection check (
    approved_at is null or selected_supper_index is not null
  )
);

create index meal_plan_days_meal_plan_id_idx on public.meal_plan_days (meal_plan_id);

create trigger meal_plan_days_set_updated_at
  before update on public.meal_plan_days
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- `meal_plan_days` carries no `workspace_id` of its own (SPEC.md § 4.8), so
-- membership resolves through its parent plan. That lookup lives in a helper
-- rather than inside four policies, for the same reason as the workspace
-- helpers in 0002: no RLS policy in this schema writes its own join.
-- ---------------------------------------------------------------------------
create or replace function public.can_access_meal_plan(p_meal_plan_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.meal_plans mp
    join public.workspace_members wm on wm.workspace_id = mp.workspace_id
    where mp.id = p_meal_plan_id
      and wm.user_id = (select auth.uid())
  );
$$;

revoke execute on function public.can_access_meal_plan(uuid) from public;
grant execute on function public.can_access_meal_plan(uuid) to authenticated;

alter table public.meal_plans enable row level security;

create policy meal_plans_select on public.meal_plans
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy meal_plans_insert on public.meal_plans
  for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and created_by = (select auth.uid())
  );

create policy meal_plans_update on public.meal_plans
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy meal_plans_delete on public.meal_plans
  for delete to authenticated
  using (public.is_workspace_member(workspace_id));

alter table public.meal_plan_days enable row level security;

create policy meal_plan_days_select on public.meal_plan_days
  for select to authenticated
  using (public.can_access_meal_plan(meal_plan_id));

create policy meal_plan_days_insert on public.meal_plan_days
  for insert to authenticated
  with check (public.can_access_meal_plan(meal_plan_id));

create policy meal_plan_days_update on public.meal_plan_days
  for update to authenticated
  using (public.can_access_meal_plan(meal_plan_id))
  with check (public.can_access_meal_plan(meal_plan_id));

create policy meal_plan_days_delete on public.meal_plan_days
  for delete to authenticated
  using (public.can_access_meal_plan(meal_plan_id));
