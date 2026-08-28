'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/brand/logo'
import { Nav } from '@/components/shell/nav'
import { cn, focusRing } from '@/lib/utils'

export interface AppHeaderProps {
  /** Shown so a user can tell which account they are in. */
  email: string
}

/**
 * The shell header: brand, navigation, and the way out.
 *
 * Signing out is a POST to `/api/auth/logout` (SPEC.md § 6) — the session lives
 * in an httpOnly cookie the browser cannot clear itself, so the server has to do
 * it. `router.refresh()` afterwards is what makes the redirect land on a page
 * rendered without the session, rather than a cached one that still has it.
 */
export function AppHeader({ email }: AppHeaderProps) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)

  async function handleSignOut() {
    if (pending) return
    setPending(true)

    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Even if the call fails, send the user to /login: middleware will bounce
      // them back if the session survived, which is the honest outcome.
    }

    router.replace('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-tint">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/chat" className={cn('rounded-md', focusRing)}>
          <Logo />
          <span className="sr-only">MizFit home</span>
        </Link>

        <Nav />

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm text-text sm:inline" title={email}>
            {email}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={pending}
            aria-busy={pending}
          >
            <LogOut aria-hidden="true" />
            {pending ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </div>
    </header>
  )
}
