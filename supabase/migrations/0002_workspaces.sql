-- 0002_workspaces.sql — `workspaces` and `workspace_members` (SPEC.md § 4.2, § 4.3),
-- the shared updated_at trigger, and the membership helpers every later RLS
-- policy resolves through.

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger. Defined here because `workspaces` is the first
-- table that needs it; every later mutable table reuses this one function.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- workspaces (SPEC.md § 4.2)
-- ---------------------------------------------------------------------------
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workspaces_owner_user_id_idx on public.workspaces (owner_user_id);

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workspace_members (SPEC.md § 4.3)
--
-- A workspace is a household of one owner in this build. Phase 3's second
-- member is another row here plus an invite flow — additive, no migration.
-- ---------------------------------------------------------------------------
create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'owner',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- ---------------------------------------------------------------------------
-- Membership helpers.
--
-- SECURITY DEFINER so they read `workspace_members` without tripping that
-- table's own RLS policies — which is also what keeps the policies below from
-- recursing into themselves. STABLE so the planner can cache the result within
-- a statement.
--
-- Every RLS policy in this schema calls one of these two functions rather than
-- re-writing the membership join (CLAUDE.md Rule 5).
--
-- `set search_path = ''` forces schema-qualified resolution, so a caller cannot
-- shadow `workspace_members` with a temp table and lie about membership.
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_workspace_owner(p_workspace_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = 'owner'
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public;
revoke execute on function public.is_workspace_owner(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS (CLAUDE.md Rule 4 — enabled in the same migration that creates the table,
-- with explicit select/insert/update/delete policies).
-- ---------------------------------------------------------------------------
alter table public.workspaces enable row level security;

create policy workspaces_select on public.workspaces
  for select to authenticated
  using (public.is_workspace_member(id));

create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (owner_user_id = (select auth.uid()));

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

create policy workspaces_delete on public.workspaces
  for delete to authenticated
  using (public.is_workspace_owner(id));

alter table public.workspace_members enable row level security;

create policy workspace_members_select on public.workspace_members
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy workspace_members_insert on public.workspace_members
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

create policy workspace_members_update on public.workspace_members
  for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy workspace_members_delete on public.workspace_members
  for delete to authenticated
  using (public.is_workspace_owner(workspace_id));
