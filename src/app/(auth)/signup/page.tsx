import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { cn, focusRing } from '@/lib/utils'

export const metadata: Metadata = { title: 'Create your account · MizFit' }

const linkClass = cn('rounded-sm font-medium underline underline-offset-2', focusRing)

/**
 * The chat starts the moment this succeeds — there is no verification step to
 * wait on (SPEC.md § 3). `/chat` is built by Prompt 7.
 */
export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Then tell Mizfit about you, and it plans your week around the food you already have."
      endpoint="/api/auth/signup"
      fields={[
        { kind: 'email', name: 'email', label: 'Email' },
        {
          kind: 'password',
          name: 'password',
          label: 'Password',
          autoComplete: 'new-password',
          showPolicy: true,
        },
      ]}
      submitLabel="Create account"
      submittingLabel="Creating your account…"
      success={{ redirectTo: '/chat' }}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    />
  )
}
