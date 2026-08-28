/**
 * PLANS — tier limits.
 *
 * The numbers below are copied from SPEC.md § 9 and appear in no other file
 * (SPEC.md § 9, CLAUDE.md "Tiers are documented, not billing-enforced").
 *
 * Tiers are DOCUMENTED, NOT ENFORCED in this build. Every authenticated user
 * gets full feature access. Nothing reads `tier` to gate a feature — this
 * constant and the `subscriptions` table exist so Stripe wiring later is
 * additive rather than a rebuild.
 */

/** Matches the `plan_tier` enum in SPEC.md § 4.1. */
export type PlanTier = 'free' | 'pro' | 'elite'

/** `null` means unlimited. */
export type PlanLimit = number | null

export interface Plan {
  readonly key: PlanTier
  readonly label: string
  readonly priceMonthlyUsd: number
  readonly priceYearlyUsd: number
  /** Days of meal planning allowed per month. */
  readonly planningAllowanceDaysPerMonth: number
  /** Day regenerations allowed per day. `null` = unlimited. */
  readonly regenerationsPerDay: PlanLimit
  /** Pantry photo uploads per month. N/A in this build — there is no photo feature yet. */
  readonly pantryPhotoUploadsPerMonth: PlanLimit
  readonly receiptScanning: boolean
  readonly pdfExport: boolean
  /** Always false in this build. No subscription gate is enforced anywhere. */
  readonly enforcedInThisBuild: false
}

export const PLANS: Readonly<Record<PlanTier, Plan>> = Object.freeze({
  free: Object.freeze({
    key: 'free',
    label: 'Free',
    priceMonthlyUsd: 0,
    priceYearlyUsd: 0,
    planningAllowanceDaysPerMonth: 7,
    regenerationsPerDay: 1,
    pantryPhotoUploadsPerMonth: 0,
    receiptScanning: false,
    pdfExport: false,
    enforcedInThisBuild: false,
  }),
  pro: Object.freeze({
    key: 'pro',
    label: 'Pro',
    priceMonthlyUsd: 24.99,
    priceYearlyUsd: 285,
    planningAllowanceDaysPerMonth: 14,
    regenerationsPerDay: 4,
    pantryPhotoUploadsPerMonth: 15,
    receiptScanning: false,
    pdfExport: true,
    enforcedInThisBuild: false,
  }),
  elite: Object.freeze({
    key: 'elite',
    label: 'Elite',
    priceMonthlyUsd: 35,
    priceYearlyUsd: 378,
    planningAllowanceDaysPerMonth: 30,
    regenerationsPerDay: null,
    pantryPhotoUploadsPerMonth: null,
    receiptScanning: true,
    pdfExport: true,
    enforcedInThisBuild: false,
  }),
})
