import type { MealPlanDay, PantryItem } from '@/lib/db/queries'
import { recipeSchema, type Recipe } from '@/lib/ai/plan-schema'

/**
 * The grocery gap: what the week's approved plan needs that the pantry does not
 * have (SPEC.md § 4.9, § 6). Pure — no AI, no database (Rule 14).
 *
 * SCOPE NOTE: computed on read rather than persisted to `grocery_gap_items`.
 * The table and its migration are Prompt 12's, which is cut from this build for
 * time; nothing else reads the table, so a computed list is the same answer
 * without a schema change. Persisting it later is additive.
 */

export interface GapItem {
  name: string
  quantity: number | null
  unit: string | null
  source: 'missing_ingredient' | 'options'
}

/** Only the approved days count, and only the supper the user actually chose. */
function recipesForDay(day: MealPlanDay): Recipe[] {
  if (!day.approved_at || day.selected_supper_index === null) return []

  const slots = [day.breakfast, day.lunch, day.snack]
  const suppers = Array.isArray(day.supper_options) ? day.supper_options : []
  const chosen = suppers[day.selected_supper_index]
  if (chosen) slots.push(chosen)

  return slots
    .map((slot) => recipeSchema.safeParse(slot))
    .filter((result) => result.success)
    .map((result) => result.data)
}

function key(name: string, unit: string | null): string {
  return `${name.trim().toLowerCase()}::${(unit ?? '').trim().toLowerCase()}`
}

/**
 * Aggregated by name and unit, matching the `unique (meal_plan_id, name, unit)`
 * shape the table would have used. Pantry matching is by name, case-insensitive:
 * the plan names ingredients from the same 54-item list the pantry was seeded
 * from, so an exact-name match is the honest comparison rather than a fuzzy one
 * that would silently drop things from the list.
 */
export function computeGroceryGap(days: MealPlanDay[], pantry: PantryItem[]): GapItem[] {
  const owned = new Set(pantry.map((item) => item.name.trim().toLowerCase()))
  const gap = new Map<string, GapItem>()

  for (const day of days) {
    for (const recipe of recipesForDay(day)) {
      for (const ingredient of recipe.ingredients) {
        if (ingredient.from_pantry && owned.has(ingredient.name.trim().toLowerCase())) continue

        const mapKey = key(ingredient.name, ingredient.unit)
        const existing = gap.get(mapKey)
        if (existing) {
          existing.quantity = (existing.quantity ?? 0) + ingredient.quantity
        } else {
          gap.set(mapKey, {
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            source: 'missing_ingredient',
          })
        }
      }

      // `OPTIONS:` supporting items carry no amount and are never aggregated
      // against a quantity (SPEC.md § 4.8).
      for (const option of recipe.options) {
        const mapKey = key(option, null)
        if (!gap.has(mapKey) && !owned.has(option.trim().toLowerCase())) {
          gap.set(mapKey, { name: option, quantity: null, unit: null, source: 'options' })
        }
      }
    }
  }

  return [...gap.values()].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'missing_ingredient' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}
