import { withPublicApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { loginSchema } from '@/lib/auth/schemas'

/**
 * POST /api/auth/login (SPEC.md § 6)
 *
 * One failure message for every failure. An unknown address and a wrong
 * password are indistinguishable to the caller — a "no account with that email"
 * message is an account-enumeration oracle, and a helpful one.
 */
export const POST = withPublicApiHandler(
  { method: 'POST', rateLimit: 'auth:login', body: loginSchema },
  async (ctx) => {
    const { error } = await ctx.db.auth.signInWithPassword({
      email: ctx.body.email,
      password: ctx.body.password,
    })

    if (error) {
      throw new ApiError('UNAUTHORIZED', {
        publicMessage: 'Email or password is incorrect.',
        detail: `signInWithPassword failed: ${error.message}`,
        cause: error,
      })
    }

    return { ok: true }
  }
)
