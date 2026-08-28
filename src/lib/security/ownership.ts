import 'server-only'

import type { User } from '@supabase/supabase-js'
import { listWorkspaceMemberships, type Db, type WorkspaceRole } from '@/lib/db/queries'
import { ApiError } from './errors'

/**
 * Session → workspace resolution and the server-side ownership check
 * (CLAUDE.md Rules 5, 9 and 12).
 *
 * RLS is already enabled on every table, and every policy resolves through
 * `workspace_members`. These functions run *on top of* that, because RLS is
 * defence in depth rather than the only check — a query written against the
 * service-role client, or a policy loosened by a future migration, would
 * otherwise have nothing standing behind it.
 *
 * A resource in another workspace is reported as **404, never 403**. A 403
 * confirms that the row exists, which is itself the disclosure.
 */

export interface ActiveWorkspace {
  id: string
  role: WorkspaceRole
}

/** Anything scoped by workspace: `pantry_items`, `meal_plans`, `grocery_gap_items`. */
export interface WorkspaceScoped {
  workspace_id: string
}

/**
 * The authenticated user, or a typed 401.
 *
 * `auth.getUser()` revalidates the token with the Supabase Auth server rather
 * than trusting the cookie's contents, which the browser can edit (Rule 12).
 */
export async function requireUser(db: Db): Promise<User> {
  const { data, error } = await db.auth.getUser()

  if (error || !data.user) {
    throw new ApiError('UNAUTHORIZED', {
      detail: error ? `auth.getUser failed: ${error.message}` : 'No session on the request',
      cause: error ?? undefined,
    })
  }

  return data.user
}

/**
 * The workspace a request acts in.
 *
 * A workspace is a household of one owner in this build, so a user has exactly
 * one membership and this resolves it deterministically — oldest membership
 * first. Phase 3's second member adds a row to the same table; when a user can
 * belong to more than one household, this is where a selector reads the active
 * one from, and nothing above it changes.
 */
export async function getActiveWorkspace(db: Db, userId: string): Promise<ActiveWorkspace> {
  const memberships = await listWorkspaceMemberships(db, userId)
  const [membership] = memberships

  if (!membership) {
    // `handle_new_user` creates the membership inside the same transaction as
    // the user, so this is a broken invariant rather than a user error — hence
    // 500 and a log, not a 403 that would suggest the caller did something.
    throw new ApiError('INTERNAL', {
      detail: `User ${userId} has no workspace membership; handle_new_user did not run`,
    })
  }

  return { id: membership.workspace_id, role: membership.role }
}

/**
 * Assert that a workspace-scoped row belongs to the caller's workspace, and
 * narrow away the `null` a `maybeSingle()` accessor returns.
 *
 * Missing and not-yours collapse into the same 404 on purpose: the caller
 * cannot tell a row that does not exist from one they may not see.
 */
export function assertWorkspaceOwnership<T extends WorkspaceScoped>(
  resource: T | null | undefined,
  workspaceId: string,
  label = 'resource'
): T {
  if (!resource) {
    throw new ApiError('NOT_FOUND', { detail: `No such ${label}` })
  }

  if (resource.workspace_id !== workspaceId) {
    throw new ApiError('NOT_FOUND', {
      detail: `Cross-workspace access to ${label}: row is in workspace ${resource.workspace_id}, caller is in ${workspaceId}`,
    })
  }

  return resource
}

/**
 * `meal_plan_days` carries no `workspace_id` — it hangs off `meal_plans`. Check
 * the parent plan's workspace, then that the day really belongs to that plan,
 * so a `[planId]`/`[dayId]` pair from two different plans cannot be stitched
 * together. Both failures are the same 404.
 */
export function assertPlanDayOwnership<
  TPlan extends WorkspaceScoped & { id: string },
  TDay extends { id: string; meal_plan_id: string },
>(day: TDay | null | undefined, plan: TPlan, workspaceId: string): TDay {
  assertWorkspaceOwnership(plan, workspaceId, 'meal plan')

  if (!day) {
    throw new ApiError('NOT_FOUND', { detail: 'No such meal plan day' })
  }

  if (day.meal_plan_id !== plan.id) {
    throw new ApiError('NOT_FOUND', {
      detail: `Meal plan day ${day.id} belongs to plan ${day.meal_plan_id}, not ${plan.id}`,
    })
  }

  return day
}
