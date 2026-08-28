-- 0005_pantry_items.sql — `pantry_items` (SPEC.md § 4.6).
--
-- Core spine: written by the pantry module, READ by meal-plan generation and by
-- the grocery gap diff — two or more features, so Prompt 3 owns it (Rule 3).
--
-- The four `*_per_unit` nutrition columns are NOT created here. They belong to
-- the OPTIONAL Prompt 3b (`0009_pantry_nutrition.sql`, SPEC.md Appendix A) and
-- are NULL unless that enrichment has been run. Everything must behave
-- identically when they are absent (§ 8.11).

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,

  -- Free text, capped, and never rendered as HTML (Rule 8).
  name text not null check (char_length(name) between 1 and 120),

  -- numeric, not integer: the baseline list alone has 0.5 lb of green beans.
  -- A size descriptor like "(1 lb each)" belongs in `unit`, never here.
  quantity numeric(10, 2) not null check (quantity >= 0),

  -- Free text, NOT an enum: the baseline list uses lb, gallon, dozen, head,
  -- bag, bottle, jar, can, pack, bulb, container, box, oz pack, each, and more.
  unit text not null check (char_length(unit) between 1 and 32),

  -- NULL = permanent staple. Excluded from spoilage-priority sorting, not
  -- sorted to either end (SPEC.md § 4.6).
  expiry_date date,

  is_frozen boolean not null default false,
  source text not null default 'seed' check (source in ('seed', 'user')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pantry_items_workspace_id_idx on public.pantry_items (workspace_id);

-- The spoilage-priority query is
--   where workspace_id = $1 and expiry_date is not null order by expiry_date asc
-- so the index is partial on the same predicate.
create index pantry_items_workspace_expiry_idx
  on public.pantry_items (workspace_id, expiry_date)
  where expiry_date is not null;

create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function public.set_updated_at();

alter table public.pantry_items enable row level security;

create policy pantry_items_select on public.pantry_items
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy pantry_items_insert on public.pantry_items
  for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy pantry_items_update on public.pantry_items
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy pantry_items_delete on public.pantry_items
  for delete to authenticated
  using (public.is_workspace_member(workspace_id));
