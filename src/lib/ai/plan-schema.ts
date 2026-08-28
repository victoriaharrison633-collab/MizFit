import { z } from 'zod'
import { boundedText } from '@/lib/validation/common'

/**
 * The shape a generated plan must have before anything is written to the
 * database (CLAUDE.md Rule 13 — model output is untrusted).
 *
 * A response that does not parse is a handled error and a `status='failed'`
 * plan row, never a crash and never a partial write.
 */

export const ingredientSchema = z.object({
  name: boundedText(120, 'An ingredient name'),
  quantity: z.coerce.number().min(0).max(9999),
  unit: boundedText(32, 'An ingredient unit'),
  /** True when the pantry already has it — this is what the gap list diffs. */
  from_pantry: z.boolean(),
})

export const macrosSchema = z.object({
  calories: z.coerce.number().int().min(0).max(10000),
  protein_g: z.coerce.number().min(0).max(1000),
  carbs_g: z.coerce.number().min(0).max(1000),
  fat_g: z.coerce.number().min(0).max(1000),
})

export const recipeSchema = z.object({
  name: boundedText(160, 'A recipe name'),
  cuisine: boundedText(40, 'A cuisine'),
  ingredients: z.array(ingredientSchema).min(1).max(40),
  /** The `OPTIONS:` supporting items — excluded from macros, fed to the gap list. */
  options: z.array(boundedText(120, 'An option')).max(20).default([]),
  instructions: z.array(boundedText(600, 'An instruction')).min(1).max(30),
  macros: macrosSchema,
  servings: z.coerce.number().int().min(1).max(12),
})

export const planDaySchema = z.object({
  day_index: z.coerce.number().int().min(0).max(6),
  breakfast: recipeSchema,
  lunch: recipeSchema,
  snack: recipeSchema,
  /** Exactly three, substantively unique (SPEC.md § 8.5). */
  supper_options: z.array(recipeSchema).length(3),
})

export const generatedPlanSchema = z.object({
  days: z.array(planDaySchema).length(7),
})

export type Ingredient = z.infer<typeof ingredientSchema>
export type Recipe = z.infer<typeof recipeSchema>
export type PlanDay = z.infer<typeof planDaySchema>
export type GeneratedPlan = z.infer<typeof generatedPlanSchema>
