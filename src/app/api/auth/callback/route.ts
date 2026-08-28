import { NextResponse } from 'next/server'
import { withPublicApiHandler } from '@/lib/security/api-handler'
import { callbackQuerySchema } from '@/lib/auth/schemas'
import { clientEnv } from '@/env'

/**
 * GET /api/auth/callback (SPEC.md § 6)
 *
 * Where the emailed password-reset link lands. It exchanges the one-time token
 * for a session cookie and sends the user to the form that uses it.
 *
 * `verifyOtp` consumes the token, so the same link clicked twice fails the
 * second time and lands on the "ask for another" page. This build issues no
 * verification links — `recovery` is the only type that reaches here (SPEC.md
 * § 3, G-06).
 *
 * Both outcomes are redirects, never JSON: a person clicked a link in their
 * inbox, and an error object rendered in a browser tab is not an answer.
 */

function redirectTo(path: string): NextResponse {
  return NextResponse.redirect(new URL(path, clientEnv.NEXT_PUBLIC_APP_URL))
}

export const GET = withPublicApiHandler(
  { method: 'GET', rateLimit: 'auth:reset-password', query: callbackQuerySchema },
  async (ctx) => {
    const { token_hash: tokenHash, type } = ctx.query

    if (!tokenHash || !type) {
      console.warn('[auth] Callback reached without a usable token')
      return redirectTo('/forgot-password?status=invalid_link')
    }

    const { error } = await ctx.db.auth.verifyOtp({ type, token_hash: tokenHash })

    if (error) {
      // Expired, already used, or tampered with — all the same to the user, and
      // all the same answer: ask for a fresh link.
      console.warn('[auth] Recovery token rejected', { reason: error.message })
      return redirectTo('/forgot-password?status=invalid_link')
    }

    return redirectTo('/reset-password')
  }
)
