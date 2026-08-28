import { CalendarDays, Package, Snowflake, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { todayUtc, toUtcDate } from '@/lib/validation/common'

export interface ExpiryBadgeProps {
  /** UTC calendar date, or null for a permanent staple (SPEC.md § 4.6). */
  expiryDate: string | null
  isFrozen: boolean
}

/**
 * How soon an item goes off.
 *
 * Every state is spelled out in words and carries its own icon — nothing here
 * relies on colour to be understood, which matters more than usual since this
 * palette has no red to lean on (SPEC.md § 11a non-negotiable 1).
 *
 * A NULL expiry is a staple, not "unknown" and not "expiring never soon": it is
 * excluded from spoilage priority entirely, so it gets its own label rather
 * than a date comparison.
 */
export function ExpiryBadge({ expiryDate, isFrozen }: ExpiryBadgeProps) {
  const frozen = isFrozen ? (
    <span className="inline-flex items-center gap-1 text-xs text-text">
      <Snowflake aria-hidden="true" className="size-3.5 shrink-0" />
      Frozen
    </span>
  ) : null

  if (expiryDate === null) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-xs text-text">
          <Package aria-hidden="true" className="size-3.5 shrink-0" />
          Staple
        </span>
        {frozen}
      </span>
    )
  }

  const days = Math.round(
    (toUtcDate(expiryDate).getTime() - toUtcDate(todayUtc()).getTime()) / 86_400_000
  )

  const urgent = days <= 2
  const label =
    days < 0
      ? `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
      : days === 0
        ? 'Use today'
        : days === 1
          ? 'Use tomorrow'
          : `${days} days left`

  const Icon = urgent ? TriangleAlert : CalendarDays

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs text-text',
          urgent && 'font-semibold underline decoration-2 underline-offset-2'
        )}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </span>
      {frozen}
    </span>
  )
}
