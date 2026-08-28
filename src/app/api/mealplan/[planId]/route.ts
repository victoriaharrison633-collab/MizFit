import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { assertWorkspaceOwnership } from '@/lib/security/ownership'
import { getMealPlanById, listMealPlanDays } from '@/lib/db/queries'
import { uuidSchema } from '@/lib/validation/common'

/** GET /api/mealplan/[planId] (SPEC.md § 6) */
export const GET = withApiHandler(
  {
    method: 'GET',
    params: z.object({ planId: uuidSchema }),
    loadResources: async (ctx) => {
      const plan = await getMealPlanById(ctx.db, ctx.params.planId)
      return assertWorkspaceOwnership(plan, ctx.workspace.id, 'meal plan')
    },
  },
  async (ctx) => ({
    plan: ctx.resources,
    days: await listMealPlanDays(ctx.db, ctx.resources.id),
  })
)
