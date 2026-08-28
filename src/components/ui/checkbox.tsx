'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn, focusRing } from '@/lib/utils'
import { Label, VisuallyHiddenLabel } from '@/components/ui/label'

/**
 * Same labelling contract as Input (SPEC.md § 11a non-negotiable 3): a visible
 * `label`, an `aria-label`, or an `aria-labelledby` — one of the three is
 * required by the type.
 *
 * Checked state is carried by a check mark, not by fill colour alone
 * (§ 11a non-negotiable 1).
 */
type LabellingProps =
  | { label: string; hideLabel?: boolean; 'aria-label'?: never; 'aria-labelledby'?: never }
  | { label?: never; hideLabel?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { label?: never; hideLabel?: never; 'aria-label'?: never; 'aria-labelledby': string }

export type CheckboxProps = Omit<
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
  'aria-label' | 'aria-labelledby'
> &
  LabellingProps & { description?: string }

const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, hideLabel, description, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id ?? generatedId
  const descriptionId = `${checkboxId}-description`

  const LabelComponent = hideLabel ? VisuallyHiddenLabel : Label

  return (
    <div className="relative flex items-start gap-2">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          'mt-0.5 size-5 shrink-0 rounded border border-muted bg-white',
          'data-[state=checked]:border-cta-dark data-[state=checked]:bg-cta-dark',
          'disabled:cursor-not-allowed disabled:opacity-60',
          focusRing,
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          <Check aria-hidden="true" className="size-4" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="flex flex-col gap-0.5">
        {label ? <LabelComponent htmlFor={checkboxId}>{label}</LabelComponent> : null}
        {description ? (
          <p id={descriptionId} className="text-sm text-text">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
