'use client'

import * as React from 'react'
import { AlertCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ExpiryBadge } from '@/components/pantry/expiry-badge'
import type { PantryItem } from '@/lib/db/queries'
import { cn } from '@/lib/utils'

/**
 * The pantry surface (SPEC.md § 4.6, § 6): list, add, edit, delete.
 *
 * Ordering is the spoilage priority the spec describes — dated items soonest
 * first, then the NULL-expiry staples as a separate set rather than sorted onto
 * either end of the dated ones. The server does that ordering; this component
 * keeps the two groups apart rather than re-merging them.
 *
 * SCOPE NOTE: Appendix A splits this into `pantry-list`, `pantry-item-row` and
 * `add-item-form`. It is one component here, built against the clock.
 */

interface PantryManagerProps {
  initialPerishable: PantryItem[]
  initialStaples: PantryItem[]
}

interface EditState {
  name: string
  quantity: string
  unit: string
  expiry_date: string
}

function toEditState(item: PantryItem): EditState {
  return {
    name: item.name,
    quantity: String(item.quantity),
    unit: item.unit,
    expiry_date: item.expiry_date ?? '',
  }
}

export function PantryManager({ initialPerishable, initialStaples }: PantryManagerProps) {
  const [perishable, setPerishable] = React.useState(initialPerishable)
  const [staples, setStaples] = React.useState(initialStaples)
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<EditState | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [adding, setAdding] = React.useState(false)

  const total = perishable.length + staples.length

  /** Re-read the server's ordering rather than guessing where a row now belongs. */
  async function refresh() {
    const response = await fetch('/api/pantry')
    if (!response.ok) return
    const payload = await response.json()
    setPerishable(payload.perishable)
    setStaples(payload.staples)
  }

  async function send(path: string, method: string, body?: unknown) {
    const response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error?.message ?? 'That did not save.')
    }
    return response.status === 204 ? null : response.json()
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const expiry = String(data.get('expiry_date') ?? '')

    setAdding(true)
    setError(null)
    try {
      await send('/api/pantry', 'POST', {
        name: String(data.get('name') ?? ''),
        quantity: Number(data.get('quantity')),
        unit: String(data.get('unit') ?? ''),
        expiry_date: expiry === '' ? null : expiry,
        is_frozen: data.get('is_frozen') === 'on',
      })
      form.reset()
      await refresh()
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not save.')
    } finally {
      setAdding(false)
    }
  }

  async function saveEdit(item: PantryItem) {
    if (!draft) return
    setBusyId(item.id)
    setError(null)
    try {
      await send(`/api/pantry/${item.id}`, 'PATCH', {
        name: draft.name,
        quantity: Number(draft.quantity),
        unit: draft.unit,
        expiry_date: draft.expiry_date === '' ? null : draft.expiry_date,
      })
      setEditingId(null)
      setDraft(null)
      await refresh()
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not save.')
    } finally {
      setBusyId(null)
    }
  }

  async function removeItem(item: PantryItem) {
    setBusyId(item.id)
    setError(null)
    try {
      await send(`/api/pantry/${item.id}`, 'DELETE')
      setPerishable((rows) => rows.filter((row) => row.id !== item.id))
      setStaples((rows) => rows.filter((row) => row.id !== item.id))
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : 'That did not delete.')
    } finally {
      setBusyId(null)
    }
  }

  function renderRow(item: PantryItem) {
    const isEditing = editingId === item.id

    return (
      <li key={item.id} className="border-t border-tint py-3 first:border-t-0">
        {isEditing && draft ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              void saveEdit(item)
            }}
          >
            <Input
              label="Name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              maxLength={120}
              required
              className="w-48"
            />
            <Input
              label="Quantity"
              type="number"
              step="0.01"
              min={0.01}
              value={draft.quantity}
              onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
              required
              className="w-24"
            />
            <Input
              label="Unit"
              value={draft.unit}
              onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
              maxLength={32}
              required
              className="w-28"
            />
            <Input
              label="Expiry"
              type="date"
              value={draft.expiry_date}
              onChange={(event) => setDraft({ ...draft, expiry_date: event.target.value })}
              description="Leave empty for a staple"
              className="w-44"
            />
            <Button type="submit" size="sm" disabled={busyId === item.id}>
              {busyId === item.id ? 'Saving…' : 'Save'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingId(null)
                setDraft(null)
              }}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="min-w-40 flex-1 text-sm font-medium text-text">{item.name}</span>
            <span className="text-sm text-text">
              {item.quantity} {item.unit}
            </span>
            <ExpiryBadge expiryDate={item.expiry_date} isFrozen={item.is_frozen} />
            <span className="ml-auto flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(item.id)
                  setDraft(toEditState(item))
                }}
              >
                <Pencil aria-hidden="true" />
                Edit
                <span className="sr-only"> {item.name}</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={busyId === item.id}
                onClick={() => void removeItem(item)}
              >
                <Trash2 aria-hidden="true" />
                Remove
                <span className="sr-only"> {item.name}</span>
              </Button>
            </span>
          </div>
        )}
      </li>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Your pantry</h1>
        <p className="text-sm text-text">
          {total} items. Meal plans are built around using the dated ones up first.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-1.5 rounded-md border-2 border-text p-3 text-sm font-medium text-text"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="font-semibold">Error:</span> {error}
          </span>
        </p>
      ) : null}

      <Card>
        <CardContent className="pt-5">
          <h2 className="mb-2 text-lg font-semibold text-text">Add an item</h2>
          <form onSubmit={addItem} className="flex flex-wrap items-end gap-2">
            <Input label="Name" name="name" maxLength={120} required className="w-48" />
            <Input
              label="Quantity"
              name="quantity"
              type="number"
              step="0.01"
              min={0.01}
              defaultValue={1}
              required
              className="w-24"
            />
            <Input
              label="Unit"
              name="unit"
              maxLength={32}
              defaultValue="each"
              required
              className="w-28"
            />
            <Input
              label="Expiry"
              name="expiry_date"
              type="date"
              description="Leave empty for a staple"
              className="w-44"
            />
            <label className="flex items-center gap-2 pb-2 text-sm text-text">
              <input type="checkbox" name="is_frozen" className="size-4 accent-cta-dark" />
              Frozen
            </label>
            <Button type="submit" disabled={adding}>
              <Plus aria-hidden="true" />
              {adding ? 'Adding…' : 'Add'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section aria-labelledby="perishable-heading">
        <h2 id="perishable-heading" className="mb-2 text-lg font-semibold text-text">
          Use these first
          <span className="ml-2 text-sm font-normal">({perishable.length} with a date)</span>
        </h2>
        <Card>
          <CardContent className="pt-5">
            {perishable.length === 0 ? (
              <p className="text-sm text-text">Nothing dated right now.</p>
            ) : (
              <ul className={cn('flex flex-col')}>{perishable.map(renderRow)}</ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="staples-heading">
        <h2 id="staples-heading" className="mb-2 text-lg font-semibold text-text">
          Staples
          <span className="ml-2 text-sm font-normal">({staples.length}, no expiry)</span>
        </h2>
        <Card>
          <CardContent className="pt-5">
            <ul className="flex flex-col">{staples.map(renderRow)}</ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
