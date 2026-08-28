import { formatUtcDate, toUtcDate, todayUtc } from '@/lib/validation/common'
import type { ActivityLevel, ProfileSex } from '@/lib/db/queries'

/**
 * Calorie target maths (SPEC.md § 7). Deterministic and pure — this never goes
 * near the AI (CLAUDE.md Rule 14), and the server re-runs it even when the
 * client already did, because the clamp is a safety boundary.
 *
 * All dates are UTC calendar dates (SPEC.md § 4.11).
 */

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
}

/** SPEC.md § 7 step 4. */
const CALORIE_FLOOR: Record<ProfileSex, number> = {
  male: 1500,
  female: 1200,
  prefer_not_to_say: 1200,
}

const MAX_DAILY_DEFICIT = 1000
const CALORIES_PER_POUND = 3500
const LBS_PER_KG = 2.20462

export interface TdeeInput {
  age: number
  biological_sex: ProfileSex
  height_cm: number
  current_weight_lbs: number
  goal_weight_lbs: number
  /** UTC calendar date, `YYYY-MM-DD`. */
  target_date: string
  activity_level: ActivityLevel
}

export interface TdeeResult {
  bmr: number
  tdee: number
  /** What the requested target date would demand per day, before clamping. */
  requested_deficit: number
  /** The deficit actually applied after the floor and max-deficit clamps. */
  daily_deficit: number
  calorie_target: number
  /** UTC date the goal weight is reached at the effective deficit. */
  estimated_completion_date: string
  /** True when the requested pace was unsafe and the timeline was extended. */
  was_clamped: boolean
}

function round(value: number): number {
  return Math.round(value)
}

/** Mifflin-St Jeor. `prefer_not_to_say` averages both formulas (SPEC.md § 7). */
export function calculateBmr(
  input: Pick<TdeeInput, 'age' | 'biological_sex' | 'height_cm' | 'current_weight_lbs'>
): number {
  const kg = input.current_weight_lbs / LBS_PER_KG
  const base = 10 * kg + 6.25 * input.height_cm - 5 * input.age
  const male = base + 5
  const female = base - 161

  switch (input.biological_sex) {
    case 'male':
      return male
    case 'female':
      return female
    case 'prefer_not_to_say':
      return (male + female) / 2
  }
}

export function daysBetweenUtc(from: string, to: string): number {
  const ms = toUtcDate(to).getTime() - toUtcDate(from).getTime()
  return Math.round(ms / 86_400_000)
}

export function addUtcDays(date: string, days: number): string {
  const result = toUtcDate(date)
  result.setUTCDate(result.getUTCDate() + days)
  return formatUtcDate(result)
}

/**
 * The whole § 7 chain: BMR → TDEE → required deficit → clamped target →
 * recomputed completion date.
 *
 * A target date in the past or today is treated as "as fast as safely possible":
 * the deficit is capped anyway, so the answer is the same clamp the safety rule
 * would have applied, and the timeline is reported honestly rather than
 * dividing by zero.
 */
export function calculateCalorieTarget(input: TdeeInput, today = todayUtc()): TdeeResult {
  const bmr = calculateBmr(input)
  const tdee = bmr * ACTIVITY_MULTIPLIER[input.activity_level]

  const lbsToLose = Math.max(0, input.current_weight_lbs - input.goal_weight_lbs)
  const daysAvailable = Math.max(1, daysBetweenUtc(today, input.target_date))

  const requestedDeficit = (lbsToLose * CALORIES_PER_POUND) / daysAvailable

  const floor = CALORIE_FLOOR[input.biological_sex]
  // Two clamps, both from SPEC.md § 7 step 4: never below the floor, and never
  // more than 1000 kcal/day below maintenance.
  const deficitAllowedByFloor = Math.max(0, tdee - floor)
  const dailyDeficit = Math.min(requestedDeficit, MAX_DAILY_DEFICIT, deficitAllowedByFloor)

  const calorieTarget = round(tdee - dailyDeficit)

  // At the effective deficit, how long the goal actually takes.
  const daysNeeded =
    lbsToLose === 0 || dailyDeficit <= 0
      ? daysAvailable
      : Math.ceil((lbsToLose * CALORIES_PER_POUND) / dailyDeficit)

  return {
    bmr: round(bmr),
    tdee: round(tdee),
    requested_deficit: round(requestedDeficit),
    daily_deficit: round(dailyDeficit),
    calorie_target: calorieTarget,
    estimated_completion_date: addUtcDays(today, daysNeeded),
    was_clamped: requestedDeficit > dailyDeficit + 0.5,
  }
}

export interface OverrideResult {
  calorie_target: number
  daily_deficit: number
  estimated_completion_date: string
  /** True when the number the user typed was moved by the clamp. */
  was_adjusted: boolean
}

/**
 * A user-supplied target run through the *same* clamp (SPEC.md § 7 step 5).
 * The client's number is never persisted as-is (Rule 14).
 */
export function applyOverride(
  input: TdeeInput,
  requestedTarget: number,
  today = todayUtc()
): OverrideResult {
  const base = calculateCalorieTarget(input, today)
  const floor = CALORIE_FLOOR[input.biological_sex]

  const lowestAllowed = Math.max(floor, base.tdee - MAX_DAILY_DEFICIT)
  const calorieTarget = round(Math.min(Math.max(requestedTarget, lowestAllowed), base.tdee))

  const dailyDeficit = Math.max(0, base.tdee - calorieTarget)
  const lbsToLose = Math.max(0, input.current_weight_lbs - input.goal_weight_lbs)
  const daysNeeded =
    lbsToLose === 0 || dailyDeficit <= 0
      ? daysBetweenUtc(today, input.target_date)
      : Math.ceil((lbsToLose * CALORIES_PER_POUND) / dailyDeficit)

  return {
    calorie_target: calorieTarget,
    daily_deficit: round(dailyDeficit),
    estimated_completion_date: addUtcDays(today, Math.max(1, daysNeeded)),
    was_adjusted: calorieTarget !== round(requestedTarget),
  }
}
