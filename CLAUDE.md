# CLAUDE.md — MizFit Build Rules

**Read this before every prompt. `SPEC.md` says *what* to build; this file says *how*.**
If the two ever conflict: `SPEC.md` wins on product behaviour, `CLAUDE.md` wins on engineering practice.
Neither may be silently overridden — flag the conflict instead.

Build sequence lives in `BUILD.md`. Core prompts: 1, 2a, 2b, 3, 4, 5, 6, 7. Feature prompts: 8–12.
**Prompt 3b (nutrition enrichment) is OPTIONAL — SKIP IF SHORT ON TIME.** No other prompt depends on it
existing; skipping it is an expected outcome, not a shortfall (`SPEC.md` Appendix A, § 8.11). Optional
is **not** the same as deferred — Rule 16 does not forbid building it.
Tail prompts (Stripe, Legal/GDPR, Polish, Testing/CI) are **DEFERRED — not part of this build.**

---

## The 17 Standing Rules

**Rule 1 — SPEC.md is the single source of truth.**
Every table, column, route path, enum value, and copy string comes from `SPEC.md`. Do not invent
features, fields, or endpoints that are not in it. If something needed is missing, stop and flag it;
do not improvise a design decision into the codebase. `README.md` and `PRD.md` are historical context
only and are known to contradict the pinned build — `SPEC.md` supersedes both.

**Rule 2 — The stack is pinned.**
Use exactly the versions in the stack table below. No framework swaps, no alternative ORMs, no extra
runtime dependencies without an explicit note in the prompt output explaining why. Never use `wouter`
for routing under any circumstances.

**Rule 3 — Schema ownership: shared tables belong to Prompt 3.**
A table read or written by **two or more features** is core spine and is created in Prompt 3 (schema).
A table used by **exactly one feature** is created by that feature's prompt. A later prompt never
redefines, re-creates, or re-drops a table an earlier prompt owns. All migrations are additive and
numbered (`supabase/migrations/NNNN_*.sql`); never edit a migration that has already been applied.
The spine / single-feature classification table in `SPEC.md` is authoritative.

**Rule 4 — RLS on every table, from the first migration.**
No table ships without `ENABLE ROW LEVEL SECURITY` and explicit select/insert/update/delete policies
scoped through workspace membership. A migration that adds a table and no policies is incomplete.
Policies are written in the same migration as the table.

**Rule 5 — Workspace pattern, never raw `user_id` scoping.**
All shared/household data (`pantry_items`, `meal_plans`, `meal_plan_days`, `grocery_gap_items`,
`subscriptions`) is scoped by `workspace_id`. Per-person data (`profiles`) is keyed by `user_id` and
carries `workspace_id` as a foreign key. A workspace is a household of one owner in this build; the
schema must make Phase 3's second member additive, never a migration rewrite. Never write a query that
filters a shared table by `auth.uid()` alone.

**Rule 6 — Route paths are byte-for-byte from SPEC.md.**
Copy them verbatim, including `mealplan` (one word, no hyphen), `grocery-list` (hyphenated), and the
`[itemId]` / `[planId]` / `[dayId]` param names. Do not add aliases, do not add routes that are not
listed, do not "helpfully" add a `GET` where only `POST` is specified. `/api/chat/message` does not
exist in this build.

**Rule 7 — Every API route goes through the shared handler.**
`withApiHandler` (Prompt 4) applies, in order: method check → auth session → rate limit → Zod
body/param validation → workspace ownership assertion → handler → typed error response. No route
hand-rolls any of these steps. No route returns a raw `Error` message or a stack trace to the client;
errors map to a stable `{ error: { code, message } }` shape with the detail logged server-side only.

**Rule 8 — Validate all input at the boundary with Zod.**
Never trust a client-supplied id, array index, number, date, or enum. Every body, query param, and
route param is parsed by a schema before use. Numeric inputs (age, weight, height, calorie override,
`servings_per_meal`, `supper_option_index`) have explicit min/max bounds. Free-text fields
(`pantry_items.name`, `pantry_items.unit`) have length caps and are never rendered as HTML.

**Rule 9 — Verify ownership server-side on every resource access.**
`assertWorkspaceOwnership(resource)` runs before any read or mutation of a plan, day, pantry item, or
grocery list, even though RLS is enabled. RLS is defence-in-depth, not the only check. Never leak the
existence of another workspace's row through a 403-vs-404 distinction — return 404 for both.

**Rule 10 — Rate limit every mutating and AI-calling route.**
Upstash Redis, bucketed per user and per route. The AI routes (`/api/mealplan/generate` and the day
`regenerate` route) get the strictest bucket because they cost real money. `/api/auth/signup` and
`/api/auth/forgot-password` get their own buckets to blunt abuse and account enumeration. If the Redis
env vars are missing: **fail open in development with a loud console warning, fail closed in
production.**

**Rule 11 — Secrets are server-only.**
`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, and `UPSTASH_*` are never imported
into a client component, never prefixed `NEXT_PUBLIC_`, and never returned in an API response. Files
that touch them begin with `import 'server-only'`. The service-role client is used only for the
`handle_new_user` trigger path and explicitly justified admin operations — never as a convenience to
skip RLS.

**Rule 12 — Auth is server-side, always.**
All six auth routes are server route handlers using Supabase SSR cookie sessions. No client-side-only
auth, no session state trusted from the browser, no auth step embedded in the chat flow — signup and
login stay a standard form so password managers and autofill work. Session refresh happens in
middleware. **Password policy: minimum 12 characters with at least one uppercase letter, one lowercase
letter, one number, and one symbol.** Enforced server-side on signup and on reset; the exact number
**12** appears verbatim in the signup and reset UI copy. Stated once in `SPEC.md` § Password Policy —
never restate it with a different number anywhere.
**Email verification never gates the chat.** A user reaches and completes the whole Mizfit Chat
immediately after signup, with no blocking wait on the verification email. Verification is enforced at
exactly one place: `POST /api/mealplan/generate` returns **403** for an unverified user. Do not add a
verification check to any other route, page, or middleware branch.

**Rule 13 — AI calls are isolated, mocked in dev, and their output is untrusted.**
Every Anthropic call goes through `src/lib/ai/client.ts`. The model id comes from the `AI_MODEL` env
var (default `claude-sonnet-5`, stated once in `SPEC.md` § 11) — never hardcoded at a call site. **Dev-mode mocking is mandatory and
non-negotiable:** when `NODE_ENV !== 'production'` or `AI_MOCK=1`, the client returns fixture data from
`src/lib/ai/mock-plan.ts` and must not open a network connection to Anthropic. Model output is parsed
and validated against a Zod schema before anything is written to the database; a malformed response is
a handled error, never a crash and never a partial write.

**Rule 14 — Deterministic math never goes to the AI.**
TDEE/BMR, the calorie floor and max-deficit clamps, the extended-target-date recompute, macro
percentage splits, and the grocery gap diff are pure TypeScript, one module each, and are re-validated
server-side even when the client already computed them for display. A user-supplied calorie override is
re-clamped on the server; the client's value is never persisted as-is.
**All date math is UTC dates only, never timestamps** — no local-timezone conversion in the database,
the server, or the client. `week_start_date` is the next Sunday on or after the current UTC date
(`SPEC.md` § 4.11).

**Rule 15 — The chat is templated copy plus structured controls, not NLP.**
Every "AI message" bubble is app-authored template copy, not a model generation. Every user response is
captured through an inline structured control (number input, tap-chip, button, checklist) inside the
bubble stream. There is no free-text input field, no intent parsing, no scope-guardrail system prompt,
and no persistent cross-app chat FAB in this build. Each step declares its expected answer shape once
(e.g. `{ activity_level: ActivityLevel }`) so a future NLP layer is additive rather than a rewrite.
Each step writes its answer to the database immediately on capture, so a mid-flow refresh resumes
instead of restarting.

**Rule 16 — Deferred means not built.**
Do not build, stub, or half-wire anything on the deferred list. Leave only the seams `SPEC.md` calls
for — the `subscriptions` table, the `PLANS` constant, the workspace pattern, the AI client interface.
No dead UI, no buttons that render but do nothing, no `TODO` scaffolding on a user-visible surface. If
a deferred feature seems needed to make something else work, flag it rather than building it.

**Rule 17 — Accessibility is a hard requirement, not polish.**
This build targets **WCAG 2.1 Level AA and US Section 508**. The requirements are stated once in
`SPEC.md` § 11a and the verified contrast pairings once in § 11 — this file does not restate either.
Prompt 2b implements them in the design system; every later prompt that renders UI inherits them. The
four non-negotiables: never convey information by colour alone, visible focus indicators at ≥ 3:1,
every form input programmatically labelled (a placeholder is **not** a label), and contrast pairings
taken from § 11 rather than invented. Accessibility is **not** part of the deferred Polish tail —
Rule 16 does not apply to it.

---

## Pinned Stack

| Layer | Technology | Version / notes |
|---|---|---|
| Framework | Next.js, App Router | 15.5.x |
| Language | TypeScript | 5.7, `strict: true` |
| Database / Auth / Storage | Supabase (Postgres) | RLS on every table; `@supabase/ssr` cookie sessions |
| Styling | Tailwind CSS | Fresh Sage tokens only (`SPEC.md` § 11) |
| UI components | shadcn/ui | Themed to the Fresh Sage palette (`SPEC.md` § 11); WCAG 2.1 AA (§ 11a) |
| Rate limiting | Upstash Redis | `@upstash/ratelimit` |
| Transactional email | Resend | Password reset + email verification |
| AI | Anthropic API | Model id from the `AI_MODEL` env var — see Rule 13 |
| Validation | Zod | Every API boundary |
| Error monitoring | Sentry | Optional (`SENTRY_DSN`); scrub PII before send |
| Deploy | Vercel | Desktop browser is the demo target |

**Palette:** Fresh Sage. The token values, the two-green contrast rule, and the verified pairings are
stated once in `SPEC.md` § 11 and are not repeated here. The interim "Warm Earth" palette (coral/amber/
cream) is **superseded** — no Warm Earth hex may appear anywhere in the codebase.

**Env vars** — the three tiers (REQUIRED / FEATURE / OPTIONAL) and their exact names are stated once in
`SPEC.md` § 11 and are not repeated here. Rule 11 governs which of them are server-only.

---

## Schema Ownership Rule

> **A table used by two or more features belongs to Prompt 3. A table used by exactly one feature
> belongs to that feature's prompt.**

| Table | Owner | Why |
|---|---|---|
| `workspaces` | Prompt 3 | Spine — every scoped query joins it |
| `workspace_members` | Prompt 3 | Spine — membership drives every RLS policy |
| `profiles` | Prompt 3 | Spine — written by onboarding, read by meal-plan generation |
| `subscriptions` | Prompt 3 | Spine — created by `handle_new_user`; the Stripe seam |
| `pantry_items` | Prompt 3 | Spine — written by pantry, **read by meal-plan generation** |
| `meal_plans` | Prompt 3 | Spine — written by generation, **read by grocery-list** |
| `meal_plan_days` | Prompt 3 | Spine — written by generation, updated by review, read by grocery-list |
| `grocery_gap_items` | Prompt 12 | Single feature — only the grocery-list module touches it |

`handle_new_user` (Prompt 3) creates profile + workspace + workspace_members + trial subscription + all
54 baseline pantry items in **one atomic transaction**. The app never re-implements seeding.

---

## This App's Specifics

**One account type, via the workspace pattern.** Every signup creates exactly one workspace with the
signing-up user as its sole `owner` member. There is no personal-vs-team account switch. Phase 3's
2-person household is a second `workspace_members` row plus an invite flow — additive, never a
migration.

**Tiers are documented, not billing-enforced in this build.** `PLANS` (`src/lib/plans.ts`) and the
`subscriptions` table exist so Stripe wiring later is additive. **No subscription gate is enforced
anywhere in this build** — every authenticated user gets full feature access. Do not write
`if (tier === 'free')` guards. Tier limit numbers live in the single PLANS table in `SPEC.md` and are
never restated in another file.

**AI model id + mandatory dev mocking.** Model id from `AI_MODEL` (Rule 13).
Meal-plan generation (and day regeneration) is the *only* code path that calls Anthropic in this build.
Dev mode returns the mock and never calls the real API — cost control, non-negotiable (Rule 13).

**Chat interaction model.** Templated AI copy + inline structured taps/inputs. **NOT free-text NLP** —
free-text parsing, intent detection, the scope-guardrail system prompt, the cross-app chat FAB, camera
pantry entry, and real-time substitution are all deferred per `SPEC.md` (Rule 15).

---

## Phase 1 Feature Set (what this build ships)

1. **Auth** — signup, login, logout, forgot password, reset password, callback. Standard form, server
   routes, 12-character password policy.
2. **Profile / TDEE onboarding** — demographics, activity level, Mifflin-St Jeor BMR → TDEE → required
   deficit → clamped calorie target, estimated-completion-date recompute, dietary exclusions, diet
   methodology, `servings_per_meal`.
3. **Mizfit Chat** — one continuous templated conversation, the full 11-step sequence in `SPEC.md`
   § 3.1: welcome → demographics + TDEE → calorie confirm/override → servings → dietary-exclusion chips
   → diet methodology chips → pantry confirmation → cuisine chips → "Generate my week" → **review
   (step 10)** → **grocery (step 11)**. Steps 10 and 11 happen *inside the chat stream*, not on
   standalone pages — features 6 and 7 below are those two steps, not separate surfaces.
4. **Pantry** — 54 baseline items auto-seeded at signup; list, add, edit, delete; expiry-aware ordering
   with `NULL` expiry excluded from spoilage priority.
5. **Meal-plan generation** — one AI call per week; Sun–Sat; a single breakfast/lunch/snack per day plus
   **3 substantively unique supper options** per day. When constraints compete, resolve them in the
   numbered precedence order in `SPEC.md` § 8.6a — that list is the sole authority on priority, and this
   file does not restate it.
6. **Day-by-day review** — **chat step 10** (§ 3.1), rendered in the chat stream: expandable day cards,
   select a supper option, approve the day, or regenerate the whole day (all four slots, clearing any
   prior selection).
7. **Grocery gap list** — **chat step 11** (§ 3.1), rendered in the chat stream: what the week's approved
   plan needs that the pantry does not have, including `OPTIONS:` supporting items, shown once every day
   has an approved supper selection.

## DEFERRED — Not Part of This Build

**Tail prompts:** Stripe / billing enforcement · Legal & GDPR pages · Polish (including mobile
responsive breakpoints) · Testing & CI/CD.

**Also deferred (Phase 2–4, listed in `SPEC.md` § 12 Explicitly Out of Scope):** Keto/Vegan methodologies, 2-person
household accounts, photo & receipt pantry scanning, exercise tracking, Apple Health / Google Health
Connect, grocery store API integrations, push notifications, free-text NLP chat parsing, the chat
scope-guardrail system prompt, the cross-app chat FAB, real-time ingredient substitution, the weekly
pre-selection/validation workflow, interactive per-day leftover confirmation, AI-assisted online recipe
validation / star-marking, PDF & Word export, daily consumption logging, barcode scanning, weight and
water tracking, social sharing, 2FA, Google OAuth.

None of these are cut for good — they are sequenced later. Do not build them now.
