import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { assertWorkspaceOwnership } from '@/lib/security/ownership'
import { getMealPlanById, listMealPlanDays, listPantryItems } from '@/lib/db/queries'
import { computeGroceryGap } from '@/lib/grocery/compute-gap'
import { uuidSchema } from '@/lib/validation/common'

/**
 * GET /api/grocery-list/[planId] (SPEC.md § 6)
 * Computed from the plan's approved days minus the pantry.
 */
export const GET = withApiHandler(
  {
    method: 'GET',
    params: z.object({ planId: uuidSchema }),
    loadResources: async (ctx) => {
      const plan = await getMealPlanById(ctx.db, ctx.params.planId)
      return assertWorkspaceOwnership(plan, ctx.workspace.id, 'meal plan')
    },
  },
  async (ctx) => {
    const [days, pantry] = await Promise.all([
      listMealPlanDays(ctx.db, ctx.resources.id),
      listPantryItems(ctx.db, ctx.workspace.id),
    ])

    const approvedDays = days.filter((day) => day.approved_at !== null)

    return {
      items: computeGroceryGap(days, pantry.all),
      approved_day_count: approvedDays.length,
      /** The list is complete only when every day has an approved supper. */
      complete: approvedDays.length === 7,
    }
  }
)
