'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

/**
 * A real `<label>`. SPEC.md § 11a non-negotiable 3: every form input has a
 * programmatically associated label, and a placeholder is not a label.
 */
const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium text-text', className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

/**
 * Visually hidden but still announced. For the case where the surrounding copy
 * already names the field on screen but the input still needs its own label.
 */
export function VisuallyHiddenLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <Label
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        '[clip:rect(0,0,0,0)]',
        className
      )}
      {...props}
    />
  )
}

export { Label }
