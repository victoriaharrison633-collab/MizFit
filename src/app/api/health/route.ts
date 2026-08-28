import { withPublicApiHandler } from '@/lib/security/api-handler'
import { clientEnv, serverEnv } from '@/env'

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

/**
 * TEMPORARY DIAGNOSTIC — delete with the deploy that fixes the auth failure.
 *
 * `GET /api/health?debug=auth` reports what the server actually sees and what
 * Supabase actually answers. It returns no secret: the project URL is public,
 * the key is reported only as a length and a prefix shape, and the body is
 * Supabase's own error text.
 *
 * It exists because four fixes inferred from the symptom were all wrong, and
 * the server logs were not reachable from this session.
 */
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (new URL(request.url).searchParams.get('debug') !== 'auth') {
    return Response.json(
      { error: { code: 'NOT_FOUND', message: 'We could not find that.' } },
      { status: 404 }
    )
  }

  const origin = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY
  const target = `${origin}/auth/v1/admin/users`

  let status = 0
  let body = ''
  try {
    const response = await fetch(target, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `probe-${Date.now()}@mizfit-demo.app`,
        password: 'Probe1!probe1!',
        email_confirm: true,
      }),
    })
    status = response.status
    body = (await response.text()).slice(0, 400)
  } catch (error) {
    body = `fetch threw: ${error instanceof Error ? error.message : 'unknown'}`
  }

  const expected = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_APP_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'AI_MOCK',
  ]

  return Response.json({
    // Which of the expected names are actually present in this runtime, and
    // any near-miss names (a stray space or lowercase letter in the key name
    // makes a variable invisible to the app while looking correct in a UI).
    env_present: Object.fromEntries(expected.map((name) => [name, Boolean(process.env[name])])),
    env_keys_containing_supabase: Object.keys(process.env)
      .filter((name) => name.toUpperCase().includes('SUPABASE'))
      .map((name) => `${JSON.stringify(name)} len=${(process.env[name] ?? '').length}`),
    // First 14 characters only: enough to tell sb_publishable_ from sb_secret_
    // from a JWT header, and not enough to be a credential.
    service_key_prefix: key.slice(0, 14),
    anon_key_prefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').slice(0, 14),
    anon_key_length: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').length,
    vercel_env: process.env.VERCEL_ENV ?? null,
    vercel_commit: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7) || null,
    configured_supabase_origin: origin,
    configured_app_url: clientEnv.NEXT_PUBLIC_APP_URL,
    service_key_length: key.length,
    service_key_shape: key.startsWith('eyJ')
      ? 'legacy-jwt'
      : key.startsWith('sb_')
        ? 'new-style-sb_'
        : 'unrecognised',
    target_url: target,
    supabase_status: status,
    supabase_body: body,
  })
}
