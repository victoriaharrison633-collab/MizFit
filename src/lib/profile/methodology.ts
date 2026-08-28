import type { DayMacroType, DietMethodology } from '@/lib/db/queries'

/**
 * Macro schedules (SPEC.md § 8.1, § 8.2).
 *
 * Percentages of the personalised `calorie_target`, never a fixed calorie
 * number. Carb cycling varies by day of the week; the other three are fixed.
 */

export interface MacroSplit {
  /** Percent of calories. The three always sum to 100. */
  protein_pct: number
  carbs_pct: number
  fat_pct: number
}

export interface DayMacros extends MacroSplit {
  day_macro_type: DayMacroType
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

/** SPEC.md § 8.2. */
const FIXED_SPLITS: Record<Exclude<DietMethodology, 'carb_cycling'>, MacroSplit> = {
  high_protein: { protein_pct: 45, carbs_pct: 25, fat_pct: 30 },
  vegetarian: { protein_pct: 30, carbs_pct: 40, fat_pct: 30 },
  pescatarian: { protein_pct: 30, carbs_pct: 40, fat_pct: 30 },
}

/**
 * SPEC.md § 8.1, resolved to the midpoint of each stated range. Index 0 is
 * Sunday, matching `meal_plan_days.day_index` (SPEC.md § 4.8).
 */
const CARB_CYCLE: readonly { type: DayMacroType; split: MacroSplit }[] = [
  { type: 'high', split: { carbs_pct: 47, protein_pct: 28, fat_pct: 25 } },
  { type: 'mid', split: { carbs_pct: 33, protein_pct: 33, fat_pct: 34 } },
  { type: 'low', split: { carbs_pct: 13, protein_pct: 42, fat_pct: 45 } },
  { type: 'high', split: { carbs_pct: 47, protein_pct: 28, fat_pct: 25 } },
  { type: 'mid', split: { carbs_pct: 33, protein_pct: 33, fat_pct: 34 } },
  { type: 'low', split: { carbs_pct: 13, protein_pct: 42, fat_pct: 45 } },
  { type: 'low', split: { carbs_pct: 13, protein_pct: 42, fat_pct: 45 } },
]

/**
 * Startup assertion, required by SPEC.md § 8.2: a split that does not sum to
 * 100 is a boot failure, not a diet that gets silently renormalised into
 * something nobody chose. The § 8.1 point values resolved above are held to the
 * same rule.
 */
function assertSumsTo100(label: string, split: MacroSplit): void {
  const total = split.protein_pct + split.carbs_pct + split.fat_pct
  if (total !== 100) {
    throw new Error(`Macro split "${label}" sums to ${total}%, not 100% (SPEC.md § 8.2).`)
  }
}

for (const [name, split] of Object.entries(FIXED_SPLITS)) {
  assertSumsTo100(name, split)
}
CARB_CYCLE.forEach((day, index) => assertSumsTo100(`carb_cycling day ${index}`, day.split))

/** Calories per gram. */
const PROTEIN_KCAL = 4
const CARB_KCAL = 4
const FAT_KCAL = 9

/** The macro targets for one day of the plan. */
export function macrosForDay(
  methodology: DietMethodology,
  dayIndex: number,
  calorieTarget: number
): DayMacros {
  const resolved =
    methodology === 'carb_cycling'
      ? CARB_CYCLE[dayIndex % 7]!
      : { type: 'fixed' as DayMacroType, split: FIXED_SPLITS[methodology] }

  const { split } = resolved

  return {
    ...split,
    day_macro_type: resolved.type,
    calories: calorieTarget,
    protein_g: Math.round((calorieTarget * split.protein_pct) / 100 / PROTEIN_KCAL),
    carbs_g: Math.round((calorieTarget * split.carbs_pct) / 100 / CARB_KCAL),
    fat_g: Math.round((calorieTarget * split.fat_pct) / 100 / FAT_KCAL),
  }
}

/** All seven days, Sunday first. */
export function macrosForWeek(methodology: DietMethodology, calorieTarget: number): DayMacros[] {
  return Array.from({ length: 7 }, (_, index) => macrosForDay(methodology, index, calorieTarget))
}
