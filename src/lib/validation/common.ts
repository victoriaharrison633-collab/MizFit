import { z } from 'zod'

/**
 * Reusable boundary schemas (CLAUDE.md Rule 8).
 *
 * Every body, query param, and route param in this app is parsed by a schema
 * before use. The primitives live here so a route never invents its own bound:
 * numeric fields carry explicit min/max, free text carries a length cap, and
 * every date is a UTC calendar date rather than a timestamp (SPEC.md § 4.11).
 *
 * No secrets, no server-only imports — the same schemas back client-side form
 * feedback, with the server parse remaining the enforcement.
 */

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

/**
 * Every route param id (`[itemId]`, `[planId]`, `[dayId]`) is a database uuid.
 * Parsing the shape first means a malformed id is a 400 at the boundary rather
 * than a Postgres cast error surfacing from inside a query.
 */
export const uuidSchema = z.uuid({ error: 'That id is not valid.' })

// ---------------------------------------------------------------------------
// UTC calendar dates (SPEC.md § 4.11 — dates only, never timestamps)
// ---------------------------------------------------------------------------

const UTC_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * True only for a `YYYY-MM-DD` string that names a real calendar day.
 *
 * The round-trip through `Date.UTC` rejects `2025-02-30`, which
 * `new Date('2025-02-30')` would happily roll forward into March.
 */
function isCalendarDate(value: string): boolean {
  if (!UTC_DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  const utc = new Date(Date.UTC(year, month - 1, day))
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  )
}

/**
 * A UTC calendar date, kept as its `YYYY-MM-DD` string.
 *
 * It deliberately does not transform into a `Date`. A `Date` is an instant, and
 * the moment one is formatted with a local-timezone method the stored day can
 * shift — which is exactly the class of bug SPEC.md § 4.11 rules out. Use
 * `toUtcDate` where date arithmetic is genuinely needed, and `formatUtcDate` to
 * come back.
 */
export const utcDateSchema = z
  .string()
  .refine(isCalendarDate, { error: 'Use a date in YYYY-MM-DD form.' })

/** `YYYY-MM-DD` → the instant at UTC midnight on that day. */
export function toUtcDate(value: string): Date {
  if (!isCalendarDate(value)) {
    throw new Error(`toUtcDate received a value that is not a UTC calendar date: ${value}`)
  }
  const [year, month, day] = value.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(year, month - 1, day))
}

/** The UTC calendar day of an instant, as `YYYY-MM-DD`. Never local time. */
export function formatUtcDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today as a UTC calendar date. The one clock read for date math. */
export function todayUtc(): string {
  return formatUtcDate(new Date())
}

// ---------------------------------------------------------------------------
// Bounded numbers
// ---------------------------------------------------------------------------

/**
 * A whole number inside an explicit, inclusive range.
 *
 * Accepts the numeric string a form or query param produces, so a route does
 * not hand-roll a `Number(...)` before parsing. Rejects NaN, Infinity, and
 * fractional input rather than rounding it.
 */
export function boundedInt(min: number, max: number, message?: string) {
  const fallback = message ?? `Enter a whole number between ${min} and ${max}.`
  return z.coerce.number({ error: fallback }).int(fallback).min(min, fallback).max(max, fallback)
}

/** A decimal inside an explicit, inclusive range. */
export function boundedNumber(min: number, max: number, message?: string) {
  const fallback = message ?? `Enter a number between ${min} and ${max}.`
  return z.coerce.number({ error: fallback }).finite(fallback).min(min, fallback).max(max, fallback)
}

/**
 * The largest value a Postgres `numeric(precision, scale)` column can hold, so
 * a bound is derived from the column definition rather than guessed. `(10, 2)`
 * gives 99999999.99.
 */
export function numericColumnMax(precision: number, scale: number): number {
  return Number((10 ** (precision - scale) - 10 ** -scale).toFixed(scale))
}

// ---------------------------------------------------------------------------
// Bounded free text
// ---------------------------------------------------------------------------

/** C0/C1 control characters. Nothing a user types into a form contains these. */
const CONTROL_CHARACTERS = /\p{Cc}/u

/**
 * Trimmed, non-empty free text with an explicit length cap.
 *
 * The cap is checked after trimming, so trailing whitespace cannot smuggle a
 * value past the column width. Control characters are rejected outright.
 * Escaping is the render layer's job — these values are never rendered as HTML
 * (SPEC.md § 4.6).
 */
export function boundedText(maxLength: number, label = 'This field') {
  return z
    .string()
    .trim()
    .min(1, `${label} cannot be empty.`)
    .max(maxLength, `${label} must be ${maxLength} characters or fewer.`)
    .refine((value) => !CONTROL_CHARACTERS.test(value), {
      error: `${label} contains characters that are not allowed.`,
    })
}

// ---------------------------------------------------------------------------
// Named bounds from SPEC.md
//
// Only the fields whose bounds SPEC.md states are here. `weight`, `height`, and
// the calorie override are bounded by Prompt 8 alongside the § 7 clamp that
// gives them meaning — they use `boundedNumber` / `boundedInt` above.
// ---------------------------------------------------------------------------

/** SPEC.md § 4.4 — `profiles.age`, 13–120. */
export const ageSchema = boundedInt(13, 120, 'Enter an age between 13 and 120.')

/** SPEC.md § 4.4 — `profiles.servings_per_meal`, 1–12. */
export const servingsPerMealSchema = boundedInt(1, 12, 'Choose between 1 and 12 servings.')

/** SPEC.md § 4.8 — `meal_plan_days.selected_supper_index`, one of exactly three options. */
export const supperOptionIndexSchema = boundedInt(0, 2, 'Choose one of the three supper options.')

/** SPEC.md § 4.6 — `pantry_items.name`, text ≤ 120 chars, free text. */
export const pantryItemNameSchema = boundedText(120, 'The item name')

/** SPEC.md § 4.6 — `pantry_items.unit`, text ≤ 32 chars, free text, not an enum. */
export const pantryUnitSchema = boundedText(32, 'The unit')

/**
 * SPEC.md § 4.6 — `pantry_items.quantity numeric(10,2)`. Must stay numeric, not
 * integer: half a pound of green beans is a real pantry row. The upper bound is
 * the column's own limit; the lower bound excludes zero, since a quantity of
 * nothing is a delete, not an item.
 */
export const pantryQuantitySchema = boundedNumber(
  0.01,
  numericColumnMax(10, 2),
  'Enter a quantity greater than zero.'
)

/** SPEC.md § 4.6 — `pantry_items.expiry_date date null`. NULL = permanent staple. */
export const expiryDateSchema = utcDateSchema.nullable()
