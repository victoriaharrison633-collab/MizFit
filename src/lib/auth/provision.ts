import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Workspace provisioning, in the application, as a fallback for the
 * `handle_new_user` trigger.
 *
 * WHY THIS EXISTS — read before deleting it.
 *
 * `CLAUDE.md` says the app never re-implements seeding, and that is still the
 * right rule: the 54-item list lives in exactly one place, the
 * `seed_baseline_pantry()` function in migration 0007, and this calls that
 * function rather than carrying a second copy of the list.
 *
 * What this does replace is the *trigger* that used to call it. On the hosted
 * Supabase project every insert into `auth.users` was being rejected by that
 * trigger — signup and the demo door both failed, while login worked — and the
 * local stack could not reproduce it. Rather than keep guessing at a difference
 * we could not see, the trigger comes off the hot path and the app does the
 * same five inserts under the service role, where the failure is visible and
 * fixable.
 *
 * It is idempotent: it looks for an existing membership first, so it is safe to
 * call on every signup, including for a user the trigger already provisioned.
 * That means it works whether or not the trigger is still installed.
 *
 * Service-role use is justified (Rule 11): a user who has just been created has
 * no session yet, so there is no anon-key path that can write these rows.
 */
export interface ProvisionResult {
  workspaceId: string
  /** False when the workspace already existed and nothing was written. */
  created: boolean
}

export async function provisionWorkspace(
  userId: string,
  email: string | null
): Promise<ProvisionResult> {
  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.workspace_id) {
    return { workspaceId: existing.workspace_id, created: false }
  }

  // SPEC.md § 4.2: the workspace is named "<email local part>'s kitchen".
  const localPart = (email ?? '').split('@')[0]?.trim()
  const name = `${localPart && localPart.length > 0 ? localPart : 'My'}'s kitchen`

  const { data: workspace, error: workspaceError } = await admin
    .from('workspaces')
    .insert({ name, owner_user_id: userId })
    .select('id')
    .single()

  if (workspaceError || !workspace) {
    throw new Error(`workspace insert failed: ${workspaceError?.message}`)
  }

  const { error: memberError } = await admin
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: userId, role: 'owner' })
  if (memberError) throw new Error(`workspace_members insert failed: ${memberError.message}`)

  const { error: profileError } = await admin
    .from('profiles')
    .insert({ user_id: userId, workspace_id: workspace.id })
  if (profileError) throw new Error(`profiles insert failed: ${profileError.message}`)

  const { error: subscriptionError } = await admin
    .from('subscriptions')
    .insert({ workspace_id: workspace.id, tier: 'free', status: 'trialing' })
  if (subscriptionError)
    throw new Error(`subscriptions insert failed: ${subscriptionError.message}`)

  // The one source of the 54-item baseline list (SPEC.md § 5). A failure here
  // is logged but not fatal: an account with an empty pantry is still usable,
  // and losing the whole signup over it would be worse.
  const { error: seedError } = await admin.rpc('seed_baseline_pantry', {
    p_workspace_id: workspace.id,
  })
  if (seedError) {
    console.error('[provision] baseline pantry seeding failed', {
      workspaceId: workspace.id,
      reason: seedError.message,
    })
  }

  return { workspaceId: workspace.id, created: true }
}
