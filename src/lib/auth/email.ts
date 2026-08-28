import 'server-only'

import { Resend } from 'resend'
import { serverEnv } from '@/env'

/**
 * Transactional email (CLAUDE.md Rule 11 — `RESEND_API_KEY` is server-only).
 *
 * There is exactly one transactional email in this build: the password reset.
 * The verification email is gone with the verification gate (SPEC.md § 3,
 * G-06) — signup confirms the address at the auth layer and issues the session,
 * so there is nothing to wait for.
 *
 * Nothing here ever throws. `POST /api/auth/forgot-password` must return an
 * identical 200 whether or not the address exists (SPEC.md § 6), and a mail
 * failure that turned into a 500 would leak exactly the distinction that route
 * exists to hide. Failures are logged server-side and swallowed.
 */

/**
 * Resend's shared sandbox sender, which needs no DNS setup and is what their
 * own quickstart uses. SPEC.md § 11 lists no variable for a from-address, so
 * this is not read from the environment. Replace it with an address on a
 * verified domain before this app sends to a real inbox — the sandbox sender
 * only delivers to the Resend account owner.
 */
const FROM_ADDRESS = 'MizFit <onboarding@resend.dev>'

const SUBJECT = 'Reset your MizFit password'

export interface PasswordResetEmail {
  to: string
  /** Absolute URL of the one-time reset link. */
  resetUrl: string
}

function plainTextBody(resetUrl: string): string {
  return [
    'Reset your MizFit password',
    '',
    'Open the link below to choose a new password. It can only be used once,',
    'and it expires in an hour.',
    '',
    resetUrl,
    '',
    'If you did not ask for this, you can ignore this email — your password',
    'will not change.',
  ].join('\n')
}

function htmlBody(resetUrl: string): string {
  // Inline styles only: email clients strip <style> blocks. The colours are the
  // Fresh Sage tokens from SPEC.md § 11, using Text on Background (10.90:1) and
  // white on darkened CTA (5.24:1) — the two pairings verified for normal-size
  // text. Nothing here depends on colour alone to be understood.
  return `<div style="background:#F8FAF5;padding:32px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#2C3E2D">
  <h1 style="font-size:20px;margin:0 0 16px">Reset your MizFit password</h1>
  <p style="margin:0 0 16px;line-height:1.5">Open the link below to choose a new password. It can only be used once, and it expires in an hour.</p>
  <p style="margin:0 0 24px">
    <a href="${resetUrl}" style="display:inline-block;background:#4D7735;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">Choose a new password</a>
  </p>
  <p style="margin:0 0 16px;line-height:1.5;font-size:14px">If the button does not work, paste this address into your browser:<br><span style="word-break:break-all">${resetUrl}</span></p>
  <p style="margin:0;line-height:1.5;font-size:14px">If you did not ask for this, you can ignore this email — your password will not change.</p>
</div>`
}

/**
 * Send the reset email, or — with no `RESEND_API_KEY` — do the next most useful
 * thing.
 *
 * In development the link is printed to the server console, so the whole reset
 * flow is exercisable without a Resend account. In production a missing key is
 * logged as an error and the request still succeeds, because the alternative is
 * telling the caller whether the address existed.
 */
export async function sendPasswordResetEmail({ to, resetUrl }: PasswordResetEmail): Promise<void> {
  const apiKey = serverEnv.RESEND_API_KEY

  if (!apiKey) {
    if (serverEnv.NODE_ENV === 'production') {
      console.error(
        '[email] RESEND_API_KEY is not set. The password reset email was NOT sent. ' +
          'Set it, or password reset is broken for every user in production.'
      )
      return
    }

    console.warn(
      `[email] RESEND_API_KEY is not set, so no email was sent.\n` +
        `[email] Password reset link for ${to}:\n${resetUrl}`
    )
    return
  }

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM_ADDRESS,
      to,
      subject: SUBJECT,
      text: plainTextBody(resetUrl),
      html: htmlBody(resetUrl),
    })

    if (error) {
      console.error('[email] Resend rejected the password reset send', {
        name: error.name,
        message: error.message,
      })
    }
  } catch (error) {
    console.error('[email] Password reset send threw', error)
  }
}
