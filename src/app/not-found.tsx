import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'
import { cn, focusRing } from '@/lib/utils'

export const metadata: Metadata = { title: 'Page not found · MizFit' }

const linkClass = cn('rounded-sm font-medium underline underline-offset-2', focusRing)

/**
 * The custom 404, in the Fresh Sage tokens rather than the framework default.
 *
 * It offers both doors on purpose: a signed-in visitor wants the chat, and a
 * signed-out one gets bounced to `/login` by middleware if they try it, which
 * is the right answer for them too.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-4 py-12">
      <Logo as="h1" className="text-center text-3xl" />

      <Card>
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            That page does not exist. It may have moved, or the link may have been mistyped.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-text">
          <Link href="/chat" className={linkClass}>
            Go to the chat
          </Link>
          <Link href="/" className={linkClass}>
            Back to the start
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
