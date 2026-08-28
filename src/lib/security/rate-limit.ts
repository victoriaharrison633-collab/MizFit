import 'server-only'

import { Ratelimit, type Duration } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { serverEnv } from '@/env'
import { ApiError } from './errors'

/**
 * Upstash Redis rate limiting, bucketed per user AND per route (CLAUDE.md Rule 10).
 *
 * The bucket name is the route dimension and the identifier is the caller
 * dimension, so `mealplan:generate` for one user never spends another user's
 * budget, and a user's meal-plan budget is separate from their pantry edits.
 *
 * If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing, or Redis
 * itself is unreachable:
 *   - development → **fail open** with a loud warning on every check, so a
 *     contributor without Upstash credentials can still run the app;
 *   - production  → **fail closed** (429), because an unenforceable limit in
 *     front of a route that spends money at Anthropic is not a limit.
 *
 * `import 'server-only'` keeps the REST token out of any client bundle (Rule 11).
 */

export interface RateLimitBucketConfig {
  tokens: number
  window: Duration
  /** Why this bucket exists and why the numbers are what they are. */
  reason: string
}

/**
 * The AI buckets are the strictest because they are the only ones that cost
 * real money per request; their numbers come from BUILD.md's Prompt 4 brief.
 * The rest are chosen defaults — generous enough not to interrupt a demo, tight
 * enough to blunt scripted abuse.
 */
export const RATE_LIMIT_BUCKETS = {
  'mealplan:generate': {
    tokens: 5,
    window: '1 h',
    reason: 'One Anthropic call per generation — the most expensive route in the app.',
  },
  'mealplan:regenerate': {
    tokens: 20,
    window: '1 h',
    reason: 'One Anthropic call per day regenerated; a whole week is 7 of them.',
  },
  'auth:signup': {
    tokens: 5,
    window: '1 h',
    reason: 'Own bucket — each signup seeds a workspace and 54 pantry rows.',
  },
  'auth:forgot-password': {
    tokens: 5,
    window: '1 h',
    reason: 'Own bucket — blunts account enumeration and reset-email flooding.',
  },
  'auth:login': {
    tokens: 10,
    window: '15 m',
    reason: 'Slows credential stuffing without locking out a mistyped password.',
  },
  'auth:reset-password': {
    tokens: 5,
    window: '1 h',
    reason: 'Reset tokens are single-use; repeated attempts are guessing.',
  },
  mutation: {
    tokens: 60,
    window: '1 m',
    reason: 'Default for any mutating route without its own bucket (Rule 10).',
  },
  read: {
    tokens: 120,
    window: '1 m',
    reason: 'Default for reads. The chat polls a plan while it renders.',
  },
} as const satisfies Record<string, RateLimitBucketConfig>

export type RateLimitBucket = keyof typeof RATE_LIMIT_BUCKETS

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  /** Unix ms at which the window resets. */
  reset: number
  /** False when the check could not be enforced and development let it through. */
  enforced: boolean
}

const isProduction = serverEnv.NODE_ENV === 'production'

/** `undefined` = not yet resolved, `null` = credentials absent. */
let redisClient: Redis | null | undefined
const limiters = new Map<RateLimitBucket, Ratelimit>()

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient

  const url = serverEnv.UPSTASH_REDIS_REST_URL
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN
  redisClient = url && token ? new Redis({ url, token }) : null
  return redisClient
}

function getLimiter(bucket: RateLimitBucket, redis: Redis): Ratelimit {
  const existing = limiters.get(bucket)
  if (existing) return existing

  const config = RATE_LIMIT_BUCKETS[bucket]
  const limiter = new Ratelimit({
    redis,
    // Sliding window, so a caller cannot spend a whole bucket at the end of one
    // window and the whole bucket again at the start of the next.
    limiter: Ratelimit.slidingWindow(config.tokens, config.window),
    prefix: `mizfit:rl:${bucket}`,
    analytics: false,
  })
  limiters.set(bucket, limiter)
  return limiter
}

/**
 * Loud, every time — not once per process. A warning that prints once is a
 * warning a developer scrolls past, and this one says the app is running with
 * an unenforced limit.
 */
function warnUnenforced(bucket: RateLimitBucket, cause: string): void {
  console.warn(
    `[rate-limit] NOT ENFORCED for "${bucket}" — ${cause}. ` +
      'Requests are being allowed through because NODE_ENV is not production. ' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enforce it. ' +
      'In production this request would have been rejected with 429.'
  )
}

/** How long a fail-closed rejection asks the caller to wait. */
const FAIL_CLOSED_RETRY_MS = 60_000

function unenforceable(bucket: RateLimitBucket, cause: string): RateLimitResult {
  const config = RATE_LIMIT_BUCKETS[bucket]

  if (isProduction) {
    console.error(
      `[rate-limit] FAILING CLOSED for "${bucket}" — ${cause}. Rejecting the request (Rule 10).`
    )
    return {
      success: false,
      limit: config.tokens,
      remaining: 0,
      reset: Date.now() + FAIL_CLOSED_RETRY_MS,
      enforced: false,
    }
  }

  warnUnenforced(bucket, cause)
  return {
    success: true,
    limit: config.tokens,
    remaining: config.tokens,
    reset: Date.now(),
    enforced: false,
  }
}

/**
 * Consume one token from `bucket` for `identifier`.
 *
 * `identifier` is the authenticated user's id wherever there is a session, and
 * the client IP on the unauthenticated auth routes — those are exactly the
 * routes that exist to be abused before a session exists.
 */
export async function checkRateLimit(
  bucket: RateLimitBucket,
  identifier: string
): Promise<RateLimitResult> {
  const redis = getRedis()
  if (!redis) {
    return unenforceable(bucket, 'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN is not set')
  }

  try {
    const result = await getLimiter(bucket, redis).limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      enforced: true,
    }
  } catch (error) {
    const cause = error instanceof Error ? error.message : 'Redis call failed'
    return unenforceable(bucket, cause)
  }
}

/**
 * How much of the bucket is left, for a response that succeeded.
 *
 * Returned on every successful call so a client can show "2 generations left
 * this hour" and stop the user walking into a refusal they could not see
 * coming. The cap itself is enforced server-side and does not depend on the
 * client reading these.
 *
 * Nothing is returned when the check could not be enforced: a count we did not
 * actually compute would be a number the client trusts and we invented.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (!result.enforced) return {}

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  }
}

/**
 * The same headers for a rejection, plus `Retry-After` — the one header that
 * only makes sense once the answer is no. The limit and reset are stated even
 * when the check was unenforceable, because a fail-closed 429 still needs to
 * tell the caller when to come back.
 */
export function rateLimitRejectionHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))),
  }
}

/**
 * The form `withApiHandler` uses: consume a token or throw the typed 429.
 * No route calls this directly (Rule 7).
 */
export async function assertWithinRateLimit(
  bucket: RateLimitBucket,
  identifier: string
): Promise<RateLimitResult> {
  const result = await checkRateLimit(bucket, identifier)
  if (result.success) return result

  throw new ApiError('RATE_LIMITED', {
    detail: result.enforced
      ? `Bucket "${bucket}" exhausted for identifier ${identifier}`
      : `Bucket "${bucket}" could not be enforced; failing closed in production`,
    headers: rateLimitRejectionHeaders(result),
  })
}
