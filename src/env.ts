import { z } from 'zod'

/**
 * Zod-validated environment loading, split into a server schema and a client
 * schema (CLAUDE.md Rule 11).
 *
 * Only `NEXT_PUBLIC_`-prefixed variables may appear in the client schema. The
 * variable names and their REQUIRED / FEATURE / OPTIONAL buckets come from
 * SPEC.md § 11 and nowhere else.
 *
 * Every `process.env.X` below is referenced statically and by name. Next.js
 * inlines client-side environment variables at build time by static reference,
 * so a dynamic lookup over `process.env` would silently resolve to undefined in
 * the browser bundle.
 */

/** The Anthropic model id. Stated once here; never hardcoded at a call site (Rule 13). */
const DEFAULT_AI_MODEL = 'claude-sonnet-5'

const clientSchema = z.object({
  // REQUIRED
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
})

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // REQUIRED
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // FEATURE — the dependent feature degrades without these, the app still boots.
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  AI_MODEL: z.string().min(1).default(DEFAULT_AI_MODEL),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  USDA_FDC_API_KEY: z.string().min(1).optional(),

  // NON-SECRET, REQUIRED HEADER — Open Food Facts usage guidelines.
  OPEN_FOOD_FACTS_USER_AGENT: z.string().min(1).optional(),

  // OPTIONAL
  SENTRY_DSN: z.string().min(1).optional(),
  AI_MOCK: z.enum(['0', '1']).optional(),
})

export type ClientEnv = z.infer<typeof clientSchema>
export type ServerEnv = z.infer<typeof serverSchema>

class EnvValidationError extends Error {
  constructor(scope: 'client' | 'server', issues: readonly z.core.$ZodIssue[]) {
    const lines = issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    super(
      `Invalid ${scope} environment. Fix these variables (see .env.example and SPEC.md § 11):\n` +
        lines.join('\n')
    )
    this.name = 'EnvValidationError'
  }
}

function parseOrThrow<T extends z.ZodType>(
  schema: T,
  raw: unknown,
  scope: 'client' | 'server'
): z.infer<T> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new EnvValidationError(scope, result.error.issues)
  }
  return result.data
}

function readClientEnv(): ClientEnv {
  return parseOrThrow(
    clientSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    'client'
  )
}

function readServerEnv(): ServerEnv {
  return parseOrThrow(
    serverSchema,
    {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      AI_MODEL: process.env.AI_MODEL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      USDA_FDC_API_KEY: process.env.USDA_FDC_API_KEY,
      OPEN_FOOD_FACTS_USER_AGENT: process.env.OPEN_FOOD_FACTS_USER_AGENT,
      SENTRY_DSN: process.env.SENTRY_DSN,
      AI_MOCK: process.env.AI_MOCK,
    },
    'server'
  )
}

const isServer = typeof window === 'undefined'

/** Validated `NEXT_PUBLIC_` variables. Safe to import from a client component. */
export const clientEnv: ClientEnv = readClientEnv()

/**
 * Validated server variables. Parsed eagerly at module load on the server, so a
 * missing REQUIRED variable fails loudly at boot rather than at first request.
 *
 * On the client this is a proxy that throws on any property access — a secret
 * must never be read in the browser (Rule 11).
 */
export const serverEnv: ServerEnv = isServer
  ? readServerEnv()
  : (new Proxy({} as ServerEnv, {
      get(_target, property) {
        throw new Error(
          `serverEnv.${String(property)} was read in the browser. Server environment ` +
            `variables are server-only (CLAUDE.md Rule 11).`
        )
      },
    }) satisfies ServerEnv)

/** Validate both schemas up front. Used by `npm run env:validate`. */
export function validateEnv(): void {
  readClientEnv()
  readServerEnv()
}
