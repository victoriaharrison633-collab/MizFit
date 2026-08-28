import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { cn, focusRing } from '@/lib/utils'

export const metadata: Metadata = { title: 'Sign in · MizFit' }

const linkClass = cn('rounded-sm font-medium underline underline-offset-2', focusRing)

export default function LoginPage() {
  return (
    <AuthForm
      title="Sign in"
      endpoint="/api/auth/login"
      fields={[
        { kind: 'email', name: 'email', label: 'Email' },
        // No policy text here: the login form has no business advertising the
        // rules, and the password being typed is an existing one.
        {
          kind: 'password',
          name: 'password',
          label: 'Password',
          autoComplete: 'current-password',
        },
      ]}
      submitLabel="Sign in"
      submittingLabel="Signing you in…"
      success={{ redirectTo: '/chat' }}
      footer={
        <>
          <Link href="/forgot-password" className={linkClass}>
            Forgot your password?
          </Link>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <Link href="/signup" className={linkClass}>
            Create an account
          </Link>
        </>
      }
    />
  )
}
