'use client'

import * as React from 'react'
import Link from 'next/link'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, focusRing } from '@/lib/utils'

/**
 * Error boundary for the protected shell.
 *
 * It renders app-authored copy and nothing else. `error.message` and the stack
 * are never shown: in production Next already replaces the message with a
 * generic string, but in development it would happily hand the browser a
 * database error, and a boundary that behaves differently in the two
 * environments is a boundary nobody has actually tested (Rule 7).
 *
 * `error.digest` is Next's own hash of the server-side error. It is not derived
 * from user data and carries no detail — it is the one thing that lets someone
 * match what they saw to the line in the server log.
 *
 * The alert state is carried by an icon and a heading, never by colour alone
 * (SPEC.md § 11a non-negotiable 1) — which is also why there is no red here:
 * SPEC.md § 11 defines no error colour, and inventing one is not this prompt's
 * call.
 *
 * SENTRY DEVIATION: `BUILD.md` asks this boundary to report to Sentry when
 * `SENTRY_DSN` is set. It does not, and the reason is a conflict rather than an
 * omission. This is a client component, so reporting from here needs a
 * browser-readable DSN; SPEC.md § 11 lists `SENTRY_DSN` as server-only and
 * `.env.example` forbids adding a variable § 11 does not name. Routing the
 * report through an API endpoint would mean inventing a route SPEC.md § 6 does
 * not list (Rule 6), and `@sentry/nextjs` is not a pinned dependency (Rule 2).
 * The error is already logged server-side by Next with the same digest, so
 * nothing is lost that a log does not have. Flagged rather than half-wired
 * (Rule 16).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Client-side breadcrumb only. The server already has the real one.
    console.error('[app] Rendering failed', { digest: error.digest })
  }, [error.digest])

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
          Something went wrong
        </CardTitle>
        <CardDescription>
          This page could not be loaded. Nothing you entered has been lost — try again, and if it
          keeps happening, come back in a few minutes.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="solid" onClick={reset}>
            Try again
          </Button>
          <Link
            href="/chat"
            className={cn('rounded-sm text-sm font-medium underline underline-offset-2', focusRing)}
          >
            Back to the chat
          </Link>
        </div>

        {error.digest ? (
          <p className="text-sm text-text">
            Reference: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
