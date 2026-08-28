import 'server-only'

import Anthropic from '@anthropic-ai/sdk'
import { serverEnv } from '@/env'
import { generatedPlanSchema, type GeneratedPlan } from '@/lib/ai/plan-schema'
import { buildMockPlan } from '@/lib/ai/mock-plan'
import { buildPlanPrompt, type PlanPromptInput } from '@/lib/ai/plan-prompt'

/**
 * The only path in this build that talks to Anthropic (CLAUDE.md Rule 13).
 *
 * Mocking is mandatory and non-negotiable: outside production, or whenever
 * `AI_MOCK=1`, this returns the fixture and opens no network connection. The
 * model id comes from `AI_MODEL` and is never hardcoded at a call site.
 *
 * Model output is untrusted — it is parsed and Zod-validated here, before the
 * caller is allowed to write any of it.
 */
export function isAiMocked(): boolean {
  return serverEnv.NODE_ENV !== 'production' || serverEnv.AI_MOCK === '1'
}

export interface PlanGeneration {
  plan: GeneratedPlan
  source: 'ai' | 'mock'
  modelId: string | null
}

export async function generateWeekPlan(input: PlanPromptInput): Promise<PlanGeneration> {
  if (isAiMocked()) {
    return {
      plan: buildMockPlan({
        servings: input.profile.servings_per_meal,
        weekMacros: input.weekMacros,
      }),
      source: 'mock',
      modelId: null,
    }
  }

  if (!serverEnv.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set and mocking is off')
  }

  const { system, user } = buildPlanPrompt(input)
  const model = serverEnv.AI_MODEL

  const response = await new Anthropic({ apiKey: serverEnv.ANTHROPIC_API_KEY }).messages.create({
    model,
    max_tokens: 16000,
    system,
    messages: [
      {
        role: 'user',
        content: `${user}\n\nReturn JSON of the shape { "days": [ { "day_index": 0, "breakfast": Recipe, "lunch": Recipe, "snack": Recipe, "supper_options": [Recipe, Recipe, Recipe] } ] } where Recipe is { "name", "cuisine", "ingredients": [{"name","quantity","unit","from_pantry"}], "options": [], "instructions": [], "macros": {"calories","protein_g","carbs_g","fat_g"}, "servings" }.`,
      },
    ],
  })

  const text = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim()

  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new Error(`Model returned unparseable JSON: ${(error as Error).message}`)
  }

  const result = generatedPlanSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error(
      `Model response failed validation: ${result.error.issues[0]?.message ?? 'unknown'}`
    )
  }

  return { plan: result.data, source: 'ai', modelId: model }
}
