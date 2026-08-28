-- 0007_handle_new_user.sql — account creation, in ONE atomic transaction.
--
-- The trigger fires inside the same transaction as the `auth.users` insert, so
-- either the user, the workspace, the membership row, the profile, the trial
-- subscription and all 54 baseline pantry items exist, or none of them do.
-- The application never re-implements any part of this seeding (Rule 3).

-- ---------------------------------------------------------------------------
-- The 54 baseline pantry items (SPEC.md § 5).
--
-- WHY THE ROWS LIVE HERE AND NOT IN supabase/seed/baseline_pantry.sql:
-- `handle_new_user` has to insert them, and a trigger cannot read a file that
-- sits outside the migration path. Holding the list in a function keeps exactly
-- one definition; the seed script calls this function rather than restating 54
-- rows that would then be free to drift from the copy that actually runs.
--
-- Expiry is evaluated as a UTC calendar date (SPEC.md § 4.11), so spoilage
-- ordering is stable regardless of where the user or the database sits.
-- A NULL offset means a permanent staple.
-- ---------------------------------------------------------------------------
create or replace function public.seed_baseline_pantry(p_workspace_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_inserted integer;
begin
  insert into public.pantry_items
    (workspace_id, name, quantity, unit, expiry_date, is_frozen, source)
  select
    p_workspace_id,
    v.name,
    v.quantity,
    v.unit,
    case when v.expiry_offset_days is null then null else v_today + v.expiry_offset_days end,
    v.is_frozen,
    'seed'
  from (
    values
      -- Dry staples & oils — no expiry (14)
      ('Salt',                   1::numeric, 'container',     null::int, false),
      ('Black pepper',           1,          'container',     null,      false),
      ('Olive oil',              1,          'bottle',        null,      false),
      ('Vegetable oil',          1,          'bottle',        null,      false),
      ('Garlic powder',          1,          'container',     null,      false),
      ('Onion powder',           1,          'container',     null,      false),
      ('All-purpose flour',      1,          'bag',           null,      false),
      ('Granulated sugar',       1,          'bag',           null,      false),
      ('Baking soda',            1,          'box',           null,      false),
      ('Baking powder',          1,          'container',     null,      false),
      ('Dried oregano',          1,          'container',     null,      false),
      ('Dried basil',            1,          'container',     null,      false),
      ('Soy sauce',              1,          'bottle',        null,      false),
      ('White vinegar',          1,          'bottle',        null,      false),

      -- Dairy & eggs (8)
      ('Butter',                 1,          'lb',            30,        false),
      ('Margarine',              1,          'lb',            30,        false),
      ('2% milk',                1,          'gallon',        5,         false),
      ('Sliced American cheese', 8,          'oz pack',       14,        false),
      ('Sliced provolone',       8,          'oz pack',       14,        false),
      ('Sliced monterey jack',   8,          'oz pack',       14,        false),
      ('Sliced mozzarella',      8,          'oz pack',       14,        false),
      ('Eggs',                   1,          'dozen',         21,        false),

      -- Proteins — all frozen, no expiry (9)
      ('Chicken breasts',        2,          'lb',                 null, true),
      ('Ground turkey',          2,          'lb',                 null, true),
      ('Sirloin steaks',         2,          'steaks (1 lb each)', null, true),
      ('Ground beef',            2,          'lb',                 null, true),
      ('Tofu',                   1,          'pack',               null, true),
      ('Pork loin',              1,          'package',            null, true),
      ('Bacon',                  1,          'pack',               null, true),
      ('Bratwurst',              1,          'pack',               null, true),
      ('Shrimp',                 2,          'lb',                 null, true),

      -- Fresh produce (10)
      ('Bell peppers',           3,          'each',          10,        false),
      ('Green beans',            0.5,        'lb',            6,         false),
      ('Broccoli',               1,          'head',          6,         false),
      ('Salad greens',           20,         'oz bag',        5,         false),
      ('Squash',                 1,          'each',          8,         false),
      ('Corn on the cob',        5,          'each',          4,         false),
      ('Yellow onions',          3,          'each',          30,        false),
      ('Garlic',                 1,          'bulb',          60,        false),
      ('Potatoes',               5,          'lb bag',        30,        false),
      ('Lemons',                 4,          'each',          14,        false),

      -- Canned goods — no expiry (3)
      ('Black beans',            1,          'can',           null,      false),
      ('Red beans',              1,          'can',           null,      false),
      ('Garbanzo beans',         1,          'can',           null,      false),

      -- Grains — no expiry except bread (4)
      ('White rice',             2,          'lb bag',        null,      false),
      ('Spaghetti noodles',      1,          'lb box',        null,      false),
      ('Bread',                  1,          'loaf',          5,         false),
      ('Oatmeal',                18,         'oz container',  null,      false),

      -- Sauces & condiments — no expiry (6)
      ('Ranch dressing',         1,          'bottle',        null,      false),
      ('Fish sauce',             1,          'bottle',        null,      false),
      ('Red wine vinegar',       1,          'bottle',        null,      false),
      ('Apple cider vinegar',    1,          'bottle',        null,      false),
      ('Ketchup',                1,          'bottle',        null,      false),
      ('Dijon mustard',          1,          'jar',           null,      false)
  ) as v (name, quantity, unit, expiry_offset_days, is_frozen);

  get diagnostics v_inserted = row_count;

  -- SPEC.md § 5 fixes the list at 54. If an edit to the VALUES list above ever
  -- changes that count, fail loudly at signup rather than silently seeding a
  -- short pantry that a reviewer would only notice as a thin meal plan.
  if v_inserted <> 54 then
    raise exception 'baseline pantry must seed exactly 54 items, seeded %', v_inserted;
  end if;

  return v_inserted;
end;
$function$;

revoke execute on function public.seed_baseline_pantry(uuid) from public;

-- ---------------------------------------------------------------------------
-- handle_new_user — profile + workspace + membership + trial subscription +
-- 54 pantry items, atomically.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_workspace_id uuid;
  v_local_part text;
begin
  -- SPEC.md § 4.2: the workspace is named "<email local part>'s kitchen".
  v_local_part := nullif(split_part(coalesce(new.email, ''), '@', 1), '');

  insert into public.workspaces (name, owner_user_id)
  values (coalesce(v_local_part, 'My') || '''s kitchen', new.id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'owner');

  insert into public.profiles (user_id, workspace_id)
  values (new.id, v_workspace_id);

  insert into public.subscriptions (workspace_id, tier, status)
  values (v_workspace_id, 'free', 'trialing');

  perform public.seed_baseline_pantry(v_workspace_id);

  return new;
end;
$function$;

revoke execute on function public.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
