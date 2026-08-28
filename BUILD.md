# MizFit — Build Document

Generated with the Gauntlet plugin's build sequence. Core (1, 2a, 2b, 3, 4, 5, 6, 7) → Features (8...N, cap 8) → Tail is DEFERRED for this hackathon build (see MIZFIT_SPEC_DRAFT.md — Stripe/Legal/CI/Testing are Phase 2-4, not built here).

---

## Prompt 1 — Spec Validation & Project Setup

```
Read the App Specification above (MIZFIT_SPEC_DRAFT.md) in full. Do not write
application code in this prompt.

1. Confirm the spec is complete enough to build a production-quality prototype
safely, even though billing is not enforced in this build. Flag anything
missing across security, scalability, and forward-compatibility with the
Phase 2-4 roadmap (photo pantry scanning, household accounts, Stripe billing,
exercise tracking) as a markdown table with columns: Gap, Why it matters,
Suggested resolution.

2. Produce a FILE LIST for the whole build, grouped by the prompt that creates
each file. It must include: the security utilities (rate limiting, ownership,
API handler), all six auth routes, the profile/onboarding module (TDEE
calorie calculation, diet methodology), the Mizfit Chat UI shell and its
structured steps (demographics, calorie confirm/override, pantry
confirmation, cuisine preference chips), the pantry module, the meal-plan
generation module (including the AI client, its dev-mode mock, cuisine
preferences as an input, and the 3-supper-options-per-day generation model),
the grocery-list module, and the workspace/household schema groundwork.
State the exact route paths for auth and for every feature area above,
including the supper-selection endpoint — they must match what later prompts
create, byte for byte.

3. Write CLAUDE.md as a committed file. It contains the 16 standing rules, the
pinned stack table, the schema-ownership rule (a table used by two or more
features belongs to Prompt 3; a table used by one belongs to that feature's
prompt), and this app's specifics: one account type via the workspace
pattern, tiers documented but not billing-enforced in this build, AI model id
from the `AI_MODEL` env var with dev-mode mocking mandatory, the chat
interaction model (templated AI copy + inline structured taps/inputs, NOT
free-text NLP — that stays deferred per the spec), and the Phase 1 feature
set (profile/TDEE onboarding, Mizfit Chat steps, pantry, meal-plan
generation, day-by-day approve/regenerate, grocery gap list) with the tail
(Stripe, Legal/GDPR, Polish, Testing/CI) explicitly marked DEFERRED — not
part of this build.

4. Write SPEC.md as a committed file: the App Specification above, expanded
with the data model (workspaces, workspace_members, profiles with its TDEE
fields, pantry_items, meal_plans with its cuisine_preferences array,
meal_plan_days, grocery_gap_items), the full route list, and the tier limits
as a single PLANS table that later prompts reference rather than restate.

5. In SPEC.md, state the password policy once — minimum 12 characters with
upper, lower, number, and symbol — and note that the signup/reset UI copy and
CLAUDE.md must use that exact number.

6. Note which tables are core spine (touched by 2+ features: pantry_items is
read by meal-plan generation; meal_plans is read by grocery-list) versus
single-feature, so Prompt 3 owns the spine correctly rather than duplicating it.

End with: "Spec validated. N gaps flagged. CLAUDE.md and SPEC.md written."
```

### Checkpoint 1
- [ ] `CLAUDE.md` and `SPEC.md` exist and are committed
- [ ] The file list names all six auth routes and every feature area's routes (profile, chat steps, pantry, meal plan, grocery), matching SPEC.md exactly
- [ ] CLAUDE.md explicitly states the tail (Stripe/Legal/CI/Testing) is deferred for this build
- [ ] CLAUDE.md states the AI dev-mode mock requirement explicitly
- [ ] CLAUDE.md states the chat interaction model is structured taps/inputs, not free-text NLP
- [ ] SPEC.md's PLANS table appears exactly once and tier limits aren't restated elsewhere
- [ ] pantry_items and meal_plans are flagged as core-spine tables (touched by 2+ features)
- [ ] Gap table has at least one row (zero gaps means it wasn't read carefully)
- [ ] Every route path in SPEC.md Appendix A's file list matches SPEC.md § 6’s route table byte-for-byte — diffing the two sets returns zero differences, and a path that appears in only one is a spec violation to fix, not a route to invent

---

# Prompts 2a — 12

Generated from `SPEC.md` (single source of truth for *what*) and `CLAUDE.md` (single
source of truth for *how*). Prompt 1 above is already complete and committed —
it is not regenerated here.

## Deviations from the Gauntlet standard sequence — read before executing

The standard sequence assigns 2b=security utilities, 4=types/validation,
5=design system, 6=auth, 7=layout/dashboard. **This build does not use that
numbering.** `SPEC.md` Appendix A assigns 2b=design system, 4=security utilities,
5=auth, 6=app shell, 7=chat shell, and `CLAUDE.md` Rule 1 makes `SPEC.md`
authoritative. The invariants the standard sequence actually protects are all
preserved: schema (3) precedes every feature prompt, the API foundation (4)
precedes every route, and features follow the core.

**The tail is deferred, deliberately.** Stripe, Legal/GDPR, Polish, and
Testing & CI/CD are marked DEFERRED in `CLAUDE.md` and `SPEC.md` § 12. The
standard sequence treats them as fixed and calls CI a required deliverable; this
build overrides that by explicit product decision. **This is a known, accepted
conflict, not an omission.** The document therefore ends at Prompt 12.

**Four standard-spec requirements are NOT built here, because `SPEC.md` does not
contain them and Rule 1 forbids inventing them.** Each is a real gap worth
closing later, not a silent drop:

| Standard spec asks for | Status | Why |
|---|---|---|
| Cloudflare Turnstile on signup | **Not built** | No bot-protection provider in `SPEC.md` § 11 or the env vars |
| `login_attempts` table + 30-min lockout | **Not built** | Not in the `SPEC.md` § 4 data model; rate limiting (Rule 10) is the only abuse control specified |
| `webhook_events`, `audit_log`, `projects` tables | **Not built** | Not in `SPEC.md` § 4; `webhook_events` belongs to the deferred Stripe tail |
| Single `001_initial.sql` migration | **Not used** | `SPEC.md` Appendix A pins migrations `0001`–`0007` individually; Rule 3 forbids re-cutting them |

**Prompt 3b is OPTIONAL — SKIP IF SHORT ON TIME.** Nothing depends on it. Its
checkpoint treats "skipped — deferred" as a pass.

---

## Prompt 2a — Project scaffold & configuration

```
Scaffold the Next.js project and its configuration. No feature code, no UI beyond
a placeholder page, no database work. Read SPEC.md § 11 for the pinned stack and
env vars; read CLAUDE.md Rules 2 and 11 before starting.

1. `package.json` — Next.js 15.5.24 (App Router), TypeScript 5.7, React 19,
   @supabase/ssr, @supabase/supabase-js, zod, tailwindcss, @upstash/ratelimit,
   @upstash/redis, resend, @anthropic-ai/sdk. Pin exact versions, no carets.
   Scripts: dev, build, start, lint, typecheck (`tsc --noEmit`), env:validate,
   check:secrets, and check:all running lint + typecheck + check:secrets + build
   in sequence.

2. `tsconfig.json` — `strict: true`, `noUncheckedIndexedAccess: true`,
   `paths` mapping `@/*` to `src/*`.

3. `.env.example` — every variable from SPEC.md § 11, bucketed exactly as that
   section buckets them: REQUIRED, FEATURE, NON-SECRET REQUIRED HEADER, OPTIONAL.
   Placeholder values only, never a real key. Do not invent variables that
   section does not list.

4. `src/env.ts` — Zod validation of process.env at startup, split into a server
   schema and a client schema. Only `NEXT_PUBLIC_`-prefixed vars may appear in
   the client schema. Fail loudly at boot on a missing REQUIRED var. The
   Anthropic model id is read from `AI_MODEL` here and never hardcoded anywhere
   (CLAUDE.md Rule 13).

5. `src/lib/supabase/client.ts` (browser), `server.ts` (SSR cookie session via
   @supabase/ssr), `admin.ts` (service-role; first line `import 'server-only'`),
   `middleware.ts` (session refresh helper). Rule 11: the service-role client is
   used only for the `handle_new_user` trigger path.

6. `src/lib/plans.ts` — the `PLANS` constant, a frozen object keyed by
   `plan_tier`, with the numbers copied from SPEC.md § 9. No file other than
   this one restates a tier limit. No code reads `tier` to gate a feature.

7. `src/types/database.ts` — placeholder generated-types module; Prompt 3 fills it.

8. `next.config.ts` — security headers: CSP, HSTS, X-Frame-Options DENY,
   X-Content-Type-Options nosniff, Referrer-Policy. `poweredByHeader: false`.
   Allow `'unsafe-eval'` in script-src ONLY when NODE_ENV !== 'production'.

9. `scripts/check-secrets.sh` — scan tracked files for key-shaped strings; exit
   non-zero on a hit. It must distinguish "clean" from "did not run".

10. `.eslintrc.json`, `.prettierrc`, `.gitignore` (must ignore `.env*` except
    `.env.example`), and `src/app/layout.tsx`, `src/app/page.tsx`,
    `src/app/globals.css` as a minimal placeholder shell.
```

### Checkpoint 2a

- [ ] `npm run check:all` exits 0
- [ ] `npm run typecheck` exits 0 with `strict` and `noUncheckedIndexedAccess` both on
- [ ] Deleting `NEXT_PUBLIC_SUPABASE_URL` from `.env` makes `npm run env:validate` exit non-zero with a named-variable error
- [ ] `grep -r "claude-sonnet-5" src/` returns only `src/env.ts`
- [ ] `grep -rn "NEXT_PUBLIC_" src/env.ts` shows no service-role, Anthropic, Resend, or Upstash variable
- [ ] `src/lib/supabase/admin.ts` line 1 is `import 'server-only'`
- [ ] `PLANS` in `src/lib/plans.ts` matches SPEC.md § 9 exactly, and no other file contains those numbers
- [ ] `curl -I localhost:3000` shows CSP, HSTS, X-Frame-Options, and X-Content-Type-Options

> **Spot check — environment & secrets.** Before Prompt 2b:
> - [ ] No sensitive value sits behind a `NEXT_PUBLIC_` prefix
> - [ ] `.env.example` is bucketed and contains placeholders only
> - [ ] Secret scanner canary-verified: plant a key-shaped string, watch
>       `npm run check:secrets` go red, remove it. A scanner nobody has seen fail
>       is decoration.

## Prompt 2b — Design system (Fresh Sage) & UI primitives

```
Build the design system and the shared UI primitives. No feature code, no data
fetching, no API routes. Read SPEC.md § 11 for the palette and § 11a for the
accessibility requirements; read CLAUDE.md Rule 17 before starting. Both are hard
requirements, not polish — accessibility is explicitly NOT part of the deferred
Polish tail.

1. `tailwind.config.ts` — define the Fresh Sage tokens, taking the hex values
   from SPEC.md § 11 and nowhere else: background #F8FAF5, cta #5B8C3E,
   cta-dark #4D7735, tint #EDF5E4, text #2C3E2D, muted #6B8A6D. Name them
   semantically (`bg`, `cta`, `cta-dark`, `tint`, `text`, `muted`). No Warm Earth
   hex (#D85A30, #EF9F27, #fdf8f4, #2C2C2A) may appear anywhere in the codebase.

2. Encode the contrast rule in the components, not just the docs. `#5B8C3E` is
   3.99:1 on white — it clears the 3:1 bar for large/bold text, icons, and
   borders but FAILS the 4.5:1 minimum for normal-size text. Any solid button
   whose label is normal-size text uses `#4D7735` (5.24:1) as its fill. The same
   restriction applies to `muted` #6B8A6D (3.83:1). Do not recompute these
   ratios; SPEC.md § 11 states them as verified fact.

3. `components.json` — shadcn/ui configured against these tokens.

4. `src/lib/utils.ts` — the `cn` class-merge helper.

5. `src/components/ui/*` — button, input, card, chip, checkbox, dialog, label,
   badge, skeleton, toast. Themed to the tokens above. Requirements that apply to
   every one of them:
   - Visible focus indicator at >= 3:1 contrast against adjacent colours. Never
     `outline: none` without an equally visible replacement.
   - Every input is keyboard-reachable and shows where focus is.
   - `input` and `checkbox` require a programmatically associated label — a real
     `<label for>` or `aria-label`/`aria-labelledby`. A placeholder is NOT a
     label; it disappears on input and is not reliably announced.
   - Never convey state by colour alone. `badge`, `chip`, and `toast` pair every
     colour-carried state with an icon or a text label.

6. `src/components/brand/logo.tsx` — wordmark using the token colours.

Do not build feature components, list views, or empty states here; those belong
to the prompts that own their features.
```

### Checkpoint 2b

- [ ] `npm run build` exits 0
- [ ] `grep -rniE "D85A30|EF9F27|fdf8f4|2C2C2A" src/ tailwind.config.ts` returns nothing
- [ ] Every hex in `tailwind.config.ts` matches SPEC.md § 11 exactly
- [ ] A solid `Button` with a normal-size text label renders with `#4D7735`, not `#5B8C3E`
- [ ] Tabbing through a rendered form shows a visible focus ring on every control, and no rule sets `outline: none` without a replacement
- [ ] An `Input` rendered with only a placeholder and no label fails review — every input in `src/components/ui` has an associated label or `aria-label`
- [ ] `Badge` and `Chip` in a non-default state render an icon or text label, not colour alone

## Prompt 3 — Database schema, RLS, triggers, baseline seed (core spine)

```
Create the entire shared schema. This prompt OWNS every spine table; no later
prompt re-creates, redefines, or re-drops one (CLAUDE.md Rule 3). Read SPEC.md
§ 4 for the data model, § 5 for the baseline pantry, and § 4.11 for date rules.

Write one numbered migration per file, exactly as SPEC.md Appendix A names them.
Do not consolidate them into a single initial migration.

1. `0001_enums.sql` — all eight enums from SPEC.md § 4.1: workspace_role,
   profile_sex, activity_level, diet_methodology, plan_tier, subscription_status,
   meal_plan_status, day_macro_type. Values byte-for-byte from that table.

2. `0002_workspaces.sql` — `workspaces`, `workspace_members` (§ 4.2, § 4.3),
   `unique (workspace_id, user_id)`, index on `(user_id)`. Add a
   `SECURITY DEFINER STABLE` helper `is_workspace_member(p_workspace_id uuid)`
   resolving membership through `workspace_members`; every later RLS policy uses
   it rather than re-writing the join.

3. `0003_profiles.sql` — `profiles` per § 4.4, keyed by `user_id`, carrying
   `workspace_id` as an FK. Include `dietary_exclusions text[] not null
   default '{}'` and all TDEE fields.

4. `0004_subscriptions.sql` — `subscriptions` per § 4.5. The Stripe columns exist
   as seams and are unused. No code reads `tier` to gate anything (Rule 16).

5. `0005_pantry_items.sql` — `pantry_items` per § 4.6. `quantity` is
   numeric(10,2), `unit` is free text capped at 32 chars, `expiry_date` is
   nullable. Indexes on `(workspace_id)` and `(workspace_id, expiry_date)`.

6. `0006_meal_plans.sql` — `meal_plans` and `meal_plan_days` per § 4.7, § 4.8,
   including `cuisine_preferences text[] not null default '{}'`, the partial
   unique index on `(workspace_id, week_start_date) where status <> 'failed'`,
   and `unique (meal_plan_id, day_index)`.

7. `0007_handle_new_user.sql` — a trigger creating, in ONE atomic transaction:
   profile + workspace + workspace_members(owner) + trial subscription + all 54
   baseline pantry items. The app never re-implements seeding.

8. `supabase/seed/baseline_pantry.sql` — the 54 rows from SPEC.md § 5 with exact
   quantity, unit, and expiry offset. Quantity is always a pure number; any
   size descriptor lives in `unit`. Expiry is `CURRENT_DATE + N days` evaluated
   as a UTC date; NULL means permanent staple.

9. `src/lib/db/queries.ts` — shared typed accessors for the spine tables.

RLS is mandatory on every table, in the same migration that creates it, with
explicit select/insert/update/delete policies scoped through
`is_workspace_member` (Rules 4 and 5). Every `user_id` REFERENCES auth.users ON
DELETE CASCADE. No table ships without policies.
```

### Checkpoint 3

- [ ] All seven migrations apply cleanly to an empty database, in order
- [ ] `select count(*) from pg_tables where schemaname='public' and rowsecurity=false` returns 0
- [ ] Signing up one user creates exactly 1 workspace, 1 workspace_members(owner), 1 profile, 1 trialing subscription, and **54** pantry_items in one transaction
- [ ] As user A, `select * from pantry_items where workspace_id = <B's workspace>` returns 0 rows, not an error
- [ ] `is_workspace_member` exists and is `SECURITY DEFINER STABLE`; every RLS policy calls it rather than re-joining
- [ ] Inserting a pantry item with `quantity = '2 (1 lb each)'` fails; `quantity = 2, unit = 'steaks (1 lb each)'` succeeds
- [ ] Two `meal_plans` rows with the same `(workspace_id, week_start_date)` and status `ready` — the second insert is rejected by the partial unique index
- [ ] Deleting the auth.users row cascades away that user's workspace, profile, and pantry items

> **Spot check — connection pooling.** Before Prompt 4:
> - [ ] The app connects in transaction pool mode; direct connections are used
>       for migrations only. Serverless functions exhaust a direct pool under
>       trivial load.
> - [ ] If the stack talks HTTP to Postgres via Supabase's client rather than raw
>       Postgres, record that this check was **skipped and why** — do not leave it
>       silently unaddressed.

## Prompt 3b — Nutrition enrichment — OPTIONAL — SKIP IF SHORT ON TIME

> **Nothing depends on this prompt.** No route needs it, no later checkpoint
> fails because it was skipped, and Prompt 10 behaves identically whether or not
> it ran. Skipping it is an expected outcome, not a shortfall. If you are behind
> schedule, skip it and move to Prompt 4.

```
Add optional nutrition enrichment for the 54 baseline pantry items. This is a
soft enhancement with no hard dependency in either direction. Read SPEC.md § 8.11
before starting, and do not let this prompt's output become a precondition for
anything else.

1. `supabase/migrations/0009_pantry_nutrition.sql` — ALTER `pantry_items` to add
   `calories_per_unit`, `protein_g_per_unit`, `carbs_g_per_unit`,
   `fat_g_per_unit`, all numeric, nullable, default NULL. Additive only. No RLS
   change: the new columns inherit `pantry_items`' existing policies.
   Use the number 0009 deliberately, AFTER Prompt 12's
   `0008_grocery_gap_items.sql`, so skipping this prompt leaves no gap in the
   migration sequence and Prompt 12's filename never shifts.

2. `src/lib/nutrition/usda.ts` — thin USDA FoodData Central client reading
   `USDA_FDC_API_KEY`. Zod-validate every external response before use; a
   malformed response is a handled error, never a partial write. Rule 13's
   untrusted-output discipline applies to third-party APIs, not just to model
   output.

3. `src/lib/nutrition/openfoodfacts.ts` — thin Open Food Facts client. Send
   `OPEN_FOOD_FACTS_USER_AGENT` on every request; their usage guidelines require
   an identifying User-Agent. It is not a credential. Zod-validate responses.

4. `scripts/enrich-baseline-pantry.ts` — a one-time developer script, run
   manually via `npm run enrich:pantry`. Look up each of the 54 baseline items
   (SPEC.md § 5) against FDC first, then Open Food Facts as fallback, and write
   the four nutrition columns. An item that cannot be matched is left NULL and
   logged; a miss is not a failure. This is NOT a web route, NOT rate-limited,
   and NOT part of any user-facing flow. The app never invokes it at runtime.

5. Additive edits to files owned by earlier prompts: add `USDA_FDC_API_KEY` and
   `OPEN_FOOD_FACTS_USER_AGENT` to `.env.example` (values per SPEC.md § 11), and
   add the `enrich:pantry` script to `package.json`. Do not restructure either
   file.

Do not modify `src/lib/ai/plan-prompt.ts` here — Prompt 10 owns the read side and
already handles NULL as the normal case.
```

### Checkpoint 3b

**Exactly one of the first two items is required. Both are passes.**

- [ ] The script ran: `npm run enrich:pantry` completes and at least one of the 54 baseline rows has non-NULL nutrition values; **or**
- [ ] Explicitly recorded as **"skipped — deferred"**. This is an acceptable, expected outcome, not a failure
- [ ] Either way: `POST /api/mealplan/generate` still returns a valid plan, proving Prompt 10 does not depend on 3b having run
- [ ] `grep -rn "calories_per_unit" src/app src/components` returns nothing — no route or component requires the columns
- [ ] The migration is numbered `0009`, and `0008_grocery_gap_items.sql` is untouched
- [ ] A deliberately malformed USDA response is rejected by Zod and logged, and writes nothing to the database
- [ ] `scripts/enrich-baseline-pantry.ts` is not imported by any file under `src/app`

## Prompt 4 — Security utilities & API foundation

```
Build the shared security layer every API route in this app goes through. No
feature routes here — this prompt produces the machinery Prompts 5 and 8-12
consume. Read CLAUDE.md Rules 7, 8, 9, 10, and 12 before starting.

1. `src/lib/security/errors.ts` — a typed error taxonomy and the safe client
   mapping. Every response is `{ error: { code, message } }`. A raw Error
   message or stack trace never reaches the client; the detail is logged
   server-side only. Define the codes the other modules throw:
   UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, RATE_LIMITED,
   METHOD_NOT_ALLOWED, INTERNAL.

2. `src/lib/security/rate-limit.ts` — Upstash Redis buckets, keyed per user AND
   per route. The AI routes (`/api/mealplan/generate` and the day `regenerate`
   route) get the strictest bucket because they cost real money; suggest 5
   generations/hour and 20 regenerations/hour. `/api/auth/signup` and
   `/api/auth/forgot-password` get their own buckets to blunt abuse and account
   enumeration. If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is
   missing: fail OPEN in development with a loud console warning, fail CLOSED in
   production. Both directions must be reachable in a test.

3. `src/lib/security/ownership.ts` — `getActiveWorkspace()` resolving the caller's
   workspace from the session, and `assertWorkspaceOwnership(resource)` run before
   any read or mutation of a plan, day, pantry item, or grocery list. RLS is
   defence-in-depth, not the only check. A resource in another workspace returns
   404, never 403 — a 403 confirms the row exists, which is itself a disclosure.

4. `src/lib/security/api-handler.ts` — `withApiHandler`, applying in this exact
   order: method check -> auth session -> rate limit -> Zod body/param validation
   -> workspace ownership assertion -> handler -> typed error response. No route
   hand-rolls any of these steps. Ownership failures map to 404.

5. `src/lib/validation/password.ts` — the single shared password schema:
   minimum 12 characters with at least one uppercase letter, one lowercase
   letter, one number, and one symbol. Used by both signup and reset. The number
   12 appears here and in the two UI strings, nowhere else.

6. `src/lib/validation/common.ts` — reusable uuid, UTC-date, bounded-number, and
   bounded-text schemas. Numeric inputs carry explicit min/max: age 13-120,
   servings_per_meal 1-12, supper_option_index 0-2. Free text carries length
   caps: pantry name <= 120 chars, unit <= 32 chars. All date parsing is UTC-only,
   never timestamps (SPEC.md § 4.11).

Secrets are server-only: any file touching SUPABASE_SERVICE_ROLE_KEY,
ANTHROPIC_API_KEY, RESEND_API_KEY, or UPSTASH_* begins with
`import 'server-only'` (Rule 11).
```

### Checkpoint 4

- [ ] A route wrapped in `withApiHandler` called with the wrong HTTP method returns 405 before any auth or database work happens
- [ ] An unauthenticated call to a wrapped route returns 401 with body shape `{ error: { code, message } }`
- [ ] Requesting another workspace's pantry item by UUID returns **404**, not 403, and not the row
- [ ] With the Upstash env vars unset and `NODE_ENV=development`, requests succeed and a warning is logged; with `NODE_ENV=production` they return 429
- [ ] The 6th `/api/mealplan/generate` call in an hour returns 429, and the 5th returns 200
- [ ] `password.ts` rejects an 11-character password and rejects `abcdefghijkl1` (no symbol, no uppercase)
- [ ] A thrown error inside a handler returns a generic 500 with no stack trace in the response body, and the detail appears in the server log
- [ ] `grep -rLn "server-only" src/lib/security/rate-limit.ts src/lib/supabase/admin.ts` returns nothing

## Prompt 5 — Auth: six server routes + form UI

```
Build authentication. All six routes are server route handlers using Supabase SSR
cookie sessions — no client-side-only auth, no session state trusted from the
browser, and no auth step inside the chat flow. Read SPEC.md § 2 and § 6, and
CLAUDE.md Rule 12, before starting. Every route goes through `withApiHandler`
from Prompt 4.

Route paths are byte-for-byte from SPEC.md § 6. Do not add aliases, do not add a
GET where only POST is listed, and do not create routes not on that list.

1. `src/app/api/auth/signup/route.ts` — POST. Validate with the shared password
   schema from `src/lib/validation/password.ts`; never re-declare the policy.
   Creating the user fires the `handle_new_user` trigger from Prompt 3, which
   seeds the workspace, profile, trial subscription, and 54 pantry items. Its own
   rate-limit bucket.

2. `src/app/api/auth/login/route.ts` — POST. Generic failure message that does
   not distinguish unknown email from wrong password.

3. `src/app/api/auth/logout/route.ts` — POST. Clears the SSR cookie session.

4. `src/app/api/auth/forgot-password/route.ts` — POST. **Always returns 200**,
   with an identical body and comparable timing whether or not the email exists.
   Never reveal account existence. Its own rate-limit bucket.

5. `src/app/api/auth/reset-password/route.ts` — POST. Same shared password
   schema. The reset token is single-use.

6. `src/app/api/auth/callback/route.ts` — GET. Supabase token exchange for the
   password-reset link.

7. `src/lib/auth/schemas.ts` — Zod bodies for each route.
   `src/lib/auth/email.ts` — Resend transactional send for the password-reset
   email. `import 'server-only'`.

8. Pages: `src/app/(auth)/signup/page.tsx`, `login/page.tsx`,
   `forgot-password/page.tsx`, `reset-password/page.tsx`. Standard forms so
   password managers and autofill work.

9. `src/components/auth/auth-form.tsx` and `password-field.tsx`. The signup and
   reset copy states **exactly 12** characters — that number appears in these two
   UI strings and in `password.ts`, nowhere else.

There is NO email-verification gate in this build (SPEC.md § 3, G-06). Signup
confirms the address at the auth layer and issues the session directly, so the
user reaches the full Mizfit Chat immediately. Do not add a verification check to
any route, page, or middleware branch, here or anywhere else.
```

### Checkpoint 5

- [ ] The six route files match SPEC.md § 6 exactly — no extra routes, no aliases, no added GET handlers
- [ ] `POST /api/auth/signup` with an 11-character password returns 400; a 12-character password meeting all four classes succeeds
- [ ] One successful signup produces 1 workspace, 1 profile, 1 trialing subscription, and 54 pantry items
- [ ] `POST /api/auth/forgot-password` returns an identical status and body for a registered and an unregistered email
- [ ] A password reset token used twice fails on the second attempt
- [ ] `POST /api/auth/login` with wrong credentials returns the same message for an unknown email and a known email
- [ ] The signup and reset pages both display the number 12, and `grep -rn "12 characters" src/` returns only those two strings plus `password.ts`
- [ ] `grep -rn "email_confirmed\|verif" src/app src/lib` finds no verification branch in any route, page, or component

## Prompt 6 — App shell, session middleware, health

```
Build the protected app shell, session refresh, and the liveness probe. No
feature UI, no chat, no data fetching beyond the session. Read SPEC.md § 6 for
the health route and CLAUDE.md Rules 12 and 17.

1. `middleware.ts` at the project root — refresh the Supabase SSR cookie session
   on every matched request using the helper from
   `src/lib/supabase/middleware.ts` (Prompt 2a). Protect the `(app)` route group:
   an unauthenticated request to a protected path redirects to `/login`. Public
   paths stay public: `/`, the four `(auth)` pages, `/api/auth/*`, and
   `/api/health`. Do NOT add an email-verification branch here — this build has
   no verification gate anywhere (SPEC.md § 3, G-06).

2. `src/app/api/health/route.ts` — GET, unauthenticated liveness probe. Returns
   a minimal ok payload. It must expose no secrets, no env values, no version or
   commit detail, and no database error text. It does not go through auth or
   rate limiting.

3. `src/app/(app)/layout.tsx` — the protected shell. Reads the session
   server-side and renders the header and nav around its children.

4. `src/components/shell/app-header.tsx` — Fresh Sage tokens from Prompt 2b, the
   brand logo, and a logout control posting to `/api/auth/logout`.

5. `src/components/shell/nav.tsx` — navigation between the chat and the pantry.
   The current location is conveyed by an icon or text label as well as colour,
   never by colour alone (SPEC.md § 11a). Every nav item is keyboard-reachable
   with a visible focus ring at >= 3:1 contrast.

6. `src/app/(app)/error.tsx` — an error boundary rendering a generic message. It
   never displays an exception message, stack trace, or database error to the
   user. If `SENTRY_DSN` is set, report to Sentry with PII scrubbed; if it is
   unset, the boundary still works.

7. `src/app/not-found.tsx` — a custom 404 using the design tokens.

Keep this prompt to the shell. The chat surface is Prompt 7; the pantry page is
Prompt 9.
```

### Checkpoint 6

- [ ] `GET /api/health` with no session returns 200
- [ ] The `/api/health` response body contains no env value, version string, commit sha, or database detail
- [ ] An unauthenticated `GET /chat` redirects to `/login`; after login the same URL renders
- [ ] A signed-in user's session survives a page refresh without re-login, proving middleware refresh works
- [ ] Middleware contains no verification branch — the only redirect is unauthenticated → `/login`
- [ ] Throwing inside an `(app)` page renders the error boundary with a generic message and no stack trace in the DOM
- [ ] Tabbing through the nav shows a visible focus ring on each item, and the active item is marked by more than colour
- [ ] An unknown path renders the custom 404, not the framework default

## Prompt 7 — Mizfit Chat UI shell & step engine

```
Build the chat surface and the step engine that drives it. No step components
here — Prompts 8, 9, 10, and 12 each supply their own. Read SPEC.md § 3 and
§ 3.1 and CLAUDE.md Rule 15 before starting.

The chat is templated copy plus structured controls. It is NOT NLP. There is no
free-text input field, no intent parsing, no scope-guardrail system prompt, and
no persistent cross-app chat FAB. Every "AI message" bubble is app-authored
template copy — none of it calls a model.

1. `src/lib/chat/steps.ts` — the ordered step registry, all **11** steps from
   SPEC.md § 3.1 in order: welcome, demographics, calorie_confirm, servings,
   dietary_exclusions, methodology, pantry_confirm, cuisine, generate, review,
   grocery. Each entry declares its expected answer shape once — for example
   `{ activity_level: ActivityLevel }`, `{ dietary_exclusions: string[] }` — so
   the input mechanism stays decoupled from what the step does with the answer,
   and a future NLP layer is additive rather than a rewrite.

2. `src/lib/chat/copy.ts` — every templated bubble string, including
   "Anything we should avoid?" for dietary_exclusions and "How many people are
   you cooking for?" for servings. No model calls in this file or anywhere in the
   chat engine.

3. `src/lib/chat/use-chat-flow.ts` — the flow hook. Resume position comes from
   `profiles.onboarding_step`; on mount the flow resumes at that step rather than
   restarting. Each step writes its answer to the database immediately on
   capture, not batched at the end, so a mid-flow refresh resumes where the user
   left off. Advancing past `generate` is gated on a plan existing; advancing to
   `grocery` requires EVERY day to have an approved supper selection.

4. `src/components/chat/chat-shell.tsx`, `chat-stream.tsx`, `chat-bubble.tsx`,
   `chat-typing.tsx` — AI messages left, user responses right, Fresh Sage tokens
   from Prompt 2b. Steps 10 and 11 render inside this same stream; they are not
   separate pages.

5. `src/components/chat/controls/` — the generic inline controls the step
   components compose: `number-input.tsx`, `chip-select.tsx`,
   `multi-chip-select.tsx`, `button-row.tsx`, `checklist.tsx`. Each renders
   inside a bubble. Every control has a programmatically associated label — a
   placeholder is not a label — and a visible focus indicator at >= 3:1
   (SPEC.md § 11a). Selected chips are marked by an icon or text as well as
   colour.

6. `src/app/(app)/chat/page.tsx` — mounts the shell inside the Prompt 6 app
   layout.
```

### Checkpoint 7

- [ ] `src/lib/chat/steps.ts` contains exactly 11 steps in SPEC.md § 3.1's order, with `dietary_exclusions` at position 5, between `servings` and `methodology`
- [ ] `grep -rn "anthropic\|AI_MODEL" src/lib/chat src/components/chat` returns nothing
- [ ] There is no free-text input anywhere in the chat stream — every control is a number input, chip, button, or checklist
- [ ] Answering a step then hard-refreshing the page resumes at the next step, not at `welcome`
- [ ] `profiles.onboarding_step` updates in the database on each step capture, before the next bubble renders
- [ ] Attempting to advance to `grocery` while any day lacks an approved supper selection is blocked
- [ ] Tabbing to a chip group shows a visible focus ring, and the selected chip is distinguishable with colour ignored
- [ ] Every control in `src/components/chat/controls/` has an associated label or `aria-label`

## Prompt 8 — Profile / onboarding module (TDEE, exclusions, methodology)

```
Build the profile module and the four chat steps that populate it. All maths here
is deterministic pure TypeScript — none of it goes to the AI (CLAUDE.md Rule 14).
Read SPEC.md § 7 for the calorie calculation and § 8.1-8.2 for the macro
schedules. `profiles` already exists from Prompt 3; do not redefine it.

1. `src/lib/profile/tdee.ts` — pure functions, no I/O.
   - BMR, Mifflin-St Jeor. Men: 10*kg + 6.25*cm - 5*age + 5. Women: 10*kg +
     6.25*cm - 5*age - 161. `prefer_not_to_say` averages both.
   - TDEE = BMR * multiplier: sedentary 1.2, lightly_active 1.375,
     moderately_active 1.55, very_active 1.725, extra_active 1.9.
   - Required daily deficit = (lbs to lose * 3500) / days until target date.
   - Suggested target = TDEE - deficit, clamped to a floor of 1200 kcal (women
     and prefer_not_to_say) or 1500 kcal (men), and a max deficit of 1000
     kcal/day. If the requested date would breach either clamp, clamp the calorie
     target and recompute an extended completion date.
   - Height conversion (ft/in to cm) lives here, not in a component.
   - All date maths is UTC dates only, never timestamps (SPEC.md § 4.11).

2. `src/lib/profile/methodology.ts` — the macro schedules. Carb cycling uses the
   per-day ranges in SPEC.md § 8.1. The three fixed splits from § 8.2:
   High Protein 45/25/30, Vegetarian 30/40/30, Pescatarian 30/40/30 (protein /
   carbs / fat). Assert at module load that every fixed split sums to exactly
   100; a split that does not is a startup failure, not a silent renormalisation.

3. `src/lib/profile/schemas.ts` — one Zod schema per chat step, using the bounded
   helpers from Prompt 4. `dietary_exclusions` is
   `z.array(z.enum(['nuts','dairy','gluten','soy','shellfish']))`.

4. `src/app/api/profile/route.ts` — PATCH `/api/profile`, through
   `withApiHandler`. The chat calls it **incrementally**, once per step, not as
   one final submit. The clamp is re-applied server-side on every write; a
   client-supplied calorie target is never persisted as-is. Recompute
   `calorie_target`, `daily_deficit`, and `estimated_completion_date` whenever
   weight, goal weight, target date, activity level, or the override changes.

5. Chat step components, each writing on capture:
   `demographics-step.tsx`, `calorie-confirm-step.tsx` (shows the suggested
   target with "Looks good" / "Let me set my own"; the override reveals an inline
   number input and displays a warning when the clamp adjusted the entry),
   `servings-step.tsx` (default 1), `dietary-exclusions-step.tsx` (multi-select
   chips: Nuts, Dairy, Gluten, Soy, Shellfish; none selected is valid).
```

### Checkpoint 8

- [ ] `tdee.ts` unit-checked: a 40-year-old male, 180 lbs, 180 cm, moderately_active yields BMR 1816 and TDEE 2815 (+/- 1)
- [ ] A target date requiring a 1500 kcal/day deficit is clamped to 1000, and the returned completion date is later than the one requested
- [ ] A female profile whose computed target falls below 1200 is clamped to exactly 1200
- [ ] `PATCH /api/profile` with `calorie_target: 600` persists the clamped floor, not 600
- [ ] Changing `activity_level` alone recomputes `calorie_target` and `estimated_completion_date` in the same request
- [ ] Importing `methodology.ts` with any fixed split edited to sum to 125 throws at module load
- [ ] `PATCH /api/profile` with `dietary_exclusions: ['peanuts']` returns 400; `['nuts','soy']` succeeds; `[]` succeeds
- [ ] Each of the four steps writes to `profiles` before the next bubble renders — verify by refreshing mid-flow

## Prompt 9 — Pantry module

```
Build the pantry: four routes, the spoilage-priority query, the pantry page, and
the chat's pantry-confirmation step. `pantry_items` already exists from Prompt 3
— do not redefine, re-create, or re-seed it. The 54 baseline rows arrive from the
`handle_new_user` trigger, never from application code. Read SPEC.md § 4.6 and
§ 6, and CLAUDE.md Rules 8 and 9.

1. `src/lib/pantry/schemas.ts` — Zod bodies using the Prompt 4 helpers.
   `name` <= 120 chars, `unit` <= 32 chars free text (NOT an enum — the baseline
   list alone uses lb, gallon, dozen, head, bag, bottle, jar, can, pack, bulb,
   container, box, each, and "steaks (1 lb each)"). `quantity` is a positive
   number with two decimal places, never a string. `expiry_date` is a nullable
   UTC date. `is_frozen` is boolean.

2. `src/lib/pantry/queries.ts` — spoilage-priority ordering. The query is
   `where workspace_id = $1 and expiry_date is not null order by expiry_date asc`,
   unioned with the NULL-expiry staples as a separate unordered set. NULL expiry
   means permanent staple and is EXCLUDED from spoilage priority — not sorted to
   the top, not sorted to the bottom.

3. `src/app/api/pantry/route.ts` — GET and POST `/api/pantry`, both through
   `withApiHandler`. GET returns the caller's workspace items in spoilage-priority
   order. POST creates an item with `source = 'user'`.

4. `src/app/api/pantry/[itemId]/route.ts` — PATCH and DELETE
   `/api/pantry/[itemId]`. `assertWorkspaceOwnership` runs before either. An item
   in another workspace returns 404, never 403.

5. `src/app/(app)/pantry/page.tsx` plus `src/components/pantry/pantry-list.tsx`,
   `pantry-item-row.tsx`, `add-item-form.tsx`, `expiry-badge.tsx`. Item names are
   user-supplied free text and are NEVER rendered as HTML. `expiry-badge` conveys
   urgency with an icon or text label as well as colour (SPEC.md § 11a), and
   renders a distinct "staple" state for NULL expiry rather than an empty badge.
   `pantry-list` needs an empty state, even though seeding makes it rare.

6. `src/components/chat/steps/pantry-confirm-step.tsx` — chat step 7. An
   editable checklist of the seeded items with inline add and remove. Remove has
   no free-text input; add uses name + quantity + unit inputs. Captures
   `{ confirmed: true }`.
```

### Checkpoint 9

- [ ] `GET /api/pantry` on a fresh account returns 54 items
- [ ] Items with an expiry date are ordered soonest-first, and NULL-expiry staples appear as a separate group, not interleaved by date
- [ ] `PATCH /api/pantry/[itemId]` against another workspace's item UUID returns **404**, not 403, and does not modify the row
- [ ] `POST /api/pantry` with a 200-character name returns 400; a 120-character name succeeds
- [ ] `POST /api/pantry` with `unit: "steaks (1 lb each)"` succeeds — unit is free text, not an enum
- [ ] An item named `<img src=x onerror=alert(1)>` renders as literal text in the list, and no script executes
- [ ] `DELETE /api/pantry/[itemId]` on an item the caller owns returns 200 and the row is gone; repeating it returns 404
- [ ] A NULL-expiry item shows the staple badge state, distinguishable with colour ignored

> **Spot check — data access.** Covers Prompts 8 and 9, before Prompt 10:
> - [ ] Every endpoint filters by the workspace derived from the session, never
>       from a request parameter or body field
> - [ ] As user A, request user B's pantry item by UUID: zero rows, and a 404
> - [ ] Ownership failures return 404, never 403 — a 403 confirms existence
> - [ ] RLS is enabled on every table created so far. Count them: 7.

## Prompt 10 — Meal-plan generation (the AI feature)

```
Build weekly meal-plan generation. This is the ONLY code path in the build that
calls Anthropic. Read SPEC.md § 8 in full — especially § 8.2b, § 8.6a, and
§ 8.11 — and CLAUDE.md Rule 13 before starting.

Dev-mode mocking is mandatory and non-negotiable: when NODE_ENV !== 'production'
or AI_MOCK=1, return the fixture and open NO network connection to Anthropic.

1. `src/lib/ai/client.ts` — the single Anthropic entry point. Model id from
   `AI_MODEL` via `src/env.ts`, never hardcoded. The dev-mode mock gate lives
   here. `import 'server-only'`.

2. `src/lib/ai/mock-plan.ts` — a deterministic 7-day fixture: Sun-Sat, one
   breakfast, lunch, and snack per day plus exactly 3 supper options.

3. `src/lib/ai/plan-prompt.ts` — builds the system and user prompt from: the
   pantry in spoilage-first order, the methodology's macro schedule as
   percentages of the personalised `calorie_target`, `servings_per_meal`, the
   cuisine bias, the 3-substantively-unique-suppers rule (§ 8.5), the week-level
   guardrail that no breakfast or lunch repeats more than twice (§ 8.7), thaw
   reminders for frozen proteins, and the `OPTIONS:` convention for supporting
   items not in the pantry.
   - `dietary_exclusions` is stated as a **prohibition**, not a preference,
     alongside the methodology's own restrictions.
   - Per-item nutrition grounding is included ONLY where the columns are
     non-NULL (§ 8.11). NULL is the normal case; handle it per item, never as an
     all-or-nothing branch. Behave identically when Prompt 3b never ran.
   - Constraint conflicts resolve by SPEC.md § 8.6a's numbered precedence.
     Do not restate that order in different words.

4. `src/lib/ai/plan-schema.ts` — Zod validation of model output BEFORE any
   database write. Model output is untrusted. A malformed response is a handled
   error that sets `status = 'failed'` with `error_message`; never a crash, never
   a partial write.

5. `src/lib/mealplan/generate.ts` — orchestration: snapshot the profile
   (methodology, calorie_target, servings_per_meal) onto `meal_plans`, build the
   prompt, call, validate, then persist the plan and all 7 days in one
   transaction. `week_start_date` is the next Sunday on or after the current UTC
   date. Set `generation_source` to `ai` or `mock` and `model_id` accordingly.

6. `src/app/api/mealplan/generate/route.ts` — POST, body includes
   `cuisine_preferences: string[]` validated against the § 4.7 enum
   (italian, mexican, asian, mediterranean, american_comfort). No verification
   gate (SPEC.md § 3, G-06). Strictest rate-limit bucket. `src/app/api/mealplan/[planId]/route.ts` — GET.

7. `src/components/chat/steps/cuisine-step.tsx` (multi-select chips) and
   `generate-step.tsx`, which renders the single combined disclaimer block from
   § 8.2b unconditionally.
```

### Checkpoint 10

- [ ] With `NODE_ENV=development`, generating a plan makes no outbound request to api.anthropic.com — verify with the network disabled
- [ ] The generated plan has 7 days, each with exactly 3 supper options and one breakfast, lunch, and snack
- [ ] The 6th `POST /api/mealplan/generate` within the hour returns 429 — the rate-limit bucket is the only spend guard on this route
- [ ] `cuisine_preferences: ['french']` returns 400; `['italian','asian']` succeeds; `[]` succeeds
- [ ] Feeding the validator a malformed model response sets `status='failed'` with `error_message`, writes zero `meal_plan_days` rows, and does not throw
- [ ] Double-tapping generate for the same week creates one plan, not two — the partial unique index rejects the second
- [ ] With `dietary_exclusions: ['shellfish']`, no generated recipe or `OPTIONS:` item contains shrimp, and the pantry's shrimp goes unused
- [ ] `week_start_date` is a Sunday, computed from the UTC date, and generation succeeds identically whether or not Prompt 3b ran

## Prompt 11 — Plan review: select supper, approve, regenerate

```
Build day-by-day plan review — chat step 10, rendered inside the chat stream from
Prompt 7, not as a standalone page. `meal_plan_days` already exists from Prompt 3;
do not redefine it. Read SPEC.md § 6 for the three route paths and § 8.2b for the
disclaimer. Every route goes through `withApiHandler` with
`assertWorkspaceOwnership` on the plan and the day.

Route paths are byte-for-byte from SPEC.md § 6, including the `[planId]` and
`[dayId]` parameter names.

1. `src/app/api/mealplan/[planId]/days/[dayId]/select-supper/route.ts` — POST,
   body `{ supper_option_index: 0|1|2 }` validated as a bounded integer. Writes
   `selected_supper_index`. Selecting a different option later overwrites it.

2. `src/app/api/mealplan/[planId]/days/[dayId]/approve/route.ts` — POST. Returns
   **400 if `selected_supper_index` is NULL** — a day is not approvable until a
   supper option is chosen. On success sets `approved_at`.

3. `src/app/api/mealplan/[planId]/days/[dayId]/regenerate/route.ts` — POST.
   Regenerates all four slots: breakfast, lunch, snack, AND all 3 supper options
   fresh as a set. Clears `selected_supper_index` and `approved_at`, and
   increments `regenerated_count`. This is the second AI-calling path in the
   build, so it takes the strict rate-limit bucket alongside generate.

4. `src/lib/mealplan/regenerate-day.ts` — reuses Prompt 10's client, prompt
   builder, and Zod validation. Re-applies `dietary_exclusions` identically, and
   resolves conflicts by the same § 8.6a precedence. A day regenerated for a user
   with exclusions is held to exactly the same constraint as the original
   generation. Dev-mode mocking applies here too — never call Anthropic in
   development.

5. `src/components/mealplan/day-card.tsx` (expandable), `meal-slot.tsx`,
   `supper-option-card.tsx` (three tappable cards; the selected one is marked by
   an icon or text as well as colour), `macro-pills.tsx`, `day-actions.tsx`
   (Approve and Regenerate).

6. The plan-review surface carries the **same single combined disclaimer block**
   as Prompt 10 — one shared copy string covering both the medical/allergen point
   and nutrition accuracy, shown unconditionally. Not a second, differently
   worded notice, and not conditional on whether Prompt 3b ran.
```

### Checkpoint 11

- [ ] `POST .../approve` on a day with no supper selected returns **400**, and `approved_at` stays NULL
- [ ] Selecting option 1 then approving succeeds; `selected_supper_index = 1` and `approved_at` is set
- [ ] `supper_option_index: 3` returns 400; `0`, `1`, and `2` all succeed
- [ ] Regenerating an already-approved day clears both `selected_supper_index` and `approved_at`, and increments `regenerated_count`
- [ ] After regeneration all four slots are new — the 3 supper options are a fresh set, not one swapped option
- [ ] With `dietary_exclusions: ['dairy']`, a regenerated day contains no dairy in any of its four slots
- [ ] All three routes against another workspace's `planId` return **404**, not 403
- [ ] The disclaimer block on the review surface is byte-identical to Prompt 10's and renders whether or not any pantry item is enriched

## Prompt 12 — Grocery gap list

```
Build the grocery gap list — chat step 11, rendered inside the chat stream. This
prompt OWNS `grocery_gap_items`: it is the only single-feature table in the build,
and no other module reads or writes it (CLAUDE.md Rule 3). Read SPEC.md § 4.9 and
§ 6 before starting.

1. `supabase/migrations/0008_grocery_gap_items.sql` — the table per SPEC.md
   § 4.9: `meal_plan_id` and `workspace_id` both FK with ON DELETE CASCADE
   (workspace_id denormalised so RLS needs no join), `name`, nullable `quantity`
   numeric(10,2), nullable `unit`, `source` (`missing_ingredient` or `options`),
   `is_checked` default false. `unique (meal_plan_id, name, unit)` — the
   aggregation is regenerated, never appended. RLS enabled in this same
   migration, scoped through `is_workspace_member(workspace_id)`.
   Keep the number 0008; optional Prompt 3b deliberately takes 0009 so this
   filename never shifts.

2. `src/lib/grocery/compute-gap.ts` — pure function, no I/O. Takes the plan's
   approved days plus the pantry and returns the gap. Rules:
   - Include ingredients from the approved slots only: breakfast, lunch, snack,
     and the SELECTED supper option — never the two unselected options.
   - Include every `OPTIONS:` supporting item, tagged `source = 'options'`.
   - Exclude the always-available seasonings in SPEC.md § 8.4: the six tracked
     no-expiry staples plus paprika, ground cumin, chili powder, Italian
     seasoning, curry powder, ground cinnamon, ground ginger, crushed red pepper,
     bay leaves, Cajun/Creole seasoning, sesame seeds. They are exempt from
     depletion tracking entirely.
   - Match pantry items on normalised name first. Compare quantity ONLY when
     units match; when units differ (pantry "1 bottle olive oil" versus a recipe's
     "2 tbsp"), treat the item as present and omit it. State this rule in a
     comment — it is the difference between a useful list and one that puts olive
     oil on it every week.
   - Aggregate on `(name, unit)`.

3. `src/app/api/grocery-list/[planId]/route.ts` — GET, through
   `withApiHandler` with ownership asserted on the plan. Computes the gap,
   replaces the plan's rows, and returns them. Returns 400 if any day of the plan
   lacks an approved supper selection — the list is only meaningful once the week
   is settled.

4. `src/components/grocery/gap-list.tsx` and `gap-item-row.tsx` — read-only list
   with checkable rows persisting `is_checked`. `OPTIONS:`-sourced items are
   visually distinguished by an icon or text label, not colour alone. Include an
   empty state for the case where the pantry already covers the week.

5. `src/components/chat/steps/grocery-step.tsx` — chat step 11.
```

### Checkpoint 12

- [ ] `GET /api/grocery-list/[planId]` returns 400 while any day lacks an approved supper selection, and 200 once every day is approved
- [ ] The list excludes ingredients from the two UNSELECTED supper options of each day
- [ ] Salt, black pepper, paprika, and bay leaves never appear, even when a recipe names them
- [ ] A recipe needing "2 tbsp olive oil" against a pantry holding "1 bottle olive oil" produces NO gap row — mismatched units count as present
- [ ] `OPTIONS: hamburger buns` appears with `source = 'options'` and is visually distinguished by more than colour
- [ ] Calling the endpoint twice produces the same row count, not doubled rows — the unique constraint regenerates rather than appends
- [ ] `GET /api/grocery-list/[planId]` against another workspace's plan returns **404**, not 403
- [ ] Deleting the meal plan cascades its `grocery_gap_items` rows away

---

## Service keys — by the prompt that first needs them

Provision these before starting the prompt named, or that prompt stalls.

| Service | Env var(s) | First needed | Placeholder enough? |
|---|---|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | **2a** (config), live by **3** | No — Prompt 3 needs a real project to apply migrations |
| App URL | `NEXT_PUBLIC_APP_URL` | **2a** | Yes — `http://localhost:3000` in development |
| Upstash Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | **4** | Yes in development — rate limiting fails OPEN with a warning. **Required live before production**, where it fails closed |
| Resend | `RESEND_API_KEY` | **5** (password-reset email) | Placeholder builds; in development the reset link is logged to the server console instead |
| Anthropic | `ANTHROPIC_API_KEY`, `AI_MODEL` | **10** | Yes for the whole build — dev mode returns the mock and never calls the API. A live key is needed only to exercise the real path |
| Sentry | `SENTRY_DSN` | **6** (error boundary) | Yes — optional throughout; inert when unset |
| USDA FoodData Central | `USDA_FDC_API_KEY` | **3b** (optional) | Not needed at all if 3b is skipped |
| Open Food Facts | `OPEN_FOOD_FACTS_USER_AGENT` | **3b** (optional) | Not a credential — an identifying User-Agent string their guidelines require |

`AI_MOCK=1` forces the mock in any environment. `AI_MODEL` defaults to
`claude-sonnet-5` (SPEC.md § 11).

---

## After Prompt 12

The build ends here. The four tail phases — Stripe/billing, Legal & GDPR,
Polish, and Testing & CI/CD — are **DEFERRED by explicit product decision**
(`CLAUDE.md` § DEFERRED, `SPEC.md` § 12). They are sequenced later, not cut.

**Two consequences worth stating plainly rather than discovering later:**

1. **There are no automated tests and no CI pipeline in this build.** Every
   checkpoint above is verified by hand. The standard sequence treats CI as a
   required deliverable; this build overrides that.
2. **Accessibility is NOT deferred.** WCAG 2.1 AA and Section 508 are hard
   requirements of Prompt 2b (`CLAUDE.md` Rule 17), deliberately kept out of the
   deferred Polish phase.

**Handoff.** When Checkpoint 12 passes, the build is done and the **harden**
skill takes over for the A–G pre-launch cascade. Do not inline that work here,
and do not compress it into a single "run the hardening" step — it is its own
sequence with its own gates. Note that several harden phases (A payments,
D SEO/legal) assume tail work this build defers; expect them to report findings
against the deferred surface rather than passing vacuously.
