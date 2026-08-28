import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Shared typed accessors for the spine tables (Prompt 3).
 *
 * These are data access only — no business rules, no ownership decisions, no
 * error shaping. Every call still runs under RLS, and Prompt 4's
 * `assertWorkspaceOwnership` re-verifies ownership on top of it, because RLS is
 * defence in depth rather than the only check (CLAUDE.md Rule 9).
 *
 * The caller passes the client, so the same accessor works from a server route
 * handler, a server component, or the browser.
 *
 * On failure these throw. Prompt 4's `withApiHandler` maps a thrown error to a
 * stable `{ error: { code, message } }` and logs the detail server-side; no
 * caller returns one of these messages to the client (Rule 7).
 *
 * ---------------------------------------------------------------------------
 * CONNECTION POOLING — Prompt 3 spot check: SKIPPED, and why.
 *
 * The BUILD.md spot check asks whether the app connects in transaction pool
 * mode, with direct connections reserved for migrations. It does not apply
 * here, and the check explicitly asks for that to be recorded rather than left
 * silently unaddressed.
 *
 * Nothing in this build opens a Postgres connection. Every accessor below goes
 * through `@supabase/supabase-js`, which speaks HTTP to PostgREST; connection
 * pooling to Postgres happens inside Supabase's own infrastructure, not in a
 * pool this application owns or sizes. There is no `DATABASE_URL` in SPEC.md
 * § 11 and no Postgres driver in package.json, so a serverless function cannot
 * exhaust a direct pool the way it would with a raw `pg` client.
 *
 * Direct Postgres connections are used for exactly one thing: applying
 * migrations via the Supabase CLI, from a developer machine or CI — never from
 * a request path.
 *
 * This becomes a live concern only if a later change introduces a direct
 * Postgres driver. It should be re-evaluated then.
 * ---------------------------------------------------------------------------
 */

export type Db = SupabaseClient<Database>

type PublicSchema = Database['public']
type Tables = PublicSchema['Tables']

export type Workspace = Tables['workspaces']['Row']
export type WorkspaceMember = Tables['workspace_members']['Row']
export type Profile = Tables['profiles']['Row']
export type ProfileUpdate = Tables['profiles']['Update']
export type Subscription = Tables['subscriptions']['Row']
export type PantryItem = Tables['pantry_items']['Row']
export type PantryItemInsert = Tables['pantry_items']['Insert']
export type PantryItemUpdate = Tables['pantry_items']['Update']
export type MealPlan = Tables['meal_plans']['Row']
export type MealPlanInsert = Tables['meal_plans']['Insert']
export type MealPlanDay = Tables['meal_plan_days']['Row']
export type MealPlanDayInsert = Tables['meal_plan_days']['Insert']
export type MealPlanDayUpdate = Tables['meal_plan_days']['Update']

export type WorkspaceRole = PublicSchema['Enums']['workspace_role']
export type ProfileSex = PublicSchema['Enums']['profile_sex']
export type ActivityLevel = PublicSchema['Enums']['activity_level']
export type DietMethodology = PublicSchema['Enums']['diet_methodology']
export type PlanTier = PublicSchema['Enums']['plan_tier']
export type SubscriptionStatus = PublicSchema['Enums']['subscription_status']
export type MealPlanStatus = PublicSchema['Enums']['meal_plan_status']
export type DayMacroType = PublicSchema['Enums']['day_macro_type']

/**
 * Postgres `text[]` columns arrive from the generated types as `string[]`, so
 * the two fixed value sets are named here once and referenced everywhere else.
 * Both are checked in the database (0003, 0006) and pinned as Zod enums at the
 * API boundary by the prompts that own those routes.
 *
 * Adding a value is a change in SPEC.md first, then here, then the Zod enum and
 * the chip labels (SPEC.md § 4.4, § 4.7).
 */
export const DIETARY_EXCLUSIONS = ['nuts', 'dairy', 'gluten', 'soy', 'shellfish'] as const
export type DietaryExclusion = (typeof DIETARY_EXCLUSIONS)[number]

export const CUISINE_PREFERENCES = [
  'italian',
  'mexican',
  'asian',
  'mediterranean',
  'american_comfort',
] as const
export type CuisinePreference = (typeof CUISINE_PREFERENCES)[number]

class QueryError extends Error {
  constructor(operation: string, cause: { message: string; code?: string }) {
    super(`${operation} failed: ${cause.message}`)
    this.name = 'QueryError'
    this.cause = cause
  }
}

// ---------------------------------------------------------------------------
// Workspaces & membership
// ---------------------------------------------------------------------------

export async function getWorkspaceById(db: Db, workspaceId: string): Promise<Workspace | null> {
  const { data, error } = await db.from('workspaces').select('*').eq('id', workspaceId).maybeSingle()
  if (error) throw new QueryError('getWorkspaceById', error)
  return data
}

/**
 * Every membership the user holds. A workspace is a household of one owner in
 * this build, so this returns a single row today; Phase 3 adds a second member
 * row without changing the shape.
 */
export async function listWorkspaceMemberships(db: Db, userId: string): Promise<WorkspaceMember[]> {
  const { data, error } = await db
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw new QueryError('listWorkspaceMemberships', error)
  return data ?? []
}

// ---------------------------------------------------------------------------
// Profiles — per-person, never household-shared (SPEC.md § 4.4)
// ---------------------------------------------------------------------------

export async function getProfile(db: Db, userId: string): Promise<Profile | null> {
  const { data, error } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle()
  if (error) throw new QueryError('getProfile', error)
  return data
}

/**
 * The row itself is created by `handle_new_user`, so this is always an update.
 * `calorie_target`, `daily_deficit` and `estimated_completion_date` must be the
 * server-recomputed values — never a number the client supplied (Rule 14).
 */
export async function updateProfile(db: Db, userId: string, patch: ProfileUpdate): Promise<Profile> {
  const { data, error } = await db
    .from('profiles')
    .update(patch)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw new QueryError('updateProfile', error)
  return data
}

// ---------------------------------------------------------------------------
// Subscriptions — documented, never enforced in this build (Rule 16)
// ---------------------------------------------------------------------------

export async function getSubscription(db: Db, workspaceId: string): Promise<Subscription | null> {
  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('workspace_id', workspaceId)
    .maybeSingle()
  if (error) throw new QueryError('getSubscription', error)
  return data
}

// ---------------------------------------------------------------------------
// Pantry
// ---------------------------------------------------------------------------

export interface PantryByExpiry {
  /** Dated items, soonest expiry first — the spoilage priority order. */
  perishable: PantryItem[]
  /**
   * NULL-expiry permanent staples. SPEC.md § 4.6: excluded from the
   * spoilage-priority sort, NOT sorted to either end of it. They are returned
   * as their own set so a caller cannot accidentally rank them against a date.
   */
  staples: PantryItem[]
  /** Everything, for callers that need the whole pantry (e.g. generation). */
  all: PantryItem[]
}

export async function listPantryItems(db: Db, workspaceId: string): Promise<PantryByExpiry> {
  const { data, error } = await db
    .from('pantry_items')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('name', { ascending: true })
  if (error) throw new QueryError('listPantryItems', error)

  const all = data ?? []
  return {
    perishable: all.filter((item) => item.expiry_date !== null),
    staples: all.filter((item) => item.expiry_date === null),
    all,
  }
}

export async function getPantryItem(db: Db, itemId: string): Promise<PantryItem | null> {
  const { data, error } = await db.from('pantry_items').select('*').eq('id', itemId).maybeSingle()
  if (error) throw new QueryError('getPantryItem', error)
  return data
}

// ---------------------------------------------------------------------------
// Meal plans
// ---------------------------------------------------------------------------

export async function getMealPlanById(db: Db, planId: string): Promise<MealPlan | null> {
  const { data, error } = await db.from('meal_plans').select('*').eq('id', planId).maybeSingle()
  if (error) throw new QueryError('getMealPlanById', error)
  return data
}

/**
 * `weekStartDate` is a UTC calendar date string, `YYYY-MM-DD` (SPEC.md § 4.11).
 * Failed plans are excluded, matching the partial unique index that guards
 * against a double-tapped "Generate my week".
 */
export async function getMealPlanByWeek(
  db: Db,
  workspaceId: string,
  weekStartDate: string
): Promise<MealPlan | null> {
  const { data, error } = await db
    .from('meal_plans')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('week_start_date', weekStartDate)
    .neq('status', 'failed')
    .maybeSingle()
  if (error) throw new QueryError('getMealPlanByWeek', error)
  return data
}

/** Sunday first — `day_index` 0 is Sunday (SPEC.md § 4.8). */
export async function listMealPlanDays(db: Db, planId: string): Promise<MealPlanDay[]> {
  const { data, error } = await db
    .from('meal_plan_days')
    .select('*')
    .eq('meal_plan_id', planId)
    .order('day_index', { ascending: true })
  if (error) throw new QueryError('listMealPlanDays', error)
  return data ?? []
}

export async function getMealPlanDay(db: Db, dayId: string): Promise<MealPlanDay | null> {
  const { data, error } = await db.from('meal_plan_days').select('*').eq('id', dayId).maybeSingle()
  if (error) throw new QueryError('getMealPlanDay', error)
  return data
}
