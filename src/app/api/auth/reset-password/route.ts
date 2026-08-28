import { withApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { resetPasswordSchema } from '@/lib/auth/schemas'

/**
 * POST /api/auth/reset-password (SPEC.md § 6)
 *
 * Runs on the session `/api/auth/callback` established from the emailed link,
 * which is why this is the one auth route behind the authenticated wrapper: no
 * valid link, no session, no password change. That is also what makes the link
 * single-use — `verifyOtp` consumes the token in the callback, so a second
 * click never gets far enough to reach this route.
 *
 * The policy comes from the shared schema and is never restated (SPEC.md § 2).
 */
export const POST = withApiHandler(
  { method: 'POST', rateLimit: 'auth:reset-password', body: resetPasswordSchema },
  async (ctx) => {
    const { error } = await ctx.db.auth.updateUser({ password: ctx.body.password })

    if (error) {
      // Supabase's own message is not forwarded (Rule 7); the one case worth
      // naming is named in our own words, and everything else is generic.
      const publicMessage =
        error.code === 'same_password'
          ? 'That is already your password. Choose a different one.'
          : 'That password could not be set. Please try again.'

      throw new ApiError('VALIDATION_FAILED', {
        publicMessage,
        detail: `updateUser failed: ${error.message}`,
        cause: error,
      })
    }

    return { ok: true }
  }
)
