import { withPublicApiHandler } from '@/lib/security/api-handler'
import { forgotPasswordSchema } from '@/lib/auth/schemas'
import { sendPasswordResetEmail } from '@/lib/auth/email'
import { createAdminClient } from '@/lib/supabase/admin'
import { clientEnv } from '@/env'

/**
 * POST /api/auth/forgot-password (SPEC.md § 6)
 *
 * **Always 200, always the same body.** Whether the address has an account is
 * exactly what this route must not reveal, so every branch — unknown address,
 * mail failure, missing API key — ends in the same response.
 *
 * Timing is the other half of that promise. The real path makes two network
 * calls the unknown-address path does not, so the response is held to a floor
 * that comfortably exceeds both; a stopwatch cannot separate them either.
 */

/**
 * The floor both branches are padded to. It has to sit above the real path's
 * own cost, or the padding stops dominating and the difference reappears.
 *
 * Measured warm against a local Supabase stack: both branches land within 8ms
 * of each other at a 1200ms floor. The margin here covers the Resend call that
 * a local run does not make. If a production trace ever shows the real branch
 * exceeding this, raise it — the number is a measurement, not a constant.
 */
const MIN_RESPONSE_MS = 1500

async function holdUntilFloor(startedAt: number): Promise<void> {
  const remaining = MIN_RESPONSE_MS - (Date.now() - startedAt)
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining))
  }
}

export const POST = withPublicApiHandler(
  {
    method: 'POST',
    // Its own bucket: this route sends mail to an address the caller names, so
    // it is the natural lever for both spam and enumeration (Rule 10).
    rateLimit: 'auth:forgot-password',
    body: forgotPasswordSchema,
  },
  async (ctx) => {
    const startedAt = Date.now()

    try {
      // Service-role, and justified (Rule 11): minting a recovery token for an
      // address the caller has *not* authenticated as is inherently an admin
      // operation. There is no anon-key equivalent, and RLS has no bearing on
      // it — this is Supabase's auth schema, not ours.
      const admin = createAdminClient()
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email: ctx.body.email,
      })

      if (error) {
        // The overwhelmingly common cause is "no such user", which is not an
        // error condition here — it is the branch this route exists to hide.
        console.warn('[auth] No recovery link generated', { reason: error.message })
      } else {
        const resetUrl = new URL('/api/auth/callback', clientEnv.NEXT_PUBLIC_APP_URL)
        resetUrl.searchParams.set('token_hash', data.properties.hashed_token)
        resetUrl.searchParams.set('type', 'recovery')

        await sendPasswordResetEmail({ to: ctx.body.email, resetUrl: resetUrl.toString() })
      }
    } catch (error) {
      // Swallowed on purpose. A 500 here would answer "does this address have
      // an account?" with a status code.
      console.error('[auth] Password reset flow threw', error)
    }

    await holdUntilFloor(startedAt)

    return {
      ok: true,
      message: 'If that address has an account, a reset link is on its way.',
    }
  }
)
