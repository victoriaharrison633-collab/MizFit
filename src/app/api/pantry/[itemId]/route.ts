import { z } from 'zod'
import { withApiHandler } from '@/lib/security/api-handler'
import { assertWorkspaceOwnership } from '@/lib/security/ownership'
import { ApiError } from '@/lib/security/errors'
import { getPantryItem } from '@/lib/db/queries'
import { updatePantryItemSchema } from '@/lib/pantry/schemas'
import { uuidSchema } from '@/lib/validation/common'

/**
 * PATCH and DELETE /api/pantry/[itemId] (SPEC.md § 6).
 *
 * Both load the row through `assertWorkspaceOwnership` before touching it, so
 * another workspace's item is a 404 rather than a 403 — a 403 would confirm the
 * row exists (Rule 9).
 */
const paramsSchema = z.object({ itemId: uuidSchema })

const loadOwnedItem = async (ctx: {
  db: Parameters<typeof getPantryItem>[0]
  params: { itemId: string }
  workspace: { id: string }
}) => {
  const item = await getPantryItem(ctx.db, ctx.params.itemId)
  return assertWorkspaceOwnership(item, ctx.workspace.id, 'pantry item')
}

export const PATCH = withApiHandler(
  {
    method: 'PATCH',
    rateLimit: 'mutation',
    params: paramsSchema,
    body: updatePantryItemSchema,
    loadResources: loadOwnedItem,
  },
  async (ctx) => {
    const { data, error } = await ctx.db
      .from('pantry_items')
      .update(ctx.body)
      .eq('id', ctx.resources.id)
      .select('*')
      .single()

    if (error) throw new ApiError('INTERNAL', { detail: `pantry update failed: ${error.message}` })
    return { item: data }
  }
)

export const DELETE = withApiHandler(
  {
    method: 'DELETE',
    rateLimit: 'mutation',
    params: paramsSchema,
    loadResources: loadOwnedItem,
  },
  async (ctx) => {
    const { error } = await ctx.db.from('pantry_items').delete().eq('id', ctx.resources.id)
    if (error) throw new ApiError('INTERNAL', { detail: `pantry delete failed: ${error.message}` })
    // No body: 204.
  }
)
