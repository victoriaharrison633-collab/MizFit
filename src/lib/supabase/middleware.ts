import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { clientEnv } from '@/env'
import type { Database } from '@/types/database'

/**
 * Session refresh helper for Next.js middleware (CLAUDE.md Rule 12 — session
 * refresh happens in middleware).
 *
 * Prompt 6 owns `src/middleware.ts` and the route-matching rules; this module
 * only refreshes the session and returns the response carrying the updated
 * cookies.
 *
 * `supabase.auth.getUser()` must be called — it revalidates the token with the
 * Supabase Auth server. Reading the session from the cookie alone trusts a
 * value the browser can edit.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response, user }
}
