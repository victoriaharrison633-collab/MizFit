import { withApiHandler } from '@/lib/security/api-handler'
import { ApiError } from '@/lib/security/errors'
import { getProfile, updateProfile, type ProfileUpdate } from '@/lib/db/queries'
import { profilePatchSchema } from '@/lib/profile/schemas'
import { applyOverride, calculateCalorieTarget, type TdeeInput } from '@/lib/profile/tdee'

/**
 * PATCH /api/profile (SPEC.md § 6)
 *
 * The chat's structured steps call this incrementally, not as one final submit.
 * Every step writes on capture, which is what makes a mid-flow refresh resume
 * instead of restart (Rule 15).
 *
 * The calorie number is **always computed here**. Whatever the client sends is
 * either recomputed from the demographics or run back through the § 7 clamp; a
 * client value is never persisted as-is (Rule 14).
 */
export const PATCH = withApiHandler(
  { method: 'PATCH', rateLimit: 'mutation', body: profilePatchSchema },
  async (ctx) => {
    const patch: ProfileUpdate = {}
    let clamped: { was_clamped: boolean; requested?: number } = { was_clamped: false }

    if (ctx.body.demographics) {
      const demographics = ctx.body.demographics
      const result = calculateCalorieTarget(demographics as TdeeInput)

      Object.assign(patch, demographics, {
        calorie_target: result.calorie_target,
        daily_deficit: result.daily_deficit,
        estimated_completion_date: result.estimated_completion_date,
      })
      clamped = { was_clamped: result.was_clamped }
    }

    if (ctx.body.calorie_target !== undefined) {
      // The override path. Re-read the stored demographics rather than trusting
      // anything the client sent alongside the number.
      const existing = await getProfile(ctx.db, ctx.user.id)
      if (
        !existing ||
        existing.age === null ||
        existing.biological_sex === null ||
        existing.height_cm === null ||
        existing.current_weight_lbs === null ||
        existing.goal_weight_lbs === null ||
        existing.target_date === null ||
        existing.activity_level === null
      ) {
        throw new ApiError('VALIDATION_FAILED', {
          publicMessage: 'Tell us about you first, then we can set a calorie target.',
          detail: 'Calorie override attempted before demographics were captured',
        })
      }

      const override = applyOverride(
        {
          age: existing.age,
          biological_sex: existing.biological_sex,
          height_cm: Number(existing.height_cm),
          current_weight_lbs: Number(existing.current_weight_lbs),
          goal_weight_lbs: Number(existing.goal_weight_lbs),
          target_date: existing.target_date,
          activity_level: existing.activity_level,
        },
        ctx.body.calorie_target
      )

      patch.calorie_target = override.calorie_target
      patch.daily_deficit = override.daily_deficit
      patch.estimated_completion_date = override.estimated_completion_date
      clamped = { was_clamped: override.was_adjusted, requested: ctx.body.calorie_target }
    }

    if (ctx.body.servings_per_meal !== undefined)
      patch.servings_per_meal = ctx.body.servings_per_meal
    if (ctx.body.dietary_exclusions !== undefined)
      patch.dietary_exclusions = ctx.body.dietary_exclusions
    if (ctx.body.diet_methodology !== undefined) patch.diet_methodology = ctx.body.diet_methodology
    if (ctx.body.onboarding_step !== undefined) patch.onboarding_step = ctx.body.onboarding_step

    const profile = await updateProfile(ctx.db, ctx.user.id, patch)

    return { profile, was_clamped: clamped.was_clamped }
  }
)
