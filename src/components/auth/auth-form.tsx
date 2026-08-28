'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/brand/logo'
import { PasswordField } from '@/components/auth/password-field'

/**
 * The shared shell for all four auth forms.
 *
 * A real `<form>` with named inputs and `autoComplete` attributes, because
 * password managers and browser autofill only work on one of those (SPEC.md
 * § 3, CLAUDE.md Rule 12). Submission posts JSON to the route rather than doing
 * a native form POST, so a failure can be shown in place instead of navigating
 * to a JSON document.
 *
 * Every state that matters is announced, not just coloured (SPEC.md § 11a
 * non-negotiable 1): errors carry an icon and the word "Error", success carries
 * an icon and a sentence, and both live in a live region.
 */

export type AuthFieldSpec =
  | { kind: 'email'; name: string; label: string }
  | {
      kind: 'password'
      name: string
      label: string
      autoComplete: 'current-password' | 'new-password'
      showPolicy?: boolean
    }

export interface AuthFormProps {
  title: string
  description?: string
  fields: readonly AuthFieldSpec[]
  /** The SPEC.md § 6 route this form posts to. */
  endpoint: string
  submitLabel: string
  submittingLabel: string
  /**
   * What success looks like: send the user somewhere, or leave a message on
   * screen. `/api/auth/forgot-password` uses the message, because navigating
   * away would be a second place to leak whether the address existed.
   */
  success: { redirectTo: string } | { message: string }
  /** Rendered under the form — the "no account yet?" links. */
  footer?: React.ReactNode
  /** App-authored notice shown above the form, e.g. an expired reset link. */
  notice?: string
  /**
   * Replace the API's copy for a given error code with something that makes
   * sense on this form. The reset form needs it: a 401 there does not mean
   * "sign in", it means the emailed link is spent.
   */
  errorMessages?: Partial<Record<string, string>>
}

interface ApiErrorShape {
  error?: { code?: string; message?: string }
}

const FALLBACK_ERROR = 'Something went wrong. Please try again.'

export function AuthForm({
  title,
  description,
  fields,
  endpoint,
  submitLabel,
  submittingLabel,
  success,
  footer,
  notice,
  errorMessages,
}: AuthFormProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const body: Record<string, string> = {}
    for (const field of fields) {
      body[field.name] = String(formData.get(field.name) ?? '')
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorShape | null
        const code = payload?.error?.code
        setError(
          (code ? errorMessages?.[code] : undefined) ?? payload?.error?.message ?? FALLBACK_ERROR
        )
        setPending(false)
        return
      }

      if ('redirectTo' in success) {
        // The cookie session only exists on the server until the router cache
        // is refreshed, so a push alone can render the next page as signed out.
        router.replace(success.redirectTo)
        router.refresh()
        return
      }

      setDone(true)
      setPending(false)
    } catch {
      setError(FALLBACK_ERROR)
      setPending(false)
    }
  }

  const showSuccessMessage = done && 'message' in success

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Logo as="h1" className="text-center text-3xl" />

      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {notice ? (
            <p className="flex items-start gap-1.5 text-sm font-medium text-text">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{notice}</span>
            </p>
          ) : null}

          {/*
            Both regions are always present so a screen reader has something to
            watch. An empty live region that appears later is often missed.
          */}
          <div aria-live="polite" role="status">
            {showSuccessMessage ? (
              <p className="flex items-start gap-1.5 text-sm font-medium text-text">
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>{success.message}</span>
              </p>
            ) : null}
          </div>

          <div aria-live="assertive" role="alert">
            {error ? (
              <p className="flex items-start gap-1.5 rounded-md border-2 border-text p-3 text-sm font-medium text-text">
                <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  <span className="font-semibold">Error:</span> {error}
                </span>
              </p>
            ) : null}
          </div>

          {showSuccessMessage ? null : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {fields.map((field) =>
                field.kind === 'email' ? (
                  <Input
                    key={field.name}
                    type="email"
                    name={field.name}
                    label={field.label}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    disabled={pending}
                    required
                  />
                ) : (
                  <PasswordField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    autoComplete={field.autoComplete}
                    showPolicy={field.showPolicy}
                    disabled={pending}
                  />
                )
              )}

              <Button
                type="submit"
                variant="solid"
                size="lg"
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? submittingLabel : submitLabel}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {footer ? <div className="text-center text-sm text-text">{footer}</div> : null}
    </main>
  )
}
