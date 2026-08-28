import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { cn, focusRing } from '@/lib/utils'

export const metadata: Metadata = { title: 'Choose a new password · MizFit' }

const linkClass = cn('rounded-sm font-medium underline underline-offset-2', focusRing)

/**
 * Reached from the emailed link, after `/api/auth/callback` has exchanged the
 * one-time token for a session. Without that session the route answers 401,
 * which on this form means the link is spent rather than "please sign in".
 */
export default function ResetPasswordPage() {
  return (
    <AuthForm
      title="Choose a new password"
      endpoint="/api/auth/reset-password"
      fields={[
        {
          kind: 'password',
          name: 'password',
          label: 'New password',
          autoComplete: 'new-password',
          showPolicy: true,
        },
      ]}
      submitLabel="Save new password"
      submittingLabel="Saving…"
      success={{ redirectTo: '/chat' }}
      errorMessages={{
        UNAUTHORIZED:
          'That reset link has expired or has already been used. Ask for a new one from the forgot-password page.',
      }}
      footer={
        <Link href="/forgot-password" className={linkClass}>
          Request a new reset link
        </Link>
      }
    />
  )
}
