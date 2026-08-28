'use client'

import * as React from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn, focusRing } from '@/lib/utils'
import type { MealPlan, MealPlanDay, PantryItem, Profile } from '@/lib/db/queries'
import type { Recipe } from '@/lib/ai/plan-schema'
import {
  ACTIVITY_CHIPS,
  CUISINE_CHIPS,
  DIETARY_EXCLUSION_CHIPS,
  METHODOLOGY_CHIPS,
  SEX_CHIPS,
  STEP_KEYS,
  type StepKey,
} from '@/lib/chat/steps'

/**
 * The Mizfit Chat (SPEC.md § 3.1).
 *
 * Templated copy plus structured controls — there is no free-text input, no
 * intent parsing and no model call anywhere in this file (CLAUDE.md Rule 15).
 * Every "AI" bubble below is a string we wrote. The one AI call in the build is
 * `POST /api/mealplan/generate`, behind the button in step 9.
 *
 * Each step writes its answer immediately on capture and advances
 * `profiles.onboarding_step`, so a refresh resumes where the user left off.
 *
 * SCOPE NOTE: Appendix A splits this across a chat shell, bubble, stream,
 * typing indicator, five control components and a `use-chat-flow` hook. It is
 * one file here, built against the clock for the demo. The step registry and
 * per-step answer shapes still live in `src/lib/chat/steps.ts`, so splitting it
 * later is mechanical.
 */

interface ChatShellProps {
  profile: Profile | null
  pantryItems: PantryItem[]
  initialPlan: MealPlan | null
  initialDays: MealPlanDay[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Bubble({
  from = 'mizfit',
  children,
}: {
  from?: 'mizfit' | 'user'
  children: React.ReactNode
}) {
  const isUser = from === 'user'
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[42rem] rounded-2xl px-4 py-3 text-base',
          isUser ? 'bg-cta-dark text-white' : 'bg-tint text-text'
        )}
      >
        {!isUser ? (
          <span className="sr-only">Mizfit says: </span>
        ) : (
          <span className="sr-only">You answered: </span>
        )}
        {children}
      </div>
    </div>
  )
}

function ChipButton({
  selected,
  onClick,
  children,
  hint,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  hint?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-text transition-colors',
        // Selection is carried by the check icon and the border weight as well
        // as the fill, never by colour alone (SPEC.md § 11a).
        selected ? 'border-2 border-text bg-tint font-semibold' : 'border-muted bg-white',
        focusRing
      )}
    >
      {selected ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
      <span>
        {children}
        {hint ? <span className="block text-xs text-text/80">{hint}</span> : null}
      </span>
    </button>
  )
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-1.5 rounded-md border-2 border-text p-3 text-sm font-medium text-text"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>
        <span className="font-semibold">Error:</span> {message}
      </span>
    </p>
  )
}

function MacroLine({ recipe }: { recipe: Recipe }) {
  return (
    <p className="text-sm text-text">
      {recipe.macros.calories} kcal · {recipe.macros.protein_g}g protein · {recipe.macros.carbs_g}g
      carbs · {recipe.macros.fat_g}g fat
    </p>
  )
}

function RecipeBlock({ label, recipe }: { label: string; recipe: Recipe }) {
  return (
    <div className="border-t border-tint pt-3">
      <p className="text-sm font-semibold text-text">
        {label}: {recipe.name}
      </p>
      <MacroLine recipe={recipe} />
    </div>
  )
}

export function ChatShell({ profile, pantryItems, initialPlan, initialDays }: ChatShellProps) {
  const [step, setStep] = React.useState<StepKey>(
    (profile?.onboarding_step as StepKey) ?? 'welcome'
  )
  const [current, setCurrent] = React.useState<Profile | null>(profile)
  const [plan, setPlan] = React.useState<MealPlan | null>(initialPlan)
  const [days, setDays] = React.useState<MealPlanDay[]>(initialDays)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [exclusions, setExclusions] = React.useState<string[]>(profile?.dietary_exclusions ?? [])
  const [cuisines, setCuisines] = React.useState<string[]>([])
  const [overriding, setOverriding] = React.useState(false)
  const [groceryItems, setGroceryItems] = React.useState<
    { name: string; quantity: number | null; unit: string | null; source: string }[] | null
  >(null)
  const [checked, setChecked] = React.useState<Set<string>>(new Set())

  const endRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [step, days.length, groceryItems])

  const reached = (key: StepKey) => STEP_KEYS.indexOf(step) >= STEP_KEYS.indexOf(key)

  async function call(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      throw new Error(payload?.error?.message ?? 'Something went wrong. Please try again.')
    }
    return payload
  }

  async function patchProfile(body: Record<string, unknown>, next: StepKey) {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, onboarding_step: next }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error?.message ?? 'That did not save.')
      setCurrent(payload.profile)
      setStep(next)
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not save.')
    } finally {
      setBusy(false)
    }
  }

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  // ---- step 2: demographics -------------------------------------------------
  async function submitDemographics(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const feet = Number(form.get('height_ft') ?? 0)
    const inches = Number(form.get('height_in') ?? 0)

    await patchProfile(
      {
        demographics: {
          age: Number(form.get('age')),
          biological_sex: form.get('biological_sex'),
          height_cm: Math.round((feet * 12 + inches) * 2.54 * 10) / 10,
          current_weight_lbs: Number(form.get('current_weight_lbs')),
          goal_weight_lbs: Number(form.get('goal_weight_lbs')),
          target_date: String(form.get('target_date')),
          activity_level: form.get('activity_level'),
        },
      },
      'calorie_confirm'
    )
  }

  // ---- step 9: generate -----------------------------------------------------
  async function generate() {
    setBusy(true)
    setError(null)
    try {
      const payload = await call('/api/mealplan/generate', { cuisine_preferences: cuisines })
      setPlan(payload.plan)
      setDays(payload.days)
      setStep('review')
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_step: 'review' }),
      })
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'Generation failed.')
    } finally {
      setBusy(false)
    }
  }

  // ---- step 10: review ------------------------------------------------------
  async function selectSupper(day: MealPlanDay, index: number) {
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      const payload = await call(`/api/mealplan/${plan.id}/days/${day.id}/select-supper`, {
        supper_option_index: index,
      })
      setDays((prior) => prior.map((row) => (row.id === day.id ? payload.day : row)))
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not save.')
    } finally {
      setBusy(false)
    }
  }

  async function approveDay(day: MealPlanDay) {
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      const payload = await call(`/api/mealplan/${plan.id}/days/${day.id}/approve`, {})
      setDays((prior) => prior.map((row) => (row.id === day.id ? payload.day : row)))
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not save.')
    } finally {
      setBusy(false)
    }
  }

  // ---- step 11: grocery -----------------------------------------------------
  async function loadGrocery() {
    if (!plan) return
    setBusy(true)
    setError(null)
    try {
      const payload = await call(`/api/grocery-list/${plan.id}`)
      setGroceryItems(payload.items)
      setStep('grocery')
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_step: 'grocery' }),
      })
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'Could not build the list.')
    } finally {
      setBusy(false)
    }
  }

  const allApproved = days.length === 7 && days.every((day) => day.approved_at !== null)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Mizfit Chat</h1>

      {/* 1 — welcome */}
      <Bubble>
        Hi — I&apos;m Mizfit. I&apos;ll ask a few questions, then plan a week of meals around the
        food already in your kitchen. It takes about two minutes.
      </Bubble>
      {step === 'welcome' ? (
        <div className="flex justify-end">
          <Button onClick={() => patchProfile({}, 'demographics')} disabled={busy}>
            Let&apos;s go
          </Button>
        </div>
      ) : null}

      {/* 2 — demographics */}
      {reached('demographics') ? (
        <Bubble>
          First, a bit about you. This is what your calorie target is worked out from.
        </Bubble>
      ) : null}
      {step === 'demographics' ? (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <form onSubmit={submitDemographics} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Age" name="age" type="number" min={13} max={120} required />
                <Input
                  label="Target date"
                  name="target_date"
                  type="date"
                  required
                  description="When you'd like to reach your goal."
                />
                <Input
                  label="Height (feet)"
                  name="height_ft"
                  type="number"
                  min={3}
                  max={8}
                  required
                />
                <Input
                  label="Height (inches)"
                  name="height_in"
                  type="number"
                  min={0}
                  max={11}
                  required
                />
                <Input
                  label="Current weight (lbs)"
                  name="current_weight_lbs"
                  type="number"
                  step="0.1"
                  min={70}
                  max={1000}
                  required
                />
                <Input
                  label="Goal weight (lbs)"
                  name="goal_weight_lbs"
                  type="number"
                  step="0.1"
                  min={70}
                  max={1000}
                  required
                />
              </div>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-text">Biological sex</legend>
                <div className="flex flex-wrap gap-2">
                  {SEX_CHIPS.map((option, index) => (
                    <label key={option.value} className={cn('cursor-pointer', focusRing)}>
                      <input
                        type="radio"
                        name="biological_sex"
                        value={option.value}
                        defaultChecked={index === 0}
                        className="peer sr-only"
                        required
                      />
                      <span className="flex items-center gap-2 rounded-full border border-muted bg-white px-4 py-2 text-sm text-text peer-checked:border-2 peer-checked:border-text peer-checked:bg-tint peer-checked:font-semibold">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-sm font-medium text-text">Activity level</legend>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_CHIPS.map((option, index) => (
                    <label key={option.value} className={cn('cursor-pointer', focusRing)}>
                      <input
                        type="radio"
                        name="activity_level"
                        value={option.value}
                        defaultChecked={index === 0}
                        className="peer sr-only"
                        required
                      />
                      <span className="flex flex-col rounded-2xl border border-muted bg-white px-4 py-2 text-sm text-text peer-checked:border-2 peer-checked:border-text peer-checked:bg-tint peer-checked:font-semibold">
                        {option.label}
                        <span className="text-xs">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Button type="submit" disabled={busy} className="self-end">
                {busy ? 'Working it out…' : 'Work out my target'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/* 3 — calorie confirm */}
      {reached('calorie_confirm') && current?.calorie_target ? (
        <>
          <Bubble from="user">
            {current.age}, {current.current_weight_lbs} lbs → {current.goal_weight_lbs} lbs
          </Bubble>
          <Bubble>
            Based on that, your daily target is <strong>{current.calorie_target} kcal</strong>, a
            deficit of {current.daily_deficit} kcal a day. At that pace you&apos;d reach your goal
            around <strong>{current.estimated_completion_date}</strong>. Does that work, or would
            you like to set your own?
          </Bubble>
        </>
      ) : null}
      {step === 'calorie_confirm' ? (
        <div className="flex flex-wrap justify-end gap-2">
          {overriding ? (
            <form
              className="flex w-full items-end gap-2"
              onSubmit={async (event) => {
                event.preventDefault()
                const value = Number(new FormData(event.currentTarget).get('calorie_target'))
                setOverriding(false)
                await patchProfile({ calorie_target: value }, 'servings')
              }}
            >
              <Input
                label="Your calorie target"
                name="calorie_target"
                type="number"
                min={500}
                max={10000}
                defaultValue={current?.calorie_target ?? 2000}
                required
                description="We'll re-check it against the safety floor."
              />
              <Button type="submit" disabled={busy}>
                Save
              </Button>
            </form>
          ) : (
            <>
              <Button onClick={() => patchProfile({}, 'servings')} disabled={busy}>
                Looks good
              </Button>
              <Button variant="outline" onClick={() => setOverriding(true)} disabled={busy}>
                Let me set my own
              </Button>
            </>
          )}
        </div>
      ) : null}

      {/* 4 — servings */}
      {reached('servings') ? <Bubble>How many people are you cooking for?</Bubble> : null}
      {step === 'servings' ? (
        <form
          className="flex items-end justify-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault()
            const value = Number(new FormData(event.currentTarget).get('servings_per_meal'))
            await patchProfile({ servings_per_meal: value }, 'dietary_exclusions')
          }}
        >
          <Input
            label="Servings per meal"
            name="servings_per_meal"
            type="number"
            min={1}
            max={12}
            defaultValue={current?.servings_per_meal ?? 1}
            required
          />
          <Button type="submit" disabled={busy}>
            Next
          </Button>
        </form>
      ) : null}

      {/* 5 — dietary exclusions */}
      {reached('dietary_exclusions') ? (
        <Bubble>Anything we should avoid entirely? Leave them all unticked if not.</Bubble>
      ) : null}
      {step === 'dietary_exclusions' ? (
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            {DIETARY_EXCLUSION_CHIPS.map((chip) => (
              <ChipButton
                key={chip.value}
                selected={exclusions.includes(chip.value)}
                onClick={() => toggle(exclusions, chip.value, setExclusions)}
              >
                {chip.label}
              </ChipButton>
            ))}
          </div>
          <Button
            onClick={() => patchProfile({ dietary_exclusions: exclusions }, 'methodology')}
            disabled={busy}
          >
            {exclusions.length ? 'Avoid these' : 'Nothing to avoid'}
          </Button>
        </div>
      ) : null}

      {/* 6 — methodology */}
      {reached('methodology') ? (
        <Bubble>
          How should the week be structured? Carb cycling rotates your carbs high, mid and low
          across the week; the others hold the same split every day.
        </Bubble>
      ) : null}
      {step === 'methodology' ? (
        <div className="flex flex-wrap justify-end gap-2">
          {METHODOLOGY_CHIPS.map((chip) => (
            <ChipButton
              key={chip.value}
              selected={current?.diet_methodology === chip.value}
              hint={chip.hint}
              onClick={() => patchProfile({ diet_methodology: chip.value }, 'pantry_confirm')}
            >
              {chip.label}
            </ChipButton>
          ))}
        </div>
      ) : null}

      {/* 7 — pantry confirm */}
      {reached('pantry_confirm') ? (
        <Bubble>
          Here&apos;s what we&apos;ve stocked your pantry with — {pantryItems.length} staples and
          fresh items. The plan is built around using these up.
        </Bubble>
      ) : null}
      {step === 'pantry_confirm' ? (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5">
            <ul className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto text-sm text-text sm:grid-cols-3">
              {pantryItems.map((item) => (
                <li key={item.id}>
                  {item.name}
                  <span className="text-xs">
                    {' '}
                    · {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
            <Button
              className="self-end"
              onClick={() => patchProfile({}, 'cuisine')}
              disabled={busy}
            >
              Looks right
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 8 — cuisine */}
      {reached('cuisine') ? (
        <Bubble>
          Any cuisines you lean towards? This nudges the plan rather than restricting it.
        </Bubble>
      ) : null}
      {step === 'cuisine' ? (
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap justify-end gap-2">
            {CUISINE_CHIPS.map((chip) => (
              <ChipButton
                key={chip.value}
                selected={cuisines.includes(chip.value)}
                onClick={() => toggle(cuisines, chip.value, setCuisines)}
              >
                {chip.label}
              </ChipButton>
            ))}
          </div>
          <Button onClick={() => patchProfile({}, 'generate')} disabled={busy}>
            {cuisines.length ? 'Use these' : 'No preference'}
          </Button>
        </div>
      ) : null}

      {/* 9 — generate */}
      {reached('generate') ? (
        <Bubble>
          That&apos;s everything. Ready when you are — I&apos;ll plan seven days around your pantry,
          with three supper options a night.
        </Bubble>
      ) : null}
      {step === 'generate' ? (
        <div className="flex justify-end">
          <Button size="lg" onClick={generate} disabled={busy} aria-busy={busy}>
            {busy ? 'Planning your week…' : 'Generate my week'}
          </Button>
        </div>
      ) : null}

      {/* 10 — review */}
      {plan && days.length > 0 ? (
        <>
          <Bubble>
            Here&apos;s your week. Pick a supper for each day and approve it — once all seven are
            approved I&apos;ll build your shopping list.
          </Bubble>

          <p className="rounded-md border border-muted p-3 text-sm text-text">
            <strong>Before you cook:</strong> Mizfit is not medical or dietary advice, and it cannot
            guarantee a recipe is free of any allergen. Check every ingredient yourself if you have
            an allergy or a medical condition. Calorie and macro figures are estimates.
          </p>

          {days.map((day) => {
            const suppers = (day.supper_options as unknown as Recipe[]) ?? []
            return (
              <Card key={day.id}>
                <CardContent className="flex flex-col gap-3 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-text">
                      {DAY_NAMES[day.day_index]}
                      <span className="ml-2 text-sm font-normal">
                        {day.day_macro_type === 'fixed'
                          ? 'fixed macros'
                          : `${day.day_macro_type}-carb day`}
                      </span>
                    </h2>
                    {day.approved_at ? (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-text">
                        <Check aria-hidden="true" className="size-4" /> Approved
                      </span>
                    ) : null}
                  </div>

                  <RecipeBlock label="Breakfast" recipe={day.breakfast as unknown as Recipe} />
                  <RecipeBlock label="Lunch" recipe={day.lunch as unknown as Recipe} />
                  <RecipeBlock label="Snack" recipe={day.snack as unknown as Recipe} />

                  <div className="border-t border-tint pt-3">
                    <p className="mb-2 text-sm font-semibold text-text">Supper — choose one</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {suppers.map((supper, index) => {
                        const selected = day.selected_supper_index === index
                        return (
                          <button
                            key={supper.name}
                            type="button"
                            aria-pressed={selected}
                            disabled={busy}
                            onClick={() => selectSupper(day, index)}
                            className={cn(
                              'flex flex-col gap-1 rounded-2xl border p-3 text-left text-sm text-text',
                              selected
                                ? 'border-2 border-text bg-tint font-semibold'
                                : 'border-muted bg-white',
                              focusRing
                            )}
                          >
                            <span className="flex items-start gap-1.5">
                              {selected ? (
                                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                              ) : null}
                              {supper.name}
                            </span>
                            <span className="text-xs">
                              {supper.macros.calories} kcal · {supper.macros.protein_g}g protein
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {!day.approved_at ? (
                    <Button
                      className="self-end"
                      disabled={busy || day.selected_supper_index === null}
                      onClick={() => approveDay(day)}
                    >
                      Approve {DAY_NAMES[day.day_index]}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}

          {allApproved && !groceryItems ? (
            <div className="flex justify-end">
              <Button size="lg" onClick={loadGrocery} disabled={busy}>
                Build my shopping list
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      {/* 11 — grocery */}
      {groceryItems ? (
        <>
          <Bubble>
            Here&apos;s what you need that the pantry doesn&apos;t already have. Everything else is
            already in your kitchen.
          </Bubble>
          <Card>
            <CardContent className="flex flex-col gap-2 pt-5">
              {groceryItems.length === 0 ? (
                <p className="text-sm text-text">
                  Nothing to buy — the whole week is covered by your pantry.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {groceryItems.map((item) => {
                    const id = `${item.name}-${item.unit ?? ''}`
                    const isChecked = checked.has(id)
                    return (
                      <li key={id}>
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setChecked((prior) => {
                                const next = new Set(prior)
                                if (next.has(id)) next.delete(id)
                                else next.add(id)
                                return next
                              })
                            }
                            className={cn('size-4 accent-cta-dark', focusRing)}
                          />
                          <span className={cn(isChecked && 'line-through')}>
                            {item.name}
                            {item.quantity !== null ? (
                              <span className="text-xs">
                                {' '}
                                · {Math.round(item.quantity * 100) / 100} {item.unit}
                              </span>
                            ) : (
                              <span className="text-xs"> · optional extra</span>
                            )}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {error ? <ErrorNote message={error} /> : null}

      <div ref={endRef} aria-hidden="true" />
    </div>
  )
}
