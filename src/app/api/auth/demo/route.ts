import { NextResponse } from 'next/server'
import { withPublicApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { provisionWorkspace } from '@/lib/auth/provision'
import { clientEnv } from '@/env'

/**
 * POST /api/auth/demo — the one-click demo door.
 *
 * DEVIATION, DELIBERATE: this route is not in SPEC.md § 6 (Rule 6). It exists so
 * a hackathon judge reaches the product instead of a signup form. It is a demo
 * affordance, not a product feature, and it should be deleted — along with the
 * button on the landing page — before this app is used by real people. Nothing
 * else depends on it.
 *
 * It provisions a **real** account rather than faking a session: a random
 * address, a random password nobody keeps, and `email_confirm: true`. That
 * matters because every judge then gets their own workspace, their own 54
 * seeded pantry items and their own meal plan, all under the same RLS as a
 * normal user. There is no shared demo account to collide on.
 *
 * `createUser` is a justified service-role call (Rule 11): creating an account
 * for someone who has not authenticated has no anon-key equivalent. It also
 * goes through the same `handle_new_user` trigger as a normal signup, so the
 * seeded pantry is the real one.
 */
export const POST = withPublicApiHandler(
  // Its own bucket, not the signup one: reviewers frequently share a single
  // office or campus IP, and a five-per-hour ceiling locks all of them out
  // after the first few clicks. Still capped — it creates accounts (Rule 10).
  { method: 'POST', rateLimit: 'auth:demo' },
  async (ctx) => {
    const suffix = crypto.randomUUID().slice(0, 8)
    const email = `demo-${suffix}@mizfit-demo.app`
    // Never shown, never emailed, never reused. Long enough that the account is
    // not reachable by guessing once the browser session is gone.
    const password = `Dm${crypto.randomUUID()}${crypto.randomUUID().slice(0, 8)}!aA1`

    const admin = createAdminClient()
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      throw new ApiError('INTERNAL', {
        publicMessage: 'The demo could not start. Please try again in a moment.',
        detail: `demo createUser failed: ${createError.message}`,
        cause: createError,
      })
    }

    // Idempotent: does nothing if the trigger already provisioned this user.
    if (created?.user) {
      try {
        await provisionWorkspace(created.user.id, created.user.email ?? email)
      } catch (thrown) {
        throw new ApiError('INTERNAL', {
          publicMessage: 'The demo could not start. Please try again in a moment.',
          detail: `demo provisioning failed: ${thrown instanceof Error ? thrown.message : 'unknown'}`,
          cause: thrown,
        })
      }
    }

    const { error: signInError } = await ctx.db.auth.signInWithPassword({ email, password })

    if (signInError) {
      throw new ApiError('INTERNAL', {
        publicMessage: 'The demo could not start. Please try again in a moment.',
        detail: `demo sign-in failed: ${signInError.message}`,
        cause: signInError,
      })
    }

    // 303 so the browser follows a form POST with a GET. A 307 would re-post to
    // /chat and get a 405.
    return NextResponse.redirect(new URL('/chat', clientEnv.NEXT_PUBLIC_APP_URL), 303)
  }
)
