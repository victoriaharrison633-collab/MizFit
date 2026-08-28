import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { clientEnv, serverEnv } from '@/env'
import type { Database } from '@/types/database'

/**
 * Service-role Supabase client — bypasses RLS.
 *
 * CLAUDE.md Rule 11: used only for the `handle_new_user` trigger path and
 * explicitly justified admin operations, never as a convenience to skip RLS.
 * Every call site must state why RLS cannot serve the operation.
 *
 * `import 'server-only'` makes importing this module from a client component a
 * build error rather than a runtime leak.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}
