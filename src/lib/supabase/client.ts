import { createBrowserClient } from '@supabase/ssr'
import { clientEnv } from '@/env'
import type { Database } from '@/types/database'

/**
 * Supabase client for browser (client component) use.
 *
 * Carries the anon key only. Every table it touches is protected by RLS, and
 * every server route re-verifies ownership regardless (CLAUDE.md Rule 9).
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
