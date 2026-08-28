import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '@/lib/utils'

/**
 * The two-green rule, encoded (SPEC.md § 11):
 *
 * `solid` is the only variant that puts white text on green, and it fills with
 * `cta-dark` #4D7735 (5.24:1) — never `cta` #5B8C3E (3.99:1), which fails the
 * 4.5:1 minimum for normal-size text. There is deliberately no variant that
 * fills with `cta`; `cta` appears here only as the `outline` variant's border
 * and as the focus outline, both of which § 11 permits.
 */
const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
    'transition-colors disabled:pointer-events-none disabled:opacity-60',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    focusRing
  ),
  {
    variants: {
      variant: {
        solid: 'bg-cta-dark text-white hover:bg-cta-dark/90',
        outline: 'border border-cta bg-transparent text-text hover:bg-tint',
        subtle: 'bg-tint text-text hover:bg-tint/70',
        ghost: 'bg-transparent text-text hover:bg-tint',
      },
      size: {
        sm: 'h-9 px-3 text-sm [&_svg]:size-4',
        md: 'h-10 px-4 text-base [&_svg]:size-4',
        lg: 'h-12 px-6 text-lg [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...(asChild ? {} : { type: type ?? 'button' })}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
