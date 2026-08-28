# BUILD_STATE.md — session handoff

**Read `CLAUDE.md`, `SPEC.md` and `BUILD.md` first. They are the authority.**
This file carries only the state a fresh session cannot reconstruct from the repo: what is done,
what was decided along the way, and why. Update it at the end of every prompt.

Last updated: after Prompt 4 · `main` at the Prompt 4 commit

---

## Where we are

| Prompt | Status |
|---|---|
| 1 — Spec validation & project setup | ✅ complete |
| 2a — Project scaffold & configuration | ✅ complete |
| 2b — Design system (Fresh Sage) & UI primitives | ✅ complete |
| 3 — Database schema, RLS, triggers, baseline seed | ✅ complete |
| 3b — Nutrition enrichment (**OPTIONAL**) | ⬜ not started — skipping is an expected outcome |
| 4 — Security utilities & API foundation | ✅ complete |
| **5 — Auth: six server routes + form UI** | ⬜ **next** |
| 6–12 | ⬜ not started |
| Tail (Stripe, Legal/GDPR, Polish, Testing/CI) | **DEFERRED — not part of this build** |

`main` == `origin/main`, working tree clean, `npm run check:all` green.

**Prompt 5 owns** (SPEC.md Appendix A): the six auth routes in `src/app/api/auth/*`,
`src/lib/auth/schemas.ts`, `src/lib/auth/email.ts`, the four `(auth)` pages, and
`src/components/auth/{auth-form,password-field}.tsx`.

---

## How this build has been worked — please continue

- **Checkpoints are verified by running the thing, never by reading the code.** Prompt 2a's headers
  were proven with `curl` against a running server; 2b's contrast and labelling with a temporary
  preview route that was deleted afterwards; 3's entire checkpoint against a live Postgres. Failure
  cases were made to actually fail: a planted canary secret, a placeholder-only `Input`, a duplicate
  meal plan, a non-Sunday `week_start_date`. If a checkpoint genuinely cannot be executed, say so
  explicitly rather than asserting it from the source.
- **One commit per prompt**, with the checkpoint evidence summarised in the commit message.
- **Deviations from `BUILD.md` / Appendix A are flagged in the response**, not buried in a diff.

---

## Environment

- **Local Supabase stack** — start with `supabase start`; `supabase status` prints the keys.
  API `http://127.0.0.1:54321` · DB port `54322` · Studio `54323` · Mailpit `54324`.
  Direct SQL: `docker exec -i supabase_db_MizFit psql -U postgres -d postgres`
- A test user `alice@example.com` exists with a seeded 54-item pantry (recreate with
  `supabase db reset` plus a signup through the Auth admin API).
- `.env` exists locally and is gitignored — placeholder Supabase values plus `AI_MOCK=1`.
- `npm run check:all` = lint → typecheck → check:secrets → build.
- **Upstash without an Upstash account.** The rate-limit checkpoint ran against a local
  Upstash-REST-compatible endpoint, which is how both fail-open and fail-closed were proven:
  `docker network create mizfit-rl`,
  `docker run -d --name mizfit-redis --network mizfit-rl redis:7-alpine`,
  `docker run -d --name mizfit-srh --network mizfit-rl -p 8079:80 -e SRH_MODE=env -e SRH_TOKEN=mizfit_local_token -e SRH_CONNECTION_STRING=redis://mizfit-redis:6379 hiett/serverless-redis-http:latest`,
  then `UPSTASH_REDIS_REST_URL=http://127.0.0.1:8079` and `UPSTASH_REDIS_REST_TOKEN=mizfit_local_token`.
  Removed afterwards.
- A `.env.local` holding the real local-Supabase keys (from `supabase status`) makes `npm run dev`
  talk to the local stack; it is gitignored and was removed after the checkpoint.
- `git push` works, but Git Credential Manager can stall on a GUI prompt that an agent session
  cannot surface. If a push hangs, hand it back to the user to run as `!git push`.

---

## Decisions already made — do not "fix" these

**Stack**
- **Zod is pinned to 4.x.** Boundary schemas use Zod 4 syntax (`z.url()`, `error.issues`), not Zod 3.
- `tailwind-merge` is held at **2.x** because 3.x targets Tailwind v4 and the build is pinned to
  Tailwind 3.4.
- Versions follow `CLAUDE.md` Rule 2, not npm `latest`: Next 15.5.24, TypeScript 5.7.3, React 19.2.8.
  npm currently offers Next 16 / TS 7 — that is not an upgrade to take.

**Database (Prompt 3)**
- **`profiles` RLS scopes on `user_id = auth.uid()`, not workspace membership.** `SPEC.md` § 4.4 cites
  PRD SEC-4: personal tracking data stays private *inside* a household, so membership-scoped policies
  would let Phase 3's second member read their partner's weight. `INSERT` additionally requires
  membership so a row cannot be attached to someone else's workspace. This is a deliberate departure
  from Rule 4's wording in favour of `SPEC.md`'s intent.
- **Three RLS helpers, all `SECURITY DEFINER STABLE` with an empty `search_path`:**
  `is_workspace_member`, `is_workspace_owner`, `can_access_meal_plan`. Every policy calls one instead
  of writing its own join. `SECURITY DEFINER` is also what stops the `workspace_members` policies
  recursing into themselves.
- **The 54 baseline pantry rows live in `seed_baseline_pantry()` inside
  `0007_handle_new_user.sql`**, not in `supabase/seed/baseline_pantry.sql`. A trigger cannot read a
  file outside the migration path, and a second copy of the list would be free to drift from the one
  that actually runs at signup. The seed script calls the function. The function raises if the count
  is not exactly 54.
- Two constraints added beyond the letter of the spec:
  `check (extract(isodow from week_start_date) = 7)` so a non-Sunday week start is rejected at the
  database, and `approved_at` requires a non-null `selected_supper_index`.
- The four `*_per_unit` nutrition columns are **not** in `0005_pantry_items.sql`. They belong to the
  optional Prompt 3b as `0009_pantry_nutrition.sql`. Everything must behave identically when they are
  absent (`SPEC.md` § 8.11).
- **`src/types/database.ts` is real `supabase gen types typescript --local` output.** Regenerate it
  after any new migration; do not hand-edit. Domain aliases and the two fixed value sets
  (`DIETARY_EXCLUSIONS`, `CUISINE_PREFERENCES`) are derived in `src/lib/db/queries.ts`.
- **Connection-pooling spot check: recorded as not applicable**, with the reasoning in
  `src/lib/db/queries.ts`. Nothing in this build opens a Postgres connection — every accessor speaks
  HTTP to PostgREST. Re-evaluate if a direct Postgres driver is ever added.

**Security layer (Prompt 4)**
- **There are two exported wrappers, not one:** `withApiHandler` (authenticated) and
  `withPublicApiHandler` (the six auth routes and `/api/health`, which cannot have a session yet).
  They share every step of the pipeline — the public one simply has no auth and no workspace step,
  because there is no user to authenticate and no workspace to own anything. A route with a caller
  identity always uses `withApiHandler`. This is a deviation from BUILD.md's single-wrapper wording,
  taken so the authenticated context can type `user` and `workspace` as present rather than nullable.
- **`RouteContext.params` is required, not optional.** Next 15's generated route type check rejects
  `params?:`. `parseParams` still tolerates its absence at runtime.
- **The ownership step is `loadResources`**, a config hook that runs after validation and before the
  handler. It loads every row the handler will touch and passes each through
  `assertWorkspaceOwnership` / `assertPlanDayOwnership`. The handler receives them on `ctx.resources`,
  so it never re-fetches and never sees a row it does not own.
- **`assertPlanDayOwnership` exists because `meal_plan_days` has no `workspace_id`.** It checks the
  parent plan's workspace and that the day belongs to that plan, so a `[planId]`/`[dayId]` pair from
  two different plans cannot be stitched together. Both failures are the same 404.
- **A validation failure returns the first Zod issue's message** as the client-facing string. Zod
  messages describe the constraint, never the submitted value, so this tells a user their password
  needs a symbol without echoing what they typed. Every other code returns fixed app-authored copy;
  `publicMessage` is opt-in and must be a literal we wrote.
- **Rate-limit buckets live in `RATE_LIMIT_BUCKETS`** and are keyed per user (or per IP on the
  unauthenticated routes) and per route. `mealplan:generate` 5/h and `mealplan:regenerate` 20/h come
  from BUILD.md; `auth:login` 10/15m, `auth:reset-password` 5/h, `mutation` 60/m and `read` 120/m are
  chosen defaults, flagged as such. The default is `read` for GET and `mutation` otherwise.
- **The unenforceable path warns on every check, not once per process.** A warning that prints once is
  one a developer scrolls past, and it is saying the app is running with an unenforced limit.
- **`common.ts` bounds only the fields SPEC.md gives numbers for** — age 13–120, servings 1–12, supper
  index 0–2, pantry name ≤ 120, unit ≤ 32, quantity from `numeric(10,2)`. Weight, height and the
  calorie override are Prompt 8's, alongside the § 7 clamp that gives them meaning; build them with
  `boundedNumber` / `boundedInt` rather than inventing new factories.
- **`utcDateSchema` keeps the `YYYY-MM-DD` string and does not transform to `Date`.** A `Date` is an
  instant, and one local-timezone format call shifts the stored day (§ 4.11). Use `toUtcDate` /
  `formatUtcDate` when arithmetic is genuinely needed.
- **`passwordSchema` messages come from `PASSWORD_RULE_TEXT`**, which contains the literal
  "12 characters" so Checkpoint 5's grep finds it. A module-load guard fails the boot if that sentence
  and `PASSWORD_MIN_LENGTH` ever drift apart.

**Design system (Prompt 2b)**
- **No error/red colour exists.** `SPEC.md` § 11's six tokens are the only palette in this build, so
  error states use an icon plus the literal word "Error" plus a heavier border — never colour. If a
  semantic error colour is wanted, it has to be added to `SPEC.md` § 11 with a verified contrast
  pairing first.
- `Input` and `Checkbox` require `label`, `aria-label`, or `aria-labelledby` **at the type level** — a
  placeholder-only `Input` is a compile error, not a review note.
- The shared focus indicator is `focusRing`, exported from `src/lib/utils.ts`. It is a real `outline`,
  not a ring, so it does not depend on the surface behind the control. Nothing in the codebase sets
  `outline: none` / `outline-none`.
- `Button`'s `solid` variant is the only white-on-green surface and fills with `cta-dark` `#4D7735`
  (5.24:1). There is deliberately no variant that fills with `cta` `#5B8C3E` (3.99:1).

**Files added beyond Appendix A**, each for a stated reason:
`postcss.config.mjs` (Tailwind cannot compile without it), `scripts/validate-env.mjs` (implements the
`env:validate` script BUILD.md requires but does not name), `scripts/check-secrets.sh`,
and this file.

---

## Prompt 5 reminders from the rules

- Every one of the six routes goes through Prompt 4's wrapper. Signup, login, forgot-password,
  reset-password and callback have no session yet, so they use **`withPublicApiHandler`** and must name
  a rate-limit bucket explicitly — `auth:signup`, `auth:login`, `auth:forgot-password` and
  `auth:reset-password` already exist in `RATE_LIMIT_BUCKETS`.
- Import `passwordSchema` from `src/lib/validation/password.ts`; never restate the policy. The UI copy
  renders `PASSWORD_RULE_TEXT` — that string is where the literal **12** lives for the two forms.
- `/api/auth/forgot-password` **always returns 200**, same body, comparable timing, registered or not.
- Email verification gates nothing here. The single gate is `POST /api/mealplan/generate` (Prompt 10).
- Route paths byte-for-byte from `SPEC.md` § 6. No aliases, no added GET handlers.
