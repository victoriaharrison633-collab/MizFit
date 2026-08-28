import { z } from 'zod'
import { passwordSchema } from '@/lib/validation/password'

/**
 * Zod bodies for the six auth routes (SPEC.md § 6).
 *
 * The password policy is imported, never restated (SPEC.md § 2) — and note
 * that only signup and reset apply it. Login deliberately does not: a login
 * form that rejects a password for being too short tells an attacker the
 * policy and tells a legitimate user the wrong thing about why they failed.
 */

/**
 * 254 characters is the maximum length of an email address that can traverse
 * SMTP (RFC 5321), which makes it the natural bound rather than an invented one
 * (Rule 8). Normalised before the format check so casing and stray whitespace
 * from an autofill cannot create a second account for the same address.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Enter a valid email address.')
  .pipe(z.email({ error: 'Enter a valid email address.' }))

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  /**
   * Presence only. The policy belongs on the routes that *set* a password.
   */
  password: z.string().min(1, 'Enter your password.').max(512),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
})

/**
 * The emailed reset link lands here.
 *
 * Both fields are optional and the type falls back rather than failing, so a
 * truncated or tampered link redirects to a human-readable page instead of
 * answering a click with a JSON validation error. `recovery` is the only type
 * this build issues — there is no verification link (SPEC.md § 3, G-06).
 */
export const callbackQuerySchema = z.object({
  token_hash: z.string().min(1).max(512).optional().catch(undefined),
  type: z.literal('recovery').optional().catch(undefined),
})

export type SignupBody = z.infer<typeof signupSchema>
export type LoginBody = z.infer<typeof loginSchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>
export type CallbackQuery = z.infer<typeof callbackQuerySchema>
