import { z } from 'zod'

/**
 * The single shared password schema (SPEC.md § 2, CLAUDE.md Rule 12).
 *
 * Used server-side by `POST /api/auth/signup` and `POST /api/auth/reset-password`
 * and by the two form components. The policy is stated once in SPEC.md § 2 and
 * implemented once here; no route, page, or component re-declares it.
 *
 * The minimum length is the constant below and the user-facing sentence is
 * `PASSWORD_RULE_TEXT`. Those are the only places the number lives in code —
 * the signup and reset UI render `PASSWORD_RULE_TEXT` rather than restating it.
 */

/** SPEC.md § 2. Changing this means changing SPEC.md § 2 and CLAUDE.md Rule 12 first. */
export const PASSWORD_MIN_LENGTH = 12

/**
 * The one user-facing statement of the policy. Rendered by the signup and reset
 * password fields as helper text (SPEC.md § 2: the UI copy must state exactly
 * this number, and no other number appears in any user-facing password string).
 */
export const PASSWORD_RULE_TEXT =
  'Use at least 12 characters, including an uppercase letter, a lowercase letter, a number, and a symbol.'

/**
 * Upper bound. Supabase hashes with bcrypt, which only considers the first 72
 * bytes of a password — anything beyond that is silently ignored, so accepting
 * it would be accepting a password the user cannot reliably reproduce. It is
 * also the boundary bound Rule 8 requires on the field.
 */
export const PASSWORD_MAX_LENGTH = 72

/**
 * The number appears twice in this file — as the bound and inside the sentence —
 * because SPEC.md § 2 requires the literal to be readable in the UI copy. This
 * guard makes the two drifting apart a boot-time failure rather than a silent
 * mismatch between what is enforced and what the user is told.
 */
if (!PASSWORD_RULE_TEXT.includes(`${PASSWORD_MIN_LENGTH} characters`)) {
  throw new Error(
    'PASSWORD_RULE_TEXT no longer states PASSWORD_MIN_LENGTH. Fix SPEC.md § 2 first, then both here.'
  )
}

const HAS_LOWERCASE = /\p{Ll}/u
const HAS_UPPERCASE = /\p{Lu}/u
const HAS_NUMBER = /\p{Nd}/u
/** Anything that is not a letter, a number, or whitespace counts as a symbol. */
const HAS_SYMBOL = /[^\p{L}\p{N}\s]/u

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, PASSWORD_RULE_TEXT)
  .max(PASSWORD_MAX_LENGTH, `Passwords can be at most ${PASSWORD_MAX_LENGTH} characters.`)
  .regex(HAS_UPPERCASE, PASSWORD_RULE_TEXT)
  .regex(HAS_LOWERCASE, PASSWORD_RULE_TEXT)
  .regex(HAS_NUMBER, PASSWORD_RULE_TEXT)
  .regex(HAS_SYMBOL, PASSWORD_RULE_TEXT)

export type Password = z.infer<typeof passwordSchema>

/**
 * Client-side convenience for live form feedback (SPEC.md § 2: client-side
 * validation is display convenience only — `passwordSchema` above is the
 * enforcement, and it runs on the server).
 */
export function passwordChecklist(value: string): {
  length: boolean
  uppercase: boolean
  lowercase: boolean
  number: boolean
  symbol: boolean
} {
  return {
    length: value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH,
    uppercase: HAS_UPPERCASE.test(value),
    lowercase: HAS_LOWERCASE.test(value),
    number: HAS_NUMBER.test(value),
    symbol: HAS_SYMBOL.test(value),
  }
}
