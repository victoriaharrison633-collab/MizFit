import { withPublicApiHandler } from '@/lib/security/api-handler'

/**
 * GET /api/health (SPEC.md § 6)
 *
 * Unauthenticated liveness probe. It answers one question — is this process
 * up and serving? — and nothing else.
 *
 * No env values, no version, no commit sha, no database detail, and no database
 * call at all. A probe that reports what it is running is a probe that tells an
 * attacker which advisory to look up, and one that queries Postgres reports the
 * database's health as this process's health while leaking error text when it
 * fails.
 *
 * `rateLimit: false` on purpose: a monitor that can be answered with 429 is not
 * a monitor. Middleware skips this path entirely, so it also costs no auth
 * round-trip.
 */
export const GET = withPublicApiHandler({ method: 'GET', rateLimit: false }, async () => ({
  status: 'ok',
}))
