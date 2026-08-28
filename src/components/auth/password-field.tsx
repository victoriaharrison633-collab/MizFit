'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { PASSWORD_RULE_TEXT } from '@/lib/validation/password'

export interface PasswordFieldProps {
  name: string
  label: string
  /**
   * `new-password` on signup and reset so a password manager offers to generate
   * and save one; `current-password` on login so it offers the saved one. This
   * is the whole reason auth stays a standard form rather than a chat step
   * (SPEC.md § 3).
   */
  autoComplete: 'current-password' | 'new-password'
  /**
   * Show the policy under the field. True only where a password is being *set*
   * — the login form must not advertise the rules.
   *
   * The copy is `PASSWORD_RULE_TEXT`, the single string that states the
   * required length (SPEC.md § 2). This component never writes that number.
   */
  showPolicy?: boolean
  disabled?: boolean
  error?: string
}

/**
 * The password input for all three forms that take one.
 *
 * A real `<label>` comes from `Input`, which will not compile without one
 * (SPEC.md § 11a non-negotiable 3), and the policy is wired up through
 * `aria-describedby` so a screen reader hears the rules before the field, not
 * after a rejection.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  showPolicy = false,
  disabled,
  error,
}: PasswordFieldProps) {
  return (
    <Input
      type="password"
      name={name}
      label={label}
      autoComplete={autoComplete}
      description={showPolicy ? PASSWORD_RULE_TEXT : undefined}
      error={error}
      disabled={disabled}
      required
      spellCheck={false}
    />
  )
}
