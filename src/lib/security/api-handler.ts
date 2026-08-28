import 'server-only'

import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Db } from '@/lib/db/queries'
import { ApiError, logApiError, toApiError, validationError, type ApiErrorBody } from './errors'
import { getActiveWorkspace, requireUser, type ActiveWorkspace } from './ownership'
import {
  assertWithinRateLimit,
  rateLimitHeaders,
  type RateLimitBucket,
  type RateLimitResult,
} from './rate-limit'

/**
 * The one wrapper every API route in this app goes through (CLAUDE.md Rule 7).
 *
 * The pipeline order is fixed and is the whole point of the module:
 *
 *   method check -> auth session -> rate limit -> Zod validation -> workspace
 *   ownership -> handler -> typed error response
 *
 * Each step refuses work the next one would otherwise have to do: a wrong
 * method never reaches the database, an anonymous caller never spends a
 * rate-limit token, and an unvalidated id never reaches an ownership query.
 *
 * No route re-implements any of these steps, and no route returns a raw error.
 */

/** The four methods SPEC.md § 6 uses. Nothing else is routable in this build. */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/**
 * Next 15 hands route params to the handler as a promise. A route with no
 * dynamic segment is called with no second argument at all.
 */
export interface RouteContext {
  params: Promise<Record<string, string | string[] | undefined>>
}

/** Every route reads params through `parseParams`, which tolerates their absence. */

interface RequestContext {
  request: NextRequest
  /** Correlates the client's response headers with the server log line. */
  requestId: string
  /** Request-scoped Supabase client carrying the caller's cookie session. */
  db: Db
}

export interface PublicContext<TBody, TParams, TQuery> extends RequestContext {
  body: TBody
  params: TParams
  query: TQuery
}

export interface AuthedContext<TBody, TParams, TQuery> extends PublicContext<
  TBody,
  TParams,
  TQuery
> {
  user: User
  workspace: ActiveWorkspace
}

export interface HandlerContext<TBody, TParams, TQuery, TResources> extends AuthedContext<
  TBody,
  TParams,
  TQuery
> {
  /** Whatever `loadResources` returned — already ownership-checked. */
  resources: TResources
}

interface BaseConfig<TBody, TParams, TQuery> {
  method: HttpMethod | readonly HttpMethod[]
  /** Zod schemas for the request. A part with no schema arrives as `undefined`. */
  body?: z.ZodType<TBody>
  params?: z.ZodType<TParams>
  query?: z.ZodType<TQuery>
  /** Status for a handler that returns a value. A handler returning nothing gives 204. */
  successStatus?: number
}

export interface AuthedConfig<TBody, TParams, TQuery, TResources> extends BaseConfig<
  TBody,
  TParams,
  TQuery
> {
  /**
   * Defaults to the `mutation` bucket for a mutating method and `read` for GET.
   * Name a bucket explicitly on the routes that need their own (Rule 10).
   */
  rateLimit?: RateLimitBucket
  /**
   * The ownership step. Load every row the handler will touch and pass each one
   * through `assertWorkspaceOwnership` / `assertPlanDayOwnership` from
   * `./ownership`. It runs after validation, so the ids are already parsed, and
   * before the handler, so the handler never sees a row it does not own.
   */
  loadResources?: (context: AuthedContext<TBody, TParams, TQuery>) => Promise<TResources>
}

export interface PublicConfig<TBody, TParams, TQuery> extends BaseConfig<TBody, TParams, TQuery> {
  /** Required, not defaulted: an unauthenticated route is the abusable one. */
  rateLimit: RateLimitBucket | false
}

/**
 * Next's own route-handler contract: the second argument is always passed, and
 * it is not optional in the generated type check.
 */
type RouteHandler = (request: NextRequest, context: RouteContext) => Promise<NextResponse>

/**
 * A JSON body above this size is rejected before parsing. Nothing this app
 * accepts is remotely this large — the biggest body in SPEC.md § 6 is a profile
 * patch or a five-element cuisine array — so the cap only ever catches abuse.
 */
const MAX_BODY_BYTES = 64 * 1024

function allowedMethods(method: HttpMethod | readonly HttpMethod[]): readonly HttpMethod[] {
  return typeof method === 'string' ? [method] : method
}

function assertMethod(request: NextRequest, methods: readonly HttpMethod[]): void {
  if (methods.includes(request.method as HttpMethod)) return

  throw new ApiError('METHOD_NOT_ALLOWED', {
    detail: `${request.method} is not allowed here; expected ${methods.join(', ')}`,
    headers: { Allow: methods.join(', ') },
  })
}

/**
 * The rate-limit identifier for an unauthenticated request. `x-forwarded-for`
 * is set by Vercel's proxy and its leftmost entry is the client. It is spoofable
 * behind a proxy that does not overwrite it, which is why every authenticated
 * route keys on the user id instead and only the auth routes rely on this.
 */
function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip')?.trim()
  return `ip:${ip || 'unknown'}`
}

async function parseBody<T>(request: NextRequest, schema: z.ZodType<T> | undefined): Promise<T> {
  if (!schema) return undefined as T

  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ApiError('VALIDATION_FAILED', {
      publicMessage: 'That request is too large.',
      detail: `Body of ${declaredLength} bytes exceeds the ${MAX_BODY_BYTES} byte cap`,
    })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch (error) {
    throw new ApiError('VALIDATION_FAILED', {
      publicMessage: 'That request body could not be read.',
      detail: 'Request body was not valid JSON',
      cause: error,
    })
  }

  const result = schema.safeParse(raw)
  if (!result.success) throw validationError(result.error, 'body')
  return result.data
}

async function parseParams<T>(
  routeContext: RouteContext | undefined,
  schema: z.ZodType<T> | undefined
): Promise<T> {
  if (!schema) return undefined as T

  const raw = (await routeContext?.params) ?? {}
  const result = schema.safeParse(raw)
  if (!result.success) throw validationError(result.error, 'params')
  return result.data
}

function parseQuery<T>(request: NextRequest, schema: z.ZodType<T> | undefined): T {
  if (!schema) return undefined as T

  const raw = Object.fromEntries(request.nextUrl.searchParams.entries())
  const result = schema.safeParse(raw)
  if (!result.success) throw validationError(result.error, 'query')
  return result.data
}

/**
 * A successful response reports what is left of the caller's bucket, so the UI
 * can warn before the user hits the wall rather than after (`X-RateLimit-*`).
 * The cap is enforced server-side either way — these headers only inform.
 */
function successResponse(
  result: unknown,
  requestId: string,
  rateLimit: RateLimitResult | undefined,
  successStatus?: number
): NextResponse {
  const headers = {
    ...(rateLimit ? rateLimitHeaders(rateLimit) : {}),
    'x-request-id': requestId,
  }

  if (result instanceof NextResponse) {
    for (const [name, value] of Object.entries(headers)) {
      result.headers.set(name, value)
    }
    return result
  }

  if (result === undefined) {
    return new NextResponse(null, { status: 204, headers })
  }

  return NextResponse.json(result, { status: successStatus ?? 200, headers })
}

function errorResponse(error: unknown, request: NextRequest, requestId: string): NextResponse {
  const apiError = toApiError(error)

  logApiError(apiError, {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
  })

  const body: ApiErrorBody = apiError.toBody()
  return NextResponse.json(body, {
    status: apiError.status,
    headers: { ...apiError.headers, 'x-request-id': requestId },
  })
}

/**
 * The authenticated pipeline. Everything in SPEC.md § 6 except the six auth
 * routes and `/api/health` uses this.
 */
export function withApiHandler<
  TBody = undefined,
  TParams = undefined,
  TQuery = undefined,
  TResources = undefined,
>(
  config: AuthedConfig<TBody, TParams, TQuery, TResources>,
  handler: (context: HandlerContext<TBody, TParams, TQuery, TResources>) => Promise<unknown>
): RouteHandler {
  const methods = allowedMethods(config.method)
  const defaultBucket: RateLimitBucket = methods.every((method) => method === 'GET')
    ? 'read'
    : 'mutation'

  return async function route(request, routeContext) {
    const requestId = crypto.randomUUID()

    try {
      // 1. Method — before any auth or database work.
      assertMethod(request, methods)

      // 2. Auth session.
      const db = (await createClient()) as Db
      const user = await requireUser(db)

      // 3. Rate limit, keyed per user and per route.
      const rateLimit = await assertWithinRateLimit(config.rateLimit ?? defaultBucket, user.id)

      // 4. Zod validation of body, params, and query.
      const body = await parseBody(request, config.body)
      const params = await parseParams(routeContext, config.params)
      const query = parseQuery(request, config.query)

      // 5. Workspace resolution and ownership of every row the handler touches.
      const workspace = await getActiveWorkspace(db, user.id)
      const authed: AuthedContext<TBody, TParams, TQuery> = {
        request,
        requestId,
        db,
        body,
        params,
        query,
        user,
        workspace,
      }
      const resources = config.loadResources
        ? await config.loadResources(authed)
        : (undefined as TResources)

      // 6. Handler.
      const result = await handler({ ...authed, resources })

      return successResponse(result, requestId, rateLimit, config.successStatus)
    } catch (error) {
      // 7. Typed error response.
      return errorResponse(error, request, requestId)
    }
  }
}

/**
 * The same pipeline for the routes that cannot have a session yet: the six auth
 * routes (SPEC.md § 6) and `/api/health`. Steps 2 and 5 are absent because
 * there is no user to authenticate and no workspace to own anything — every
 * other step, including the typed error response, is identical.
 *
 * This is not an escape hatch. Any route with a caller identity uses
 * `withApiHandler`.
 */
export function withPublicApiHandler<TBody = undefined, TParams = undefined, TQuery = undefined>(
  config: PublicConfig<TBody, TParams, TQuery>,
  handler: (context: PublicContext<TBody, TParams, TQuery>) => Promise<unknown>
): RouteHandler {
  const methods = allowedMethods(config.method)

  return async function route(request, routeContext) {
    const requestId = crypto.randomUUID()

    try {
      // 1. Method.
      assertMethod(request, methods)

      // 2. No auth session — this route exists to be reached without one.

      // 3. Rate limit, keyed on the client address since there is no user id.
      const rateLimit =
        config.rateLimit === false
          ? undefined
          : await assertWithinRateLimit(config.rateLimit, clientIdentifier(request))

      // 4. Zod validation.
      const body = await parseBody(request, config.body)
      const params = await parseParams(routeContext, config.params)
      const query = parseQuery(request, config.query)

      // 5. No workspace ownership — there is no workspace in scope.

      // 6. Handler.
      const db = (await createClient()) as Db
      const result = await handler({ request, requestId, db, body, params, query })

      return successResponse(result, requestId, rateLimit, config.successStatus)
    } catch (error) {
      // 7. Typed error response.
      return errorResponse(error, request, requestId)
    }
  }
}
