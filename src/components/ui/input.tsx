'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn, focusRing } from '@/lib/utils'
import { Label, VisuallyHiddenLabel } from '@/components/ui/label'

/**
 * SPEC.md § 11a non-negotiable 3, encoded in the type rather than documented:
 * an Input must be given a visible `label`, an `aria-label`, or an
 * `aria-labelledby`. Rendering one with only a `placeholder` is a compile
 * error, because a placeholder disappears on input and is not reliably
 * announced.
 */
type LabellingProps =
  | { label: string; hideLabel?: boolean; 'aria-label'?: never; 'aria-labelledby'?: never }
  | { label?: never; hideLabel?: never; 'aria-label': string; 'aria-labelledby'?: never }
  | { label?: never; hideLabel?: never; 'aria-label'?: never; 'aria-labelledby': string }

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'aria-label' | 'aria-labelledby'
> &
  LabellingProps & {
    /** Helper copy rendered under the field and wired up via aria-describedby. */
    description?: string
    /**
     * Validation message. Rendered with an icon and the word "Error", never as a
     * colour change alone (SPEC.md § 11a non-negotiable 1).
     */
    error?: string
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hideLabel, description, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const inputId = id ?? generatedId
    const descriptionId = `${inputId}-description`
    const errorId = `${inputId}-error`

    const describedBy =
      [description ? descriptionId : null, error ? errorId : null].filter(Boolean).join(' ') ||
      undefined

    const LabelComponent = hideLabel ? VisuallyHiddenLabel : Label

    return (
      <div className="relative flex flex-col gap-1.5">
        {label ? <LabelComponent htmlFor={inputId}>{label}</LabelComponent> : null}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-10 w-full rounded-md border bg-white px-3 py-2 text-base text-text',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60',
            // The error state changes the border WEIGHT, not just its colour, so
            // it survives being viewed without colour perception.
            error ? 'border-2 border-text' : 'border-muted',
            focusRing,
            className
          )}
          {...props}
        />
        {description ? (
          <p id={descriptionId} className="text-sm text-text">
            {description}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="flex items-start gap-1.5 text-sm font-medium text-text">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-semibold">Error:</span> {error}
            </span>
          </p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
