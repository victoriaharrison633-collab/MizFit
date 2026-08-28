import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { CUISINE_PREFERENCES } from '@/lib/db/queries'
import { generatePlanForWorkspace } from '@/lib/mealplan/generate'

/**
 * POST /api/mealplan/generate (SPEC.md § 6)
 *
 * The only Anthropic call path in the build, on the strictest rate-limit bucket
 * because it is the only route that spends money. No verification gate — this
 * build has none (SPEC.md § 3, G-06).
 */
const bodySchema = z.object({
  cuisine_preferences: z.array(z.enum(CUISINE_PREFERENCES)).max(CUISINE_PREFERENCES.length),
})

export const POST = withApiHandler(
  { method: 'POST', rateLimit: 'mealplan:generate', body: bodySchema, successStatus: 201 },
  async (ctx) =>
    generatePlanForWorkspace(ctx.db, ctx.user.id, ctx.workspace.id, ctx.body.cuisine_preferences)
)
