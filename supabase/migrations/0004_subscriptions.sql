-- 0004_subscriptions.sql — `subscriptions` (SPEC.md § 4.5).
--
-- NOT ENFORCED IN THIS BUILD. The row is created by `handle_new_user` and the
-- Stripe columns exist purely as seams so Phase 4 billing is additive. No code
-- in this build reads `tier` to gate a feature (CLAUDE.md Rule 16), and the
-- tier limit numbers live only in SPEC.md § 9 / src/lib/plans.ts.

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  tier public.plan_tier not null default 'free',
  status public.subscription_status not null default 'trialing',

  -- Phase 4 seams — written by nothing in this build.
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- Only `handle_new_user` (SECURITY DEFINER, bypasses RLS) writes this table in
-- this build. The owner-scoped policies below exist so the table is not left
-- without explicit policies, per Rule 4.
create policy subscriptions_insert on public.subscriptions
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

create policy subscriptions_update on public.subscriptions
  for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy subscriptions_delete on public.subscriptions
  for delete to authenticated
  using (public.is_workspace_owner(workspace_id));
