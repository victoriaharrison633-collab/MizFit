import { z } from 'zod'

/**
 * The typed error taxonomy and the safe client mapping (CLAUDE.md Rule 7).
 *
 * Every failure leaving an API route is `{ error: { code, message } }`. A raw
 * `Error` message, a Postgres error, a Zod issue path, and a stack trace never
 * reach the client — the detail is logged server-side and the client gets an
 * app-authored string.
 *
 * This module is deliberately free of `import 'server-only'`: it holds no
 * secrets, and a client component that wants to switch on `ApiErrorCode` should
 * be able to import the union without pulling the server pipeline with it.
 */

export const API_ERROR_CODES = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'METHOD_NOT_ALLOWED',
  'INTERNAL',
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

const ERROR_STATUS: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 400,
  RATE_LIMITED: 429,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL: 500,
}

/**
 * The default client-facing copy for each code. Generic on purpose — nothing
 * here confirms whether a row exists, which field of a credential was wrong, or
 * what the server was doing when it failed.
 */
const ERROR_MESSAGE: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: 'You need to be signed in to do that.',
  FORBIDDEN: 'You do not have access to that.',
  NOT_FOUND: 'We could not find that.',
  VALIDATION_FAILED: 'Some of that information is not valid.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  METHOD_NOT_ALLOWED: 'That request method is not supported here.',
  INTERNAL: 'Something went wrong on our side. Please try again.',
}

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string }
}

export interface ApiErrorOptions {
  /**
   * App-authored copy shown to the client in place of the default for the code.
   *
   * Only ever a literal written by us — never a caught error's `message`, a
   * database error, or anything derived from a row the caller may not own.
   */
  publicMessage?: string
  /** Server-log-only detail. Never serialised into a response. */
  detail?: string
  /** Extra response headers, e.g. `Retry-After` on a 429, `Allow` on a 405. */
  headers?: Record<string, string>
  cause?: unknown
}

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly publicMessage: string
  readonly detail: string | undefined
  readonly headers: Record<string, string> | undefined

  constructor(code: ApiErrorCode, options: ApiErrorOptions = {}) {
    // `Error.message` carries the server-side detail so a stack trace in the
    // log is useful. It is never what the client is shown.
    super(options.detail ?? options.publicMessage ?? ERROR_MESSAGE[code], { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = ERROR_STATUS[code]
    this.publicMessage = options.publicMessage ?? ERROR_MESSAGE[code]
    this.detail = options.detail
    this.headers = options.headers
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.publicMessage } }
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

/** The `{ error: { code, message } }` body for a code, without throwing. */
export function apiErrorBody(code: ApiErrorCode, publicMessage?: string): ApiErrorBody {
  return { error: { code, message: publicMessage ?? ERROR_MESSAGE[code] } }
}

export function apiErrorStatus(code: ApiErrorCode): number {
  return ERROR_STATUS[code]
}

/**
 * Map a Zod failure onto `VALIDATION_FAILED`.
 *
 * The client is shown the first issue's message. Zod messages are written by
 * the schema author (or Zod's own defaults) and describe the *constraint*, not
 * the submitted value — so this tells a user their password needs a symbol
 * without ever echoing what they typed. The full issue list, with paths, goes
 * to the server log only.
 */
export function validationError(error: z.ZodError, source: 'body' | 'params' | 'query'): ApiError {
  const [first] = error.issues
  const detail = error.issues
    .map((issue) => `${source}.${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ')

  return new ApiError('VALIDATION_FAILED', {
    publicMessage: first?.message ?? ERROR_MESSAGE.VALIDATION_FAILED,
    detail: `Validation failed — ${detail}`,
    cause: error,
  })
}

export interface LogContext {
  requestId: string
  method: string
  path: string
}

/**
 * Server-side logging for a failed request.
 *
 * 5xx and unrecognised throws are logged with the full error (stack included);
 * expected 4xx are logged at warn level and only when they carry a detail worth
 * keeping. Nothing logged here is ever returned to the client.
 */
export function logApiError(error: unknown, context: LogContext): void {
  const base = {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
  }

  if (isApiError(error)) {
    if (error.status >= 500) {
      console.error('[api] error', { ...base, code: error.code }, error)
      return
    }
    console.warn('[api] rejected', { ...base, code: error.code, detail: error.detail })
    return
  }

  console.error('[api] unhandled', { ...base, code: 'INTERNAL' }, error)
}

/**
 * Normalise anything thrown inside the pipeline into an `ApiError`.
 *
 * An unrecognised throw becomes a bare `INTERNAL` — its message is dropped
 * rather than forwarded, because a thrown Postgres or Supabase error routinely
 * names tables, columns, and constraint values.
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error
  return new ApiError('INTERNAL', { cause: error })
}
