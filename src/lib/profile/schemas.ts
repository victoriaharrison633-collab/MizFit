import { z } from 'zod'
import { DIETARY_EXCLUSIONS } from '@/lib/db/queries'
import { STEP_KEYS } from '@/lib/chat/steps'
import {
  ageSchema,
  boundedInt,
  boundedNumber,
  servingsPerMealSchema,
  utcDateSchema,
} from '@/lib/validation/common'

/**
 * Zod bodies for `PATCH /api/profile` (SPEC.md § 6), one group per chat step.
 *
 * The chat calls this incrementally, so every group is optional and at least
 * one must be present. Bounds are explicit on every number (Rule 8); the
 * calorie override is bounded here only as a sanity range — the real safety
 * clamp is § 7's, re-applied server-side in the route (Rule 14).
 */

export const demographicsSchema = z.object({
  age: ageSchema,
  biological_sex: z.enum(['male', 'female', 'prefer_not_to_say']),
  height_cm: boundedNumber(90, 250, 'Enter a height between 90cm and 250cm.'),
  current_weight_lbs: boundedNumber(70, 1000, 'Enter a weight between 70 and 1000 lbs.'),
  goal_weight_lbs: boundedNumber(70, 1000, 'Enter a goal weight between 70 and 1000 lbs.'),
  target_date: utcDateSchema,
  activity_level: z.enum([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active',
  ]),
})

export const profilePatchSchema = z
  .object({
    demographics: demographicsSchema.optional(),
    /** A user override. Re-clamped server-side; never persisted as sent. */
    calorie_target: boundedInt(
      500,
      10000,
      'Enter a calorie target between 500 and 10000.'
    ).optional(),
    servings_per_meal: servingsPerMealSchema.optional(),
    dietary_exclusions: z
      .array(z.enum(DIETARY_EXCLUSIONS))
      .max(DIETARY_EXCLUSIONS.length)
      .optional(),
    diet_methodology: z
      .enum(['carb_cycling', 'high_protein', 'vegetarian', 'pescatarian'])
      .optional(),
    /** Resume position, written on every capture so a refresh continues. */
    onboarding_step: z.enum(STEP_KEYS).optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    error: 'Nothing to update.',
  })

export type ProfilePatch = z.infer<typeof profilePatchSchema>
export type Demographics = z.infer<typeof demographicsSchema>
