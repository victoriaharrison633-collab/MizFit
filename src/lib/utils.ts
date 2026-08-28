import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes, resolving conflicts in favour of the last one. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The one focus indicator for the whole design system (SPEC.md § 11a
 * non-negotiable 2: visible focus indicators at >= 3:1, and never `outline: none`
 * without an equally visible replacement).
 *
 * It is a real `outline`, not a ring, so the indicator does not depend on the
 * component sitting on a particular background — a ring with an offset has to
 * know the surface colour behind it, and gets it wrong the moment a control is
 * placed on a `tint` card.
 *
 * The outline colour is `cta` #5B8C3E, which SPEC.md § 11 verifies at 3.99:1 on
 * white and explicitly permits for UI borders.
 *
 * Nothing in this codebase sets `outline: none` / `outline-none`.
 */
export const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta'
