import { withPublicApiHandler } from '@/lib/security/api-handler'

/**
 * POST /api/auth/logout (SPEC.md § 6)
 *
 * Clears the SSR cookie session. Signing out with no session is a no-op that
 * still returns 204 — there is nothing to report and nothing to leak.
 */
export const POST = withPublicApiHandler({ method: 'POST', rateLimit: 'mutation' }, async (ctx) => {
  await ctx.db.auth.signOut()
  // No body: 204.
})
