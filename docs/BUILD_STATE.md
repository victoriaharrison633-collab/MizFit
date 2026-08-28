# BUILD_STATE.md — session handoff

**Read `CLAUDE.md`, `SPEC.md` and `BUILD.md` first. They are the authority.**
This file carries only the state a fresh session cannot reconstruct from the repo: what is done,
what was decided along the way, and why. Update it at the end of every prompt.

Last updated: after Prompt 3 · `main` at `98ba949`

---

## Where we are

| Prompt | Status |
|---|---|
| 1 — Spec validation & project setup | ✅ complete |
| 2a — Project scaffold & configuration | ✅ complete |
| 2b — Design system (Fresh Sage) & UI primitives | ✅ complete |
| 3 — Database schema, RLS, triggers, baseline seed | ✅ complete |
| 3b — Nutrition enrichment (**OPTIONAL**) | ⬜ not started — skipping is an expected outcome |
| **4 — Security utilities & API foundation** | ⬜ **next** |
| 5–12 | ⬜ not started |
| Tail (Stripe, Legal/GDPR, Polish, Testing/CI) | **DEFERRED — not part of this build** |

`main` == `origin/main`, working tree clean, `npm run check:all` green.

**Prompt 4 owns** (SPEC.md Appendix A):
`src/lib/security/rate-limit.ts`, `src/lib/security/ownership.ts`,
`src/lib/security/api-handler.ts`, `src/lib/security/errors.ts`,
`src/lib/validation/password.ts`.

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

## Prompt 4 reminders from the rules

- `withApiHandler` order is fixed: **method → auth session → rate limit → Zod validation → workspace
  ownership → handler → typed error** (Rule 7). No route hand-rolls any step.
- Rate limiting **fails open in development with a loud console warning, fails closed in production**
  (Rule 10). AI routes get the strictest bucket; `/api/auth/signup` and `/api/auth/forgot-password`
  get their own.
- `assertWorkspaceOwnership` runs on every resource access **even though RLS is enabled** — RLS is
  defence in depth, not the only check (Rule 9). Never leak another workspace's row existence through
  a 403-vs-404 distinction: **return 404 for both.**
- Errors map to a stable `{ error: { code, message } }`; the detail is logged server-side only. No raw
  `Error` message and no stack trace reaches the client (Rule 7).
- Password policy: **minimum 12 characters with at least one uppercase, one lowercase, one number and
  one symbol**, stated once in `SPEC.md` § 2. The number **12** appears verbatim in the signup and
  reset UI copy, and nowhere is a different number stated.
- Numeric inputs get explicit min/max bounds; free-text fields get length caps (Rule 8).
