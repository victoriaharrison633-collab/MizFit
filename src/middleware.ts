import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Session refresh and route protection (CLAUDE.md Rule 12).
 *
 * Two jobs, in this order:
 *
 * 1. Refresh the Supabase SSR cookie session on every matched request, so a
 *    signed-in user's access token is renewed before a page reads it. The
 *    helper calls `auth.getUser()`, which revalidates with the Auth server
 *    rather than trusting what the cookie says.
 * 2. Send an unauthenticated request for a protected page to `/login`.
 *
 * **Protection is deny-by-default.** Everything that is not on the public list
 * requires a session, so a page added by a later prompt is protected the moment
 * it exists rather than the moment someone remembers to list it. A signed-out
 * request for a path that does not exist is redirected too — that is the
 * intended behaviour, and it does not leak which paths are real.
 *
 * There is no verification branch here, and there is none to add: this build
 * has no verification gate anywhere (SPEC.md § 3, G-06).
 *
 * NOTE ON LOCATION: `BUILD.md` says "at the project root". With a `src`
 * directory, Next.js only picks middleware up at `src/middleware.ts` — at the
 * repository root it is silently ignored, which would leave every page
 * unprotected with no error to notice. This is the working location.
 */

/**
 * Pages any visitor may reach: the landing page and the four `(auth)` pages
 * (SPEC.md § 6). Everything else under a page route needs a session.
 */
const PUBLIC_PAGES = new Set(['/', '/login', '/signup', '/forgot-password', '/reset-password'])

/**
 * The liveness probe must answer without touching Supabase (SPEC.md § 6), so it
 * skips the session refresh entirely rather than making a monitor's every ping
 * an auth round-trip.
 */
const HEALTH_PATH = '/api/health'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === HEALTH_PATH) {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)

  /*
   * API routes always pass through. Their auth is `withApiHandler`, which
   * answers an anonymous caller with a typed 401 JSON body (Rule 7). Redirecting
   * them here would hand a `fetch()` an HTML login page and a 200, which is a
   * far more confusing failure than the 401 it expects.
   */
  if (pathname.startsWith('/api/')) {
    return response
  }

  if (PUBLIC_PAGES.has(pathname) || user) {
    return response
  }

  const loginUrl = new URL('/login', request.url)
  const redirect = NextResponse.redirect(loginUrl)

  // Carry over any cookies the refresh just set. Dropping them here would throw
  // away a rotated refresh token and sign the user out on their next request.
  for (const cookie of response.cookies.getAll()) {
    redirect.cookies.set(cookie)
  }

  return redirect
}

export const config = {
  /*
   * Everything except Next's own static output and the icon files. Static
   * assets need neither a session refresh nor protection, and running auth on
   * each one would put a Supabase call in front of every image.
   */
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
