import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shell/app-header'

/**
 * The protected shell every signed-in surface renders inside.
 *
 * The session is read here as well as in middleware, on purpose. Middleware
 * protects by path pattern; this protects by being the thing that renders. If a
 * matcher is ever narrowed by mistake, the pages inside this group still refuse
 * to render for an anonymous visitor (CLAUDE.md Rule 12).
 *
 * `auth.getUser()` revalidates the token with the Auth server rather than
 * trusting the cookie's contents.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader email={user.email ?? ''} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}
