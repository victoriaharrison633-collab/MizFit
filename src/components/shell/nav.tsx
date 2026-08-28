'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageCircle, ShoppingBasket } from 'lucide-react'
import { cn, focusRing } from '@/lib/utils'

/**
 * The two surfaces of the app (SPEC.md § 6 page routes): the chat, built by
 * Prompt 7, and the pantry, built by Prompt 9. Both links exist now; neither
 * page does yet.
 */
const NAV_ITEMS = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/pantry', label: 'Pantry', icon: ShoppingBasket },
] as const

/**
 * Primary navigation.
 *
 * The current page is marked four ways, only one of which is colour (SPEC.md
 * § 11a non-negotiable 1): `aria-current="page"` for assistive technology, a
 * bold label, a filled surface, and an underline bar. Remove every colour from
 * this component and the active item is still obvious.
 *
 * Both items are ordinary links, so they are keyboard-reachable in document
 * order and pick up the shared `focusRing` — a real outline, at 3:1 against any
 * surface behind it (SPEC.md § 11a non-negotiable 2).
 */
export function Nav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Main">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text',
                  'hover:bg-tint',
                  active ? 'bg-tint font-semibold' : 'font-medium',
                  focusRing
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {item.label}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-cta"
                  />
                ) : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
