import { withApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { listPantryItems } from '@/lib/db/queries'
import { createPantryItemSchema } from '@/lib/pantry/schemas'

/**
 * GET /api/pantry — the whole pantry, spoilage-ordered (SPEC.md § 4.6, § 6).
 *
 * Dated items come back soonest-expiry-first; NULL-expiry staples are returned
 * as their own set rather than sorted to either end of that list.
 */
export const GET = withApiHandler({ method: 'GET' }, async (ctx) => {
  const pantry = await listPantryItems(ctx.db, ctx.workspace.id)
  return { perishable: pantry.perishable, staples: pantry.staples }
})

/** POST /api/pantry — add an item by hand. */
export const POST = withApiHandler(
  { method: 'POST', rateLimit: 'mutation', body: createPantryItemSchema, successStatus: 201 },
  async (ctx) => {
    const { data, error } = await ctx.db
      .from('pantry_items')
      .insert({
        workspace_id: ctx.workspace.id,
        name: ctx.body.name,
        quantity: ctx.body.quantity,
        unit: ctx.body.unit,
        expiry_date: ctx.body.expiry_date,
        is_frozen: ctx.body.is_frozen,
        // Distinguishes a hand-added row from the 54 seeded at signup.
        source: 'user',
      })
      .select('*')
      .single()

    if (error) throw new ApiError('INTERNAL', { detail: `pantry insert failed: ${error.message}` })
    return { item: data }
  }
)
