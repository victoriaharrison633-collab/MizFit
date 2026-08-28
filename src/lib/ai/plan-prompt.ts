import type { PantryItem, Profile } from '@/lib/db/queries'
import type { DayMacros } from '@/lib/profile/methodology'

/**
 * The prompt for the one Anthropic call in this build (SPEC.md § 8).
 *
 * Only used when mocking is off. Constraint precedence is SPEC.md § 8.6a; the
 * dietary exclusions are a hard prohibition (§ 8.2b) and are stated first and
 * last, because that is the constraint whose violation is a medical problem
 * rather than a preference miss.
 */
export interface PlanPromptInput {
  profile: Profile
  pantry: PantryItem[]
  cuisinePreferences: string[]
  weekMacros: DayMacros[]
}

const SEASONINGS = 'salt, pepper, cooking oils, and common dried herbs and spices'

export function buildPlanPrompt({
  profile,
  pantry,
  cuisinePreferences,
  weekMacros,
}: PlanPromptInput) {
  const exclusions = profile.dietary_exclusions ?? []

  const system = [
    'You plan a one-week meal plan for a home cook, Sunday through Saturday.',
    exclusions.length
      ? `HARD CONSTRAINT: the household cannot eat ${exclusions.join(', ')}. No recipe, ingredient, or supporting item may contain them, in any form. This overrides every other instruction.`
      : 'The household has no dietary exclusions.',
    'Priorities, in order: dietary exclusions, calorie and macro targets, using pantry items that expire soonest, the diet methodology, then cuisine preference.',
    `Assume ${SEASONINGS} are always available and never list them as items to buy.`,
    'Each day has one breakfast, one lunch, one snack, and EXACTLY THREE substantively different supper options — different proteins or techniques, not garnish swaps.',
    'Do not repeat a main across the week.',
    'Return JSON only, matching the requested shape exactly.',
  ].join('\n')

  const pantryLines = pantry
    .map(
      (item) =>
        `- ${item.name}: ${item.quantity} ${item.unit}${item.expiry_date ? ` (expires ${item.expiry_date})` : ' (staple)'}${item.is_frozen ? ' [frozen — add a thaw reminder]' : ''}`
    )
    .join('\n')

  const macroLines = weekMacros
    .map(
      (day, index) =>
        `Day ${index} (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}, ${day.day_macro_type}): ${day.calories} kcal, ${day.protein_g}g protein, ${day.carbs_g}g carbs, ${day.fat_g}g fat`
    )
    .join('\n')

  const user = [
    `Diet methodology: ${profile.diet_methodology}.`,
    `Servings per meal: ${profile.servings_per_meal}.`,
    cuisinePreferences.length
      ? `Cuisine leaning: ${cuisinePreferences.join(', ')}.`
      : 'No cuisine preference.',
    '',
    'Daily targets:',
    macroLines,
    '',
    'Pantry on hand (use what expires soonest first):',
    pantryLines,
    '',
    'Mark each ingredient with from_pantry true or false. Put supporting items the recipe suggests but does not need in "options".',
  ].join('\n')

  return { system, user }
}
