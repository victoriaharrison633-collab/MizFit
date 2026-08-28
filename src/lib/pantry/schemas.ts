import { z } from 'zod'
import {
  expiryDateSchema,
  pantryItemNameSchema,
  pantryQuantitySchema,
  pantryUnitSchema,
} from '@/lib/validation/common'

/**
 * Boundary schemas for the pantry routes (SPEC.md § 4.6, § 6).
 *
 * Name and unit are free text with length caps, and quantity is numeric rather
 * than integer — half a pound of green beans is a real row (Rule 8). A null
 * expiry means a permanent staple, which is a distinct state from "not set".
 */
export const createPantryItemSchema = z.object({
  name: pantryItemNameSchema,
  quantity: pantryQuantitySchema,
  unit: pantryUnitSchema,
  expiry_date: expiryDateSchema.default(null),
  is_frozen: z.boolean().default(false),
})

export const updatePantryItemSchema = z
  .object({
    name: pantryItemNameSchema.optional(),
    quantity: pantryQuantitySchema.optional(),
    unit: pantryUnitSchema.optional(),
    expiry_date: expiryDateSchema.optional(),
    is_frozen: z.boolean().optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    error: 'Nothing to update.',
  })

export type CreatePantryItem = z.infer<typeof createPantryItemSchema>
export type UpdatePantryItem = z.infer<typeof updatePantryItemSchema>
