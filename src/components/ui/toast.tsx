'use client'

import * as React from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { cn, focusRing } from '@/lib/utils'

/**
 * Toast.
 *
 * Every tone renders an icon AND a leading word ("Success", "Error"), so the
 * meaning survives without colour perception and without images
 * (SPEC.md § 11a non-negotiable 1). The tone is also mapped to the right ARIA
 * politeness: an error interrupts, a success does not.
 */
const ToastProvider = ToastPrimitive.Provider

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-sm',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

type ToastTone = 'info' | 'success' | 'error'

const toneConfig = {
  info: { icon: null, word: null, className: 'border-muted bg-bg', politeness: 'polite' },
  success: {
    icon: CheckCircle2,
    word: 'Success:',
    className: 'border-cta bg-tint',
    politeness: 'polite',
  },
  error: {
    icon: AlertCircle,
    word: 'Error:',
    className: 'border-2 border-text bg-bg',
    politeness: 'assertive',
  },
} as const

export interface ToastProps
  extends Omit<React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, 'type'> {
  tone?: ToastTone
}

const Toast = React.forwardRef<React.ComponentRef<typeof ToastPrimitive.Root>, ToastProps>(
  ({ className, tone = 'info', children, ...props }, ref) => {
    const config = toneConfig[tone]
    const Icon = config.icon

    return (
      <ToastPrimitive.Root
        ref={ref}
        type={config.politeness === 'assertive' ? 'foreground' : 'background'}
        className={cn(
          'flex items-start gap-3 rounded-card border p-4 text-text shadow-md',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          config.className,
          className
        )}
        {...props}
      >
        {Icon ? <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" /> : null}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {config.word ? <span className="sr-only">{config.word}</span> : null}
          {children}
        </div>
      </ToastPrimitive.Root>
    )
  }
)
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn('font-semibold text-text', className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description ref={ref} className={cn('text-sm text-text', className)} {...props} />
))
ToastDescription.displayName = ToastPrimitive.Description.displayName

const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'mt-1 inline-flex h-8 items-center rounded-md border border-cta px-3 text-sm font-medium text-text hover:bg-tint',
      focusRing,
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitive.Action.displayName

const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn('shrink-0 rounded-md p-1 text-text hover:bg-tint', focusRing, className)}
    {...props}
  >
    <X aria-hidden="true" className="size-4" />
    <span className="sr-only">Dismiss</span>
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
}
