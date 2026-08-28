'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn, focusRing } from '@/lib/utils'

/**
 * Tap-chip — the structured control the Mizfit Chat uses for dietary
 * exclusions, diet methodology and cuisine preference (SPEC.md § 3.1).
 *
 * Selection is announced through `aria-pressed` and shown with a check mark, so
 * the state never rests on fill colour alone (SPEC.md § 11a non-negotiable 1).
 */
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, selected = false, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium',
        'transition-colors disabled:pointer-events-none disabled:opacity-60',
        selected
          ? 'border-cta-dark bg-cta-dark text-white'
          : 'border-muted bg-white text-text hover:bg-tint',
        focusRing,
        className
      )}
      {...props}
    >
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0" strokeWidth={3} /> : null}
      {children}
    </button>
  )
)
Chip.displayName = 'Chip'

export { Chip }
