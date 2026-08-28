import { withPublicApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { signupSchema } from '@/lib/auth/schemas'

/**
 * POST /api/auth/signup (SPEC.md § 6)
 *
 * Creating the user fires the `handle_new_user` trigger from Prompt 3, which
 * seeds the workspace, membership, profile, trial subscription, and all 54
 * baseline pantry items in one transaction. This route never seeds anything
 * itself.
 *
 * The session is issued here, so the chat is reachable immediately — there is
 * no verification step to wait on in this build (SPEC.md § 3, G-06).
 */
export const POST = withPublicApiHandler(
  {
    method: 'POST',
    // Its own bucket: each signup writes 57 rows and sends the user into the
    // one flow that later costs money (Rule 10).
    rateLimit: 'auth:signup',
    body: signupSchema,
    successStatus: 201,
  },
  async (ctx) => {
    const { data, error } = await ctx.db.auth.signUp({
      email: ctx.body.email,
      password: ctx.body.password,
    })

    if (error) {
      // Deliberately does not say "that email is already registered". Signup
      // cannot fully hide which addresses exist — creating a duplicate has to
      // fail — but it does not have to confirm it either. The rate-limit bucket
      // is what makes enumerating addresses through this route impractical.
      throw new ApiError('VALIDATION_FAILED', {
        publicMessage:
          'We could not create that account. If you already have one, sign in instead.',
        detail: `signUp failed: ${error.message}`,
        cause: error,
      })
    }

    if (!data.session || !data.user) {
      // Reachable only if the Supabase project has email confirmations turned
      // on, which this build does not use. Better a loud 500 with the reason in
      // the log than a signup that silently leaves the user with no session.
      throw new ApiError('INTERNAL', {
        detail:
          'signUp returned no session. The Supabase project has email confirmations enabled; ' +
          'this build requires them off (SPEC.md § 3, G-06).',
      })
    }

    // The session lives in the SSR cookies the client just set. Nothing about
    // the token is echoed into the body (Rule 11).
    return { user: { id: data.user.id, email: data.user.email } }
  }
)
