import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { cn, focusRing } from '@/lib/utils'

export const metadata: Metadata = { title: 'Reset your password · MizFit' }

const linkClass = cn('rounded-sm font-medium underline underline-offset-2', focusRing)

/**
 * `/api/auth/callback` sends a spent or expired link back here with
 * `?status=invalid_link`. The value is matched against a fixed set and mapped
 * to copy we wrote — the query string is never rendered.
 */
const NOTICES: Record<string, string> = {
  invalid_link: 'That reset link has expired or has already been used. Ask for a new one below.',
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const notice = status ? NOTICES[status] : undefined

  return (
    <AuthForm
      title="Reset your password"
      description="Enter your email and we'll send you a link to choose a new password."
      endpoint="/api/auth/forgot-password"
      fields={[{ kind: 'email', name: 'email', label: 'Email' }]}
      submitLabel="Send reset link"
      submittingLabel="Sending…"
      notice={notice}
      // A message rather than a redirect: navigating somewhere different for a
      // known address would leak exactly what the route refuses to say.
      success={{
        message:
          'If that address has an account, a reset link is on its way. The link works once and expires in an hour.',
      }}
      footer={
        <Link href="/login" className={linkClass}>
          Back to sign in
        </Link>
      }
    />
  )
}
