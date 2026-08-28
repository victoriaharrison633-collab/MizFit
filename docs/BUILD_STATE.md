# BUILD_STATE.md — session handoff

**Read `CLAUDE.md`, `SPEC.md` and `BUILD.md` first. They are the authority.**
This file carries only the state a fresh session cannot reconstruct from the repo: what is done,
what was decided along the way, and why. Update it at the end of every prompt.

Last updated: after the hackathon deploy · live on Vercel, one setting away from working signup

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
| 5 — Auth: six server routes + form UI | ✅ complete |
| 6 — App shell, session middleware, health | ✅ complete |
| 7 — Mizfit Chat UI shell & step engine | ⚠️ **narrowed** — one `chat-shell.tsx` instead of ten files |
| 8 — Profile / TDEE onboarding | ✅ complete |
| 9 — Pantry module | ✅ complete — page + all four CRUD routes (2 components, not 4) |
| 10 — Meal-plan generation | ✅ complete (mock path proven; real path built, unproven) |
| 11 — Plan review | ⚠️ **narrowed** — select + approve; **no day regenerate** |
| 12 — Grocery gap list | ⚠️ **narrowed** — computed on read, no `grocery_gap_items` table |
| Tail (Stripe, Legal/GDPR, Polish, Testing/CI) | **DEFERRED — not part of this build** |

`main` == `origin/main`, working tree clean, `npm run check:all` green.

**Prompt 7 owns** (SPEC.md Appendix A): `src/app/(app)/chat/page.tsx`, the four `components/chat/*`
shell files, `src/lib/chat/{steps,copy,use-chat-flow}.ts`, and the five
`components/chat/controls/*` inputs.

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
- **Port 3000 is often occupied by one of the user's other projects.** Run checkpoints on an explicit
  port (`npx next dev -p 3210`) and never kill whatever is listening on 3000 — it is probably not this
  app. Set `NEXT_PUBLIC_APP_URL` to match the port in use, or emailed links point at the wrong server.
- **No browser automation is available in this project** (the Chrome extension was declined). Anything
  that only exists after hydration cannot be seen with `curl`; verify the server output and the
  component's own render separately, and say plainly which half was not executed.

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
- **Successful responses carry `X-RateLimit-Limit/Remaining/Reset`** so the chat can warn before the
  user hits the cap instead of after. `Retry-After` appears only on the 429. Nothing is sent when the
  route has no bucket, or when the check could not be enforced — a count we did not compute would be
  a number the client trusts and we invented.
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

**The demo-spine pass (Prompts 7–12, built against a one-hour clock)**
- **What is cut, and it is cut deliberately:** the day `regenerate` route and its UI;
  `supabase/migrations/0008_grocery_gap_items.sql` and the `grocery_gap_items` table.
- **The pantry module was built after the first pass** (see below), so the Pantry nav item is back and
  `/pantry` is real. The chat's own pantry step stays read-only — editing happens on the page.
- **The grocery gap is computed on read** in `src/lib/grocery/compute-gap.ts` and returned by
  `GET /api/grocery-list/[planId]`. Nothing else reads the table, so this is the same answer without a
  migration — which also means there is no extra migration to push to a hosted database. Persisting it
  later is additive.
- **`chat-shell.tsx` is one file** where Appendix A lists a shell, bubble, stream, typing indicator,
  five control components and a `use-chat-flow` hook. The step registry and answer shapes still live in
  `src/lib/chat/steps.ts`, so splitting it is mechanical.
- **`AI_MOCK=1` is the production demo setting.** The mock returns a full 7-day plan with 3 suppers a
  day and opens no network connection, so the demo needs no Anthropic key and spends nothing. The real
  path (`src/lib/ai/client.ts` + `plan-prompt.ts`) is built and typechecks but **has never been run
  against the live API** — flipping `AI_MOCK` off is an untested code path.
- **The mock's supper trios repeat every third day** (`SUPPERS[dayIndex % 3]`), so days 0, 3 and 6 share
  a set. Breakfasts, lunches and snacks are all distinct. Worth knowing before demoing the review step.
- **Verified end to end locally** against the live local stack: signup → demographics (target 1351 kcal,
  deficit clamped to 1000, completion date extended) → servings → exclusions → methodology → generate
  (7 days, 3 suppers each, `generation_source: mock`) → select + approve all seven → grocery list of 33
  items, aggregated by name and unit with `OPTIONS:` extras separated. Approving a day with no supper
  selected returns 400.

**Pantry (Prompt 9)**
- All four routes exist at the § 6 paths: `GET`/`POST /api/pantry`, `PATCH`/`DELETE
  /api/pantry/[itemId]`. Both `[itemId]` routes share one `loadResources` that runs
  `assertWorkspaceOwnership`, so another workspace's item is a 404 on both — verified.
- **`ExpiryBadge` states every condition in words** — "Use today", "Use tomorrow", "3 days left",
  "Expired 2 days ago", "Staple", "Frozen" — with an icon, and underlines the urgent ones. There is no
  red in this palette to lean on, so nothing here depends on colour (SPEC.md § 11a).
- A NULL expiry renders as **Staple**, never as a date comparison, and the page keeps the two groups in
  separate sections so a staple is never ranked against a date (SPEC.md § 4.6).
- Hand-added rows get `source: 'user'`; the 54 seeded rows keep `source: 'seed'`.
- Two components (`pantry-manager`, `expiry-badge`) where Appendix A lists four.

**App shell (Prompt 6)**
- **Middleware lives at `src/middleware.ts`, not the repository root.** `BUILD.md` says "project root",
  but with a `src` directory Next only picks it up inside `src/` — at the root it is silently ignored,
  which would leave every page unprotected with nothing to notice. Verified working: the build output
  lists `ƒ Middleware`, and an anonymous `/chat` redirects.
- **Protection is deny-by-default.** Public pages are exactly `/`, `/login`, `/signup`,
  `/forgot-password`, `/reset-password`; everything else needs a session. A page added by a later
  prompt is protected the moment it exists, not the moment someone remembers to list it. Consequence
  to know: a signed-out request for a path that does not exist also redirects to `/login`, so the
  custom 404 is only seen by a signed-in visitor.
- **`/api/*` always passes through middleware** and is authenticated by `withApiHandler` instead.
  Redirecting an API call would hand `fetch()` an HTML login page with a 200 instead of the typed 401
  it expects. `/api/health` skips the session refresh entirely.
- **The `(app)` layout re-reads the session** even though middleware already did. Middleware protects
  by path pattern; the layout protects by being the thing that renders, so a narrowed matcher cannot
  quietly expose a page.
- **SENTRY IS NOT WIRED into `(app)/error.tsx`, and this is a flagged conflict, not an oversight.**
  `BUILD.md` asks the boundary to report when `SENTRY_DSN` is set. The boundary is a client component,
  so reporting needs a browser-readable DSN; `SPEC.md` § 11 lists `SENTRY_DSN` as server-only and
  `.env.example` forbids adding a variable § 11 does not name. Routing it through an API endpoint means
  inventing a route § 6 does not list (Rule 6), and `@sentry/nextjs` is not a pinned dependency
  (Rule 2). Next already logs the same error server-side with the same digest. Reasoning is in the file.
- **The boundary shows `error.digest`** — Next's own hash, not derived from user data — so a user can
  quote a reference that matches the server log.

**Auth (Prompt 5) — and the verification gate that was removed**
- **`SPEC.md` § 3, § 6, G-06, `BUILD.md` and `CLAUDE.md` Rule 12 were all amended before this prompt
  was built.** The old design — chat open immediately, 403 at `/api/mealplan/generate` for an
  unverified user — rests on a state Supabase does not have. Probed against the live local stack:
  `admin.createUser({ email_confirm: false })` gives `email_confirmed_at: null`, and a password grant
  for that user is refused with `400 email_not_confirmed`. The refusal does **not** depend on
  `enable_confirmations`, which was already `false` locally. So a session-holding user is always
  already confirmed, and the 403 could never fire. **Decision: no verification gate anywhere in this
  build.** Do not re-add one without re-reading G-06. The Anthropic spend it guarded is held by the
  `mealplan:generate` bucket and by mandatory dev mocking.
- **`enable_confirmations = false` is load-bearing now.** `signUp` issues the session directly, which
  is what makes the chat reachable at once. The signup route throws a loud 500 with the reason if it
  ever gets back a user with no session — that is the symptom of someone turning confirmations on in
  the Supabase project.
- **Password reset uses `admin.generateLink({ type: 'recovery' })` plus Resend**, not
  `resetPasswordForEmail`. Supabase's own mailer is not in the path, so `src/lib/auth/email.ts` owns
  the copy and the send. `generateLink` is a justified service-role call (Rule 11): minting a token for
  an address the caller has not authenticated as has no anon-key equivalent.
- **`/api/auth/callback` is the only route that consumes the token**, via `verifyOtp`, which is what
  makes the link single-use. Both outcomes are redirects, never JSON — a person clicked a link in their
  inbox. A spent link lands on `/forgot-password?status=invalid_link`, and that value is matched
  against a fixed map; the query string is never rendered.
- **`/api/auth/reset-password` is the one auth route behind `withApiHandler`**, not the public wrapper.
  It runs on the session the callback established, so no valid link means no session means 401.
- **`forgot-password` pads every response to a 1500ms floor** so the branch that sends mail and the
  branch that does not cannot be told apart by a stopwatch. Measured warm: both branches within 8ms.
  The number is a measurement, not a constant — re-measure if Resend latency changes.
- **The from-address is a module constant, `MizFit <onboarding@resend.dev>`** — Resend's sandbox
  sender, which only delivers to the Resend account owner. `SPEC.md` § 11 lists no variable for it and
  `.env.example` forbids adding one, so it is not read from the environment. Replace it with a verified
  domain before this app mails a real user.
- **With no `RESEND_API_KEY`, development prints the reset link to the server console** and production
  logs an error — neither throws, because a mail failure that became a 500 would leak the account
  existence the route exists to hide. This is also how the reset flow is testable locally.
- **`AuthForm` is declarative and owns all four forms' client logic.** Pages stay server components and
  pass a `fields` array; that is what keeps `components/auth/` to the two files Appendix A lists.
  Copy for the password rule comes from `PASSWORD_RULE_TEXT` — the pages never write the number.
- **Signup, login and reset all redirect to `/chat`, which does not exist until Prompt 7.** That is the
  intended seam, not an oversight.

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

## Deployed state, and the one thing left

Live at `https://miz-fit.vercel.app`, Supabase project `totubavgrhunmnljioxa`.

**Signup returns 500 on production, and it is one setting, not a code bug.** Supabase →
Authentication → Providers → Email → **"Confirm email" must be OFF**. With it on, `signUp` returns a
user with no session and the route throws a deliberate 500 naming that cause. Nothing else is known
to be broken: the full path — profile, generation, review, grocery list, pantry CRUD — was verified
working on production through a temporary no-signup door, which has since been removed at the user's
request.

**Two hosted-only failures were fixed during deploy, neither reproducible locally.** Both are now
migrations so a fresh database cannot repeat them:
- `SUPABASE_SERVICE_ROLE_KEY` had the *publishable* key in it. The admin API answered "This endpoint
  requires a valid Bearer token".
- Tables created through the hosted SQL Editor carry no privileges for `anon`, `authenticated` or
  `service_role`, so every API call failed with "permission denied for table workspaces" — including
  the service role, which bypasses RLS but still needs a GRANT (`0010_api_role_grants.sql`).

**Debugging lesson worth keeping:** four fixes inferred from the symptom were all wrong before a
step-by-step diagnostic was built. The misleading signal was `/api/auth/login` returning "Email or
password is incorrect" for *every* failure by design, which was read as proof Supabase was wired
correctly. Build the probe first next time.

**The no-signup demo door has been removed** (`/api/auth/demo` and its landing-page button). Signup
and login are the only entrances again.

**Left over:** `probe-*@mizfit-demo.app` and `demo-*@mizfit-demo.app` accounts in the Supabase project
from testing; filter by prefix in Authentication → Users.

## Deploying to Vercel — what the app needs

Environment variables (SPEC.md § 11): the three Supabase keys, `NEXT_PUBLIC_APP_URL` set to the
deployed URL, **both `UPSTASH_*` values**, and `AI_MOCK=1`.

- **Upstash is not optional in production.** Rate limiting fails CLOSED there (Rule 10), so with the
  Upstash variables missing every API route answers 429 and nothing works.
- **The Supabase project must have "Confirm email" OFF.** Signup issues the session directly; with
  confirmations on, `signUp` returns no session and the route throws a deliberate 500 naming this cause.
- Set the Supabase *Site URL* to the deployed origin so the password-reset link points at the right host.
- `supabase db push` applies migrations 0001–0007. There is no 0008 in this build.
- Without `RESEND_API_KEY` the app still runs; password-reset emails are logged server-side instead of
  sent, and every other flow is unaffected.

## Where to pick the build back up

In priority order: day regeneration (Prompt 11),
persisting the grocery list (Prompt 12 + its migration), then splitting `chat-shell.tsx` along the
Appendix A file map. `BUILD.md` Prompt 9–12 text still applies as written.
