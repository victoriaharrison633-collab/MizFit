import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ShoppingBasket, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'

export const metadata: Metadata = {
  title: 'MizFit — a week of meals from the food you already have',
  description:
    'Tell MizFit about you, and it plans a week of meals around your pantry, your calorie target, and how you like to eat.',
}

const STEPS = [
  {
    icon: Sparkles,
    title: 'Answer a few questions',
    body: 'Age, weight, goal and how active you are. MizFit works out a safe daily calorie target and a realistic date to hit your goal.',
  },
  {
    icon: CalendarDays,
    title: 'Get a week of meals',
    body: 'Seven days of breakfast, lunch, snack and three supper options a night — built around the food already in your kitchen and what expires soonest.',
  },
  {
    icon: ShoppingBasket,
    title: 'Shop for the gap only',
    body: 'Approve the days you like and MizFit lists exactly what you still need to buy. Nothing you already own.',
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-10 px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo as="h1" className="text-4xl" />
        <p className="max-w-xl text-lg text-text">
          A week of meals planned around the food you already have — and a shopping list for only
          the gap.
        </p>

        {/*
          A native form POST, so the demo door works with no client JavaScript
          and the route can set the session cookie and redirect in one hop.
        */}
        <form action="/api/auth/demo" method="POST" className="mt-2">
          <Button type="submit" size="lg" variant="solid">
            Try it now — no signup
          </Button>
        </form>

        <p className="text-sm text-text">
          Opens a ready-made account with a stocked 54-item pantry, so you can plan a real week
          straight away.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/signup">Create an account</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>

      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-2 pt-5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-text">
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    Step {index + 1}
                  </span>
                  <h2 className="text-base font-semibold text-text">{step.title}</h2>
                  <p className="text-sm text-text">{step.body}</p>
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ol>

      <p className="text-center text-xs text-text">
        MizFit is not medical or dietary advice and cannot guarantee a recipe is free of any
        allergen. Check ingredients yourself if you have an allergy or a medical condition. Calorie
        and macro figures are estimates.
      </p>
    </main>
  )
}
