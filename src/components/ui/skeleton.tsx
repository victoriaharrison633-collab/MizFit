import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Announced to assistive technology while the real content loads. */
  label?: string
}

/**
 * Loading placeholder. Carries a `role="status"` label so the wait is announced
 * rather than being a purely visual cue.
 */
function Skeleton({ className, label = 'Loading', ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('animate-pulse rounded-md bg-tint', className)}
      {...props}
    />
  )
}

export { Skeleton }
