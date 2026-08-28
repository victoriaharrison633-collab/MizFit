import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveWorkspace } from '@/lib/security/ownership'
import {
  getMealPlanByWeek,
  getProfile,
  listMealPlanDays,
  listPantryItems,
  type Db,
} from '@/lib/db/queries'
import { nextSundayUtc } from '@/lib/mealplan/generate'
import { ChatShell } from '@/components/chat/chat-shell'

export const metadata: Metadata = { title: 'Mizfit Chat' }

/**
 * The chat surface (SPEC.md § 3). Everything the flow needs is loaded here, on
 * the server, so a refresh resumes from `profiles.onboarding_step` with the
 * answers already given rather than restarting (Rule 15).
 */
export default async function ChatPage() {
  const supabase = (await createClient()) as Db
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const workspace = await getActiveWorkspace(supabase, user.id)
  const [profile, pantry] = await Promise.all([
    getProfile(supabase, user.id),
    listPantryItems(supabase, workspace.id),
  ])

  const plan = await getMealPlanByWeek(supabase, workspace.id, nextSundayUtc())
  const days = plan ? await listMealPlanDays(supabase, plan.id) : []

  return (
    <ChatShell
      profile={profile}
      pantryItems={pantry.all}
      initialPlan={plan && plan.status === 'ready' ? plan : null}
      initialDays={days}
    />
  )
}
