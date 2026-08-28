import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { assertPlanDayOwnership } from '@/lib/security/ownership'
import { getMealPlanById, getMealPlanDay } from '@/lib/db/queries'
import { uuidSchema } from '@/lib/validation/common'
import { ApiError } from '@/lib/security/errors'

/**
 * POST /api/mealplan/[planId]/days/[dayId]/approve (SPEC.md § 6)
 * 400 if no supper option has been selected yet.
 */
export const POST = withApiHandler(
  {
    method: 'POST',
    rateLimit: 'mutation',
    params: z.object({ planId: uuidSchema, dayId: uuidSchema }),
    loadResources: async (ctx) => {
      const plan = await getMealPlanById(ctx.db, ctx.params.planId)
      if (!plan) throw new ApiError('NOT_FOUND', { detail: 'No such meal plan' })
      const day = await getMealPlanDay(ctx.db, ctx.params.dayId)
      return assertPlanDayOwnership(day, plan, ctx.workspace.id)
    },
  },
  async (ctx) => {
    if (ctx.resources.selected_supper_index === null) {
      throw new ApiError('VALIDATION_FAILED', {
        publicMessage: 'Pick a supper for this day before approving it.',
        detail: `Approve attempted on day ${ctx.resources.id} with no selection`,
      })
    }

    const { data, error } = await ctx.db
      .from('meal_plan_days')
      .update({ approved_at: new Date().toISOString() })
      .eq('id', ctx.resources.id)
      .select('*')
      .single()

    if (error) throw new ApiError('INTERNAL', { detail: `approve failed: ${error.message}` })
    return { day: data }
  }
)
