import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { assertPlanDayOwnership } from '@/lib/security/ownership'
import { getMealPlanById, getMealPlanDay } from '@/lib/db/queries'
import { supperOptionIndexSchema, uuidSchema } from '@/lib/validation/common'
import { ApiError } from '@/lib/security/errors'

/** POST /api/mealplan/[planId]/days/[dayId]/select-supper (SPEC.md § 6) */
export const POST = withApiHandler(
  {
    method: 'POST',
    rateLimit: 'mutation',
    params: z.object({ planId: uuidSchema, dayId: uuidSchema }),
    body: z.object({ supper_option_index: supperOptionIndexSchema }),
    loadResources: async (ctx) => {
      const plan = await getMealPlanById(ctx.db, ctx.params.planId)
      if (!plan) throw new ApiError('NOT_FOUND', { detail: 'No such meal plan' })
      const day = await getMealPlanDay(ctx.db, ctx.params.dayId)
      return assertPlanDayOwnership(day, plan, ctx.workspace.id)
    },
  },
  async (ctx) => {
    const { data, error } = await ctx.db
      .from('meal_plan_days')
      .update({ selected_supper_index: ctx.body.supper_option_index })
      .eq('id', ctx.resources.id)
      .select('*')
      .single()

    if (error) throw new ApiError('INTERNAL', { detail: `select-supper failed: ${error.message}` })
    return { day: data }
  }
)
