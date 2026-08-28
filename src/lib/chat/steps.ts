import { DIETARY_EXCLUSIONS, CUISINE_PREFERENCES } from '@/lib/db/queries'

/**
 * The ordered step registry (SPEC.md § 3.1).
 *
 * The chat is templated copy plus structured controls — never NLP (CLAUDE.md
 * Rule 15). Each step declares its expected answer shape once, here, so a
 * future free-text layer can map onto the same shapes instead of forcing a
 * rewrite.
 *
 * Resume position is `profiles.onboarding_step`, which is one of these keys.
 */
export const STEP_KEYS = [
  'welcome',
  'demographics',
  'calorie_confirm',
  'servings',
  'dietary_exclusions',
  'methodology',
  'pantry_confirm',
  'cuisine',
  'generate',
  'review',
  'grocery',
] as const

export type StepKey = (typeof STEP_KEYS)[number]

export function nextStep(current: StepKey): StepKey {
  const index = STEP_KEYS.indexOf(current)
  return STEP_KEYS[Math.min(index + 1, STEP_KEYS.length - 1)]!
}

export function stepIndex(step: StepKey): number {
  return STEP_KEYS.indexOf(step)
}

/** Chip sets, taken from the fixed value sets rather than restated. */
export const DIETARY_EXCLUSION_CHIPS = DIETARY_EXCLUSIONS.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))

export const CUISINE_CHIPS = CUISINE_PREFERENCES.map((value) => ({
  value,
  label:
    value === 'american_comfort'
      ? 'American comfort'
      : value.charAt(0).toUpperCase() + value.slice(1),
}))

export const METHODOLOGY_CHIPS = [
  {
    value: 'carb_cycling',
    label: 'Carb cycling',
    hint: 'Carbs rotate high / mid / low across the week',
  },
  { value: 'high_protein', label: 'High protein', hint: 'Same split every day, protein-led' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'No meat, poultry, fish or seafood' },
  { value: 'pescatarian', label: 'Pescatarian', hint: 'Fish and seafood, no meat or poultry' },
] as const

export const SEX_CHIPS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

export const ACTIVITY_CHIPS = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise' },
  { value: 'lightly_active', label: 'Lightly active', hint: 'Light exercise 1–3 days a week' },
  { value: 'moderately_active', label: 'Moderately active', hint: 'Exercise 3–5 days a week' },
  { value: 'very_active', label: 'Very active', hint: 'Hard exercise 6–7 days a week' },
  { value: 'extra_active', label: 'Extra active', hint: 'Physical job or twice-daily training' },
] as const
