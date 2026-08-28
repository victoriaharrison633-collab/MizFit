// Runs the Zod schemas in src/env.ts against the current process environment.
// Node strips the TypeScript types at load, so the schemas have exactly one
// definition (src/env.ts) rather than a copy that can drift.
//
// `npm run env:validate` loads .env and .env.local first, if they exist.
try {
  const { validateEnv } = await import('../src/env.ts')
  validateEnv()
  console.log('env:validate: OK — every required variable is present and well-formed.')
} catch (error) {
  console.error(`env:validate: FAILED\n${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
