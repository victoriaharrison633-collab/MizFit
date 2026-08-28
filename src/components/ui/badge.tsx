import * as React from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Status badge.
 *
 * SPEC.md § 11a non-negotiable 1 names the states this build carries by colour
 * — expiring pantry items, approved days, validation errors, the selected
 * supper option — and requires each to be paired with an icon or a text label.
 * That pairing is built into the variant rather than left to the caller: every
 * variant except the neutral default renders its own icon, so a badge cannot be
 * rendered in a meaningful state without one.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'approved' | 'attention'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  neutral: 'bg-tint text-text',
  approved: 'bg-cta-dark text-white',
  attention: 'border border-cta bg-white text-text',
}

const variantIcons = {
  neutral: null,
  approved: Check,
  attention: AlertCircle,
} as const

function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const Icon = variantIcons[variant]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={3} /> : null}
      {children}
    </span>
  )
}

export { Badge }
