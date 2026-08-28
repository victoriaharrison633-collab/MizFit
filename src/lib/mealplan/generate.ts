import 'server-only'

import { ApiError } from '@/lib/security/errors'
import { generateWeekPlan } from '@/lib/ai/client'
import { macrosForWeek } from '@/lib/profile/methodology'
import { addUtcDays } from '@/lib/profile/tdee'
import { todayUtc, toUtcDate } from '@/lib/validation/common'
import type { Json } from '@/types/database'
import {
  getMealPlanByWeek,
  getProfile,
  listPantryItems,
  type Db,
  type MealPlan,
  type MealPlanDay,
} from '@/lib/db/queries'

/**
 * Orchestration for the one AI feature (SPEC.md § 8): snapshot the profile,
 * build the week's macro targets, ask the client for a plan, validate it, and
 * persist the plan plus its seven days.
 *
 * The validation happens inside `generateWeekPlan` before anything reaches this
 * function, so a malformed model response becomes a `status='failed'` row and
 * zero `meal_plan_days` — never a partial write (Rule 13).
 */

/**
 * `week_start_date` is the next Sunday on or after the current UTC date
 * (SPEC.md § 4.11). If today is Sunday, the week starts today.
 */
export function nextSundayUtc(today = todayUtc()): string {
  const date = toUtcDate(today)
  const daysUntilSunday = (7 - date.getUTCDay()) % 7
  return addUtcDays(today, daysUntilSunday)
}

export interface GenerateResult {
  plan: MealPlan
  days: MealPlanDay[]
}

export async function generatePlanForWorkspace(
  db: Db,
  userId: string,
  workspaceId: string,
  cuisinePreferences: string[]
): Promise<GenerateResult> {
  const profile = await getProfile(db, userId)

  if (!profile?.calorie_target || !profile.diet_methodology) {
    throw new ApiError('VALIDATION_FAILED', {
      publicMessage:
        'Finish the questions above first — we need your target and diet before planning.',
      detail: 'Generation attempted before calorie_target / diet_methodology were captured',
    })
  }

  const weekStartDate = nextSundayUtc()

  // The partial unique index already guards a double-tapped "Generate my week";
  // this turns that race into a returned plan rather than a 500.
  const existing = await getMealPlanByWeek(db, workspaceId, weekStartDate)
  if (existing && existing.status === 'ready') {
    const { data } = await db
      .from('meal_plan_days')
      .select('*')
      .eq('meal_plan_id', existing.id)
      .order('day_index', { ascending: true })
    return { plan: existing, days: data ?? [] }
  }

  const pantry = await listPantryItems(db, workspaceId)
  const weekMacros = macrosForWeek(profile.diet_methodology, profile.calorie_target)

  const { data: planRow, error: planError } = await db
    .from('meal_plans')
    .insert({
      workspace_id: workspaceId,
      created_by: userId,
      week_start_date: weekStartDate,
      status: 'generating',
      cuisine_preferences: cuisinePreferences,
      diet_methodology: profile.diet_methodology,
      calorie_target: profile.calorie_target,
      servings_per_meal: profile.servings_per_meal,
      // Overwritten below once the source is known; the column is NOT NULL.
      generation_source: 'mock',
    })
    .select('*')
    .single()

  if (planError || !planRow) {
    throw new ApiError('INTERNAL', { detail: `meal_plans insert failed: ${planError?.message}` })
  }

  try {
    const generated = await generateWeekPlan({
      profile,
      pantry: pantry.all,
      cuisinePreferences,
      weekMacros,
    })

    const dayRows = generated.plan.days.map((day) => ({
      meal_plan_id: planRow.id,
      day_index: day.day_index,
      day_macro_type: weekMacros[day.day_index]!.day_macro_type,
      // jsonb columns: the generated types want `Json`, and these are plain
      // Zod-validated data with no class instances or undefined in them.
      macro_targets: weekMacros[day.day_index]! as unknown as Json,
      breakfast: day.breakfast as unknown as Json,
      lunch: day.lunch as unknown as Json,
      snack: day.snack as unknown as Json,
      supper_options: day.supper_options as unknown as Json,
    }))

    const { data: days, error: daysError } = await db
      .from('meal_plan_days')
      .insert(dayRows)
      .select('*')

    if (daysError) throw new Error(`meal_plan_days insert failed: ${daysError.message}`)

    const { data: readyPlan } = await db
      .from('meal_plans')
      .update({
        status: 'ready',
        generation_source: generated.source,
        model_id: generated.modelId,
      })
      .eq('id', planRow.id)
      .select('*')
      .single()

    return {
      plan: readyPlan ?? planRow,
      days: (days ?? []).sort((a, b) => a.day_index - b.day_index),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed'
    await db
      .from('meal_plans')
      .update({ status: 'failed', error_message: message.slice(0, 500) })
      .eq('id', planRow.id)

    throw new ApiError('INTERNAL', { detail: `Plan generation failed: ${message}`, cause: error })
  }
}
