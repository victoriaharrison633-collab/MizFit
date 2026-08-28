import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { clientEnv } from '@/env'
import type { Database } from '@/types/database'

/**
 * Supabase client for server components, server actions, and route handlers.
 *
 * Reads the session from the request cookies (CLAUDE.md Rule 12 — auth is
 * server-side, always). Create a new client per request; never share one across
 * requests.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Called from a server component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to ignore.
          }
        },
      },
    }
  )
}
