import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LogoProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Rendered as a heading elsewhere; defaults to an inline wordmark. */
  as?: 'span' | 'h1'
}

/**
 * MizFit wordmark.
 *
 * "Miz" is set in Text #2C3E2D and "Fit" in CTA #5B8C3E. The green half is only
 * ever used at `text-2xl font-bold` and above, which is large/bold text —
 * exactly what SPEC.md § 11 permits #5B8C3E for. It is never rendered at
 * normal-size body weight.
 */
function Logo({ className, as: Component = 'span', ...props }: LogoProps) {
  return (
    <Component className={cn('inline-block text-2xl font-bold tracking-tight', className)} {...props}>
      <span className="text-text">Miz</span>
      <span className="text-cta">Fit</span>
    </Component>
  )
}

export { Logo }
