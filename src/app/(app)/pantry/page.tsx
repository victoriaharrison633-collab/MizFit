import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/security/ownership'
import { listPantryItems, type Db } from '@/lib/db/queries'
import { PantryManager } from '@/components/pantry/pantry-manager'

export const metadata: Metadata = { title: 'Pantry · MizFit' }

/**
 * The pantry page (SPEC.md § 4.6). The 54 baseline items were seeded at signup
 * by `handle_new_user`; this page never seeds anything itself.
 */
export default async function PantryPage() {
  const supabase = (await createClient()) as Db
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const workspace = await getActiveWorkspace(supabase, user.id)
  const pantry = await listPantryItems(supabase, workspace.id)

  return <PantryManager initialPerishable={pantry.perishable} initialStaples={pantry.staples} />
}
