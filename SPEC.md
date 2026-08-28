# MizFit — App Specification (Hackathon Build, Phase 1)

**This file is the single source of truth for this build.** `CLAUDE.md` governs *how* to build;
this file governs *what*. Where `README.md` or `PRD.md` disagree with this file (stack, palette, tier
limits, chat scope), **this file wins** — they are historical context.

**Name:** MizFit
**Tagline:** "Eat what you have. Look how you want."

**Description:** A pantry-first AI meal planning wellness app. Generates weekly meal plans from what a
user already has at home, prioritizing items closest to expiry, while hitting the user's chosen diet
methodology and calorie/macro targets. Differentiator vs. MyFitnessPal (calorie tracking only) and
Mealime (meal planning without pantry-first logic).

**Target users:** Busy working adults (primarily mid-40s) and families who want structured diets and
reduced food waste / grocery spend.

---

## 1. What a User Can Do (Phase 1 / hackathon scope — 5 things)

1. Sign up / log in (standard form — see § 3 on why auth stays a form).
2. Walk through a single continuous **Mizfit Chat** conversation — from right after account creation
   through their first generated plan — covering: demographics + TDEE calorie target, household
   servings, diet methodology, pantry confirmation (pre-seeded, see § 5), and cuisine preferences.
3. Choose a diet methodology (Carb Cycling, High Protein, Vegetarian, or Pescatarian) and set a calorie
   target via a guided TDEE flow (§ 7), both presented as steps inside the chat.
4. Generate an AI weekly meal plan (Sun–Sat) that prioritizes near-expiry pantry items, follows the
   chosen methodology's macro schedule, and reflects the cuisine preferences picked in step 2 —
   displayed inline in the chat. Breakfast, lunch, and snack are single options per day; **supper has 3
   options per day, and the user picks one.** All meals scale to the servings count set in step 2.
5. Review the plan day-by-day inside the chat; select a supper option and approve the day, or
   regenerate the whole day, then see a grocery gap list — what's needed to complete the week's plan
   that isn't already in the pantry.

---

## 2. Password Policy (stated once — do not restate elsewhere)

> **Minimum 12 characters, containing at least one uppercase letter, one lowercase letter, one number,
> and one symbol.**

- Enforced **server-side** in `/api/auth/signup` and `/api/auth/reset-password` via a single shared Zod
  schema (`src/lib/validation/password.ts`). Client-side validation is display convenience only.
- The signup and reset-password UI copy must state **exactly 12** — no other number appears in any
  user-facing string, helper text, tooltip, or error message.
- `CLAUDE.md` Rule 12 restates this policy and must use the same number. Any future change is made
  here first, then propagated to Rule 12 and the two UI strings — three places, never more.

---

## 3. Mizfit Chat (Phase 1 hackathon scope)

Per PRD § 5.16, the product vision is a persistent conversational UI replacing form wizards app-wide,
with real free-text NLP parsing and a scope guardrail for off-topic messages. For this build we
implement the **same visual/UX pattern with lower build risk**, treating it as additive groundwork
rather than a simplified stand-in.

- Chat bubble UI (AI messages left, user responses right), **Fresh Sage** palette (§ 11). The PRD's
  chat section already uses Fresh Sage and agrees with this build; the interim "Warm Earth" palette is
  superseded and must be disregarded.
- Every step's "AI message" is **templated copy the app displays**, not a live model generation — this
  matches the PRD's own CHAT-8 rule that most chat interactions never call the AI at all.
- User responses are collected via **inline structured controls** (number inputs, tap-chips, buttons,
  checklists) rendered inside the bubble stream — **NOT open free-text parsing.**
- **Deferred:** the free-text input field, NLP intent parsing, the scope-guardrail system prompt, the
  persistent floating-action-button chat accessible from every other screen, camera-based pantry photo
  entry, and real-time ingredient substitution. All are P2+ in the PRD and stay there.
- Each step's expected answer shape is defined once (e.g. "this step expects `{ activity_level: enum }`")
  so the input mechanism (tap today, free text later) stays decoupled from what the step does with the
  answer. This is what makes adding real NLP later additive instead of a rewrite.
- Each step writes its answer to the DB immediately on capture (not just at the end), so a page refresh
  mid-flow resumes from where the user left off rather than restarting — important resilience for a
  live demo. Resume position is tracked in `profiles.onboarding_step`.
- **Auth stays a standard form, not a chat step:** password fields need real autofill/password-manager
  support, and Rule 12 requires server-side auth routes regardless of how the surrounding UI looks. The
  chat begins immediately after account creation.
- **Email verification does not gate the chat.** A user enters and uses the full Mizfit Chat
  immediately after signup — demographics, calorie target, servings, dietary exclusions, methodology,
  pantry confirmation, cuisine — with no blocking wait on the verification email. Verification is
  enforced at exactly one point: `POST /api/mealplan/generate` returns **403** if the user's email is
  unverified. This keeps a live demo moving while still gating the one endpoint that spends money.

### 3.1 Chat step sequence

| # | Step key | AI bubble (templated) | Control | Answer shape | Persists to |
|---|---|---|---|---|---|
| 1 | `welcome` | Greeting + what's about to happen | "Let's go" button | `{}` | — |
| 2 | `demographics` | Asks age, sex, height, weight, goal weight, target date, activity level | Inline number inputs + chips | `{ age, biological_sex, height_cm, current_weight_lbs, goal_weight_lbs, target_date, activity_level }` | `profiles` |
| 3 | `calorie_confirm` | Shows suggested target + "Do you agree with this target, or would you like to update it yourself?" | "Looks good" / "Let me set my own" (override reveals a number input) | `{ calorie_target: number }` | `profiles` |
| 4 | `servings` | "How many people are you cooking for?" | Number input, default 1 | `{ servings_per_meal: number }` | `profiles` |
| 5 | `dietary_exclusions` | "Anything we should avoid?" | Multi-select chips: Nuts / Dairy / Gluten / Soy / Shellfish (none selected = no exclusions) | `{ dietary_exclusions: string[] }` | `profiles` |
| 6 | `methodology` | Diet methodology explainer | Chips: Carb Cycling / High Protein / Vegetarian / Pescatarian | `{ diet_methodology: enum }` | `profiles` |
| 7 | `pantry_confirm` | "Here's what we've stocked your pantry with" | Editable checklist of the 54 baseline items, add/remove inline (no free text on remove; add uses name + quantity + unit inputs) | `{ confirmed: true }` | `pantry_items` |
| 8 | `cuisine` | Cuisine preference explainer | Multi-select chips: Italian, Mexican, Asian, Mediterranean, American comfort | `{ cuisine_preferences: string[] }` | `meal_plans` (on generate) |
| 9 | `generate` | "Ready when you are" | "Generate my week" button — the one real AI call | `{}` | `meal_plans`, `meal_plan_days` |
| 10 | `review` | Per-day card stream | 3 tappable supper-option cards → Approve, or Regenerate | `{ supper_option_index: 0\|1\|2 }` then approve | `meal_plan_days` |
| 11 | `grocery` | Gap list intro | Read-only list (checkable) | — | `grocery_gap_items` |

Servings applies uniformly to every meal in the plan — no per-meal-type variation, no cross-day
leftover tracking. Step 10 unlocks step 11 only once **every** day has an approved supper selection.

---

## 4. Data Model

All tables live in Postgres (Supabase) with **Row-Level Security enabled and workspace-scoped policies**
(`CLAUDE.md` Rule 4). All ids are `uuid default gen_random_uuid()`. All tables carry
`created_at timestamptz not null default now()`; mutable tables also carry `updated_at`.

### 4.1 Enums

| Enum | Values |
|---|---|
| `workspace_role` | `owner`, `member` |
| `profile_sex` | `male`, `female`, `prefer_not_to_say` |
| `activity_level` | `sedentary`, `lightly_active`, `moderately_active`, `very_active`, `extra_active` |
| `diet_methodology` | `carb_cycling`, `high_protein`, `vegetarian`, `pescatarian` |
| `plan_tier` | `free`, `pro`, `elite` |
| `subscription_status` | `trialing`, `active`, `past_due`, `canceled` |
| `meal_plan_status` | `generating`, `ready`, `failed` |
| `day_macro_type` | `high`, `mid`, `low`, `fixed` |

### 4.2 `workspaces` — core spine (Prompt 3)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text not null | Defaults to "<email local part>'s kitchen" |
| `owner_user_id` | uuid not null → `auth.users(id)` on delete cascade | Sole owner in this build |
| `created_at` / `updated_at` | timestamptz | |

### 4.3 `workspace_members` — core spine (Prompt 3)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid not null → `workspaces(id)` on delete cascade | |
| `user_id` | uuid not null → `auth.users(id)` on delete cascade | |
| `role` | `workspace_role` not null default `owner` | Phase 3 adds `member` rows |
| `created_at` | timestamptz | |

`unique (workspace_id, user_id)`. Index on `(user_id)` — every RLS policy resolves membership through
this table. Phase 3's 2-person household is a second row here plus an invite flow; nothing migrates.

### 4.4 `profiles` — core spine (Prompt 3)

Per-person, not per-household (PRD SEC-4: personal tracking data stays private even inside a household).

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK → `auth.users(id)` on delete cascade | |
| `workspace_id` | uuid not null → `workspaces(id)` on delete cascade | |
| `display_name` | text | |
| `age` | int, 13–120 | TDEE input |
| `biological_sex` | `profile_sex` | TDEE input; `prefer_not_to_say` averages both BMR formulas |
| `height_cm` | numeric(5,1) | Stored metric; UI collects ft/in and converts |
| `current_weight_lbs` | numeric(5,1) | Stored imperial; converted to kg for Mifflin-St Jeor |
| `goal_weight_lbs` | numeric(5,1) | |
| `target_date` | date | May be pushed out by the safety clamp |
| `activity_level` | `activity_level` | Multiplier per § 7 |
| `calorie_target` | int | **Recomputed**, not stored once — see § 7 |
| `daily_deficit` | int | Post-clamp effective deficit |
| `estimated_completion_date` | date | Recomputed from the effective calorie target |
| `diet_methodology` | `diet_methodology` | |
| `servings_per_meal` | int not null default 1, 1–12 | Applies uniformly to every meal |
| `dietary_exclusions` | **text[] not null default `'{}'`** | Fixed value set: `nuts`, `dairy`, `gluten`, `soy`, `shellfish`. Empty array = no exclusions. Zod-validated against that set at the API boundary; a **hard constraint** on generation (§ 8.2b) |
| `onboarding_step` | text | Chat resume position (§ 3.1 step key) |
| `created_at` / `updated_at` | timestamptz | |

`calorie_target` and `estimated_completion_date` are recomputed any time the user edits weight, goal
weight, target date, activity level, or overrides the calorie number.

### 4.5 `subscriptions` — core spine (Prompt 3, **not enforced in this build**)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid not null unique → `workspaces(id)` on delete cascade | One subscription per household |
| `tier` | `plan_tier` not null default `free` | |
| `status` | `subscription_status` not null default `trialing` | Created by `handle_new_user` |
| `stripe_customer_id` | text null | Phase 4 seam — unused now |
| `stripe_subscription_id` | text null | Phase 4 seam — unused now |
| `current_period_end` | timestamptz null | Phase 4 seam — unused now |
| `created_at` / `updated_at` | timestamptz | |

No code in this build reads `tier` to gate a feature (`CLAUDE.md` Rule 16).

### 4.6 `pantry_items` — **core spine** (Prompt 3)

Written by the pantry module, **read by meal-plan generation** → 2+ features → Prompt 3 owns it.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid not null → `workspaces(id)` on delete cascade | Household-shared |
| `name` | text not null, ≤120 chars | Free text; never rendered as HTML |
| `quantity` | **numeric(10,2)** not null | Must be numeric, not integer — supports 0.5 lb green beans |
| `unit` | text not null, ≤32 chars | **Free text, not an enum** — the baseline list alone uses lb, gallon, dozen, head, bag, bottle, jar, can, pack, bulb, container, box, each |
| `expiry_date` | date **null** | NULL = permanent staple; **excluded** from spoilage-priority sort, not sorted to either end |
| `is_frozen` | boolean not null default false | True for the 9 baseline proteins; drives the thaw reminder in prep instructions |
| `source` | text not null default `seed` | `seed` or `user` |
| `created_at` / `updated_at` | timestamptz | |

Indexes: `(workspace_id)`, `(workspace_id, expiry_date)` — the spoilage-priority query is
`where workspace_id = $1 and expiry_date is not null order by expiry_date asc`, unioned with the
NULL-expiry staples as a separate unordered set.

### 4.7 `meal_plans` — **core spine** (Prompt 3)

Written by meal-plan generation, **read by grocery-list** → 2+ features → Prompt 3 owns it.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `workspace_id` | uuid not null → `workspaces(id)` on delete cascade | |
| `created_by` | uuid not null → `auth.users(id)` | |
| `week_start_date` | date not null | Always a Sunday; **UTC date**, the next Sunday on or after the current UTC date (§ 4.11) |
| `status` | `meal_plan_status` not null default `generating` | `ready` once all 7 days are written |
| `cuisine_preferences` | **text[] not null default `'{}'`** | Fixed value set: `italian`, `mexican`, `asian`, `mediterranean`, `american_comfort`. Empty array = no preference. From the chat's cuisine-chip step (§ 3.1 step 8); per-week, **not** stored on the profile |
| `diet_methodology` | `diet_methodology` not null | Snapshot at generation time |
| `calorie_target` | int not null | Snapshot at generation time |
| `servings_per_meal` | int not null | Snapshot at generation time |
| `generation_source` | text not null | `ai` or `mock` — makes dev-mode plans identifiable |
| `model_id` | text null | The resolved `AI_MODEL` value; null for mock |
| `schema_version` | int not null default 1 | Lets the JSONB recipe shape evolve without a backfill |
| `error_message` | text null | Set with `status = 'failed'` |
| `created_at` / `updated_at` | timestamptz | |

Partial unique index on `(workspace_id, week_start_date) where status <> 'failed'` — the idempotency
guard against a double-tapped "Generate my week" burning two AI calls.

**Cuisine preference values (the single source — later prompts reference, never restate).**

| Stored value | Chip label (§ 3.1 step 8) |
|---|---|
| `italian` | Italian |
| `mexican` | Mexican |
| `asian` | Asian |
| `mediterranean` | Mediterranean |
| `american_comfort` | American comfort |

These five are the **complete allowed set**. Prompt 10's request validation pins them as a Zod enum —
`z.array(z.enum(['italian','mexican','asian','mediterranean','american_comfort'])).max(5)` — and
`POST /api/mealplan/generate` rejects any other value at the boundary (`CLAUDE.md` Rule 8). An empty
array is valid and means no preference. Adding a cuisine is a change **here first**, then the Zod enum
and the chip labels — three places, never more.

### 4.8 `meal_plan_days` — **core spine** (Prompt 3)

Written by generation, updated by day-by-day review, read by grocery-list → 3 features.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `meal_plan_id` | uuid not null → `meal_plans(id)` on delete cascade | |
| `day_index` | smallint not null, 0–6 | 0 = Sunday |
| `day_macro_type` | `day_macro_type` not null | `high`/`mid`/`low` for carb cycling, `fixed` otherwise |
| `macro_targets` | jsonb not null | Resolved grams/percentages for the day |
| `breakfast` | jsonb not null | **Single** recipe object |
| `lunch` | jsonb not null | **Single** recipe object |
| `snack` | jsonb not null | **Single** recipe object |
| `supper_options` | **jsonb not null** | Array of **exactly 3** recipe objects; regenerated together as a set |
| `selected_supper_index` | **smallint null**, check `in (0,1,2)` | NULL means the day is not approvable yet |
| `approved_at` | timestamptz null | |
| `regenerated_count` | int not null default 0 | |
| `created_at` / `updated_at` | timestamptz | |

`unique (meal_plan_id, day_index)`. Recipe object shape (validated by Zod before insert):
`{ name, cuisine, ingredients: [{ name, quantity, unit, from_pantry: boolean }], options: string[], instructions: string[], macros: { calories, protein_g, carbs_g, fat_g }, servings }`.
`options[]` holds the `OPTIONS:` supporting items — excluded from macros, fed to the grocery gap list.

### 4.9 `grocery_gap_items` — single-feature (Prompt 12)

Only the grocery-list module reads or writes it, so it is **not** spine.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `meal_plan_id` | uuid not null → `meal_plans(id)` on delete cascade | |
| `workspace_id` | uuid not null → `workspaces(id)` on delete cascade | Denormalized so RLS needs no join |
| `name` | text not null | |
| `quantity` | numeric(10,2) null | Null when the source recipe gave no amount |
| `unit` | text null | |
| `source` | text not null | `missing_ingredient` or `options` |
| `is_checked` | boolean not null default false | |
| `created_at` | timestamptz | |

`unique (meal_plan_id, name, unit)` — the aggregation is regenerated, not appended.

### 4.10 Core spine vs. single-feature

| Table | Classification | Touched by | Owned by |
|---|---|---|---|
| `workspaces` | **Core spine** | auth, profile, pantry, meal plan, grocery | Prompt 3 |
| `workspace_members` | **Core spine** | every RLS policy in the app | Prompt 3 |
| `profiles` | **Core spine** | profile/onboarding (write), meal-plan generation (read) | Prompt 3 |
| `subscriptions` | **Core spine** | `handle_new_user` (write), Phase 4 Stripe (read) | Prompt 3 |
| `pantry_items` | **Core spine** | pantry (write), **meal-plan generation (read)**, grocery-list (read, for the gap diff) | Prompt 3 |
| `meal_plans` | **Core spine** | meal-plan generation (write), plan review (read), **grocery-list (read)** | Prompt 3 |
| `meal_plan_days` | **Core spine** | generation (write), review (update), grocery-list (read) | Prompt 3 |
| `grocery_gap_items` | Single feature | grocery-list only | Prompt 12 |

Prompt 3 creates the spine once. No later prompt re-creates, redefines, or duplicates a spine table.

### 4.11 Date handling — UTC dates only

**All date math in this build uses UTC dates only, never timestamps.** Every date-typed column
(`profiles.target_date`, `profiles.estimated_completion_date`, `pantry_items.expiry_date`,
`meal_plans.week_start_date`) is a calendar date in UTC with no time component and no local-timezone
conversion at any layer — database, server, or client.

**Week boundary:** `week_start_date` = **the next Sunday on or after the current UTC date.** If today is
a Sunday, the week starts today. This matches real usage — planning happens Friday or Saturday for the
Sunday–Saturday week ahead, so a Friday-evening session plans the week that starts two days later, not
the week already half-spent.

Baseline pantry expiry offsets (§ 5) are computed at seed time as `CURRENT_DATE + N days` evaluated as a
UTC date, so spoilage-priority ordering is stable regardless of where the user or the database sits.

---

## 5. Baseline Pantry (auto-seeded on account creation)

Every new account gets the same fixed list of **54** `pantry_items` — deliberately generous so a
judge/reviewer can immediately generate a real, varied weekly meal plan without any manual pantry entry
first. `expiry_date` is computed at seed time as `CURRENT_DATE + N days` per the offsets below;
`NULL` = permanent staple, excluded from spoilage-priority sorting since there is nothing to prioritize
against. Same list for every account regardless of chosen diet methodology.

This seeding is part of the `handle_new_user` trigger (Prompt 3) — the same atomic transaction that
creates profile + workspace + workspace_members + trial subscription, not a separate insert the app has
to remember to call.

**Dry staples & oils — no expiry (14)**

| Item | Quantity | Unit |
|---|---|---|
| Salt | 1 | container |
| Black pepper | 1 | container |
| Olive oil | 1 | bottle |
| Vegetable oil | 1 | bottle |
| Garlic powder | 1 | container |
| Onion powder | 1 | container |
| All-purpose flour | 1 | bag |
| Granulated sugar | 1 | bag |
| Baking soda | 1 | box |
| Baking powder | 1 | container |
| Dried oregano | 1 | container |
| Dried basil | 1 | container |
| Soy sauce | 1 | bottle |
| White vinegar | 1 | bottle |

**Dairy & eggs (8)**

| Item | Quantity | Unit | Expires |
|---|---|---|---|
| Butter | 1 | lb | +30 days |
| Margarine | 1 | lb | +30 days |
| 2% milk | 1 | gallon | +5 days |
| Sliced American cheese | 8 | oz pack | +14 days |
| Sliced provolone | 8 | oz pack | +14 days |
| Sliced monterey jack | 8 | oz pack | +14 days |
| Sliced mozzarella | 8 | oz pack | +14 days |
| Eggs | 1 | dozen | +21 days |

**Proteins — all frozen, no expiry (9)** (`is_frozen = true`)

| Item | Quantity | Unit |
|---|---|---|
| Chicken breasts | 2 | lb |
| Ground turkey | 2 | lb |
| Sirloin steaks | 2 | steaks (1 lb each) |
| Ground beef | 2 | lb |
| Tofu | 1 | pack |
| Pork loin | 1 | package |
| Bacon | 1 | pack |
| Bratwurst | 1 | pack |
| Shrimp | 2 | lb |

**Fresh produce (10)**

| Item | Quantity | Unit | Expires |
|---|---|---|---|
| Bell peppers | 3 | each | +10 days |
| Green beans | 0.5 | lb | +6 days |
| Broccoli | 1 | head | +6 days |
| Salad greens | 20 | oz bag | +5 days |
| Squash | 1 | each | +8 days |
| Corn on the cob | 5 | each | +4 days |
| Yellow onions | 3 | each | +30 days |
| Garlic | 1 | bulb | +60 days |
| Potatoes | 5 | lb bag | +30 days |
| Lemons | 4 | each | +14 days |

**Canned goods — no expiry (3)**

| Item | Quantity | Unit |
|---|---|---|
| Black beans | 1 | can |
| Red beans | 1 | can |
| Garbanzo beans | 1 | can |

**Grains — no expiry except bread (4)**

| Item | Quantity | Unit | Expires |
|---|---|---|---|
| White rice | 2 | lb bag | — |
| Spaghetti noodles | 1 | lb box | — |
| Bread | 1 | loaf | +5 days |
| Oatmeal | 18 | oz container | — |

**Sauces & condiments — no expiry (6)**

| Item | Quantity | Unit |
|---|---|---|
| Ranch dressing | 1 | bottle |
| Fish sauce | 1 | bottle |
| Red wine vinegar | 1 | bottle |
| Apple cider vinegar | 1 | bottle |
| Ketchup | 1 | bottle |
| Dijon mustard | 1 | jar |

---

## 6. Routes (must match byte-for-byte across every prompt)

| Area | Method | Path | Notes |
|---|---|---|---|
| Auth | POST | `/api/auth/signup` | Password policy § 2; triggers `handle_new_user` |
| Auth | POST | `/api/auth/login` | |
| Auth | POST | `/api/auth/logout` | |
| Auth | POST | `/api/auth/forgot-password` | Always returns 200 — never reveals whether the email exists |
| Auth | POST | `/api/auth/reset-password` | Password policy § 2 |
| Auth | GET | `/api/auth/callback` | Supabase code exchange (email verification + reset link) |
| Profile | PATCH | `/api/profile` | Demographics, activity level, calorie target, diet methodology, servings. The chat's structured steps call this **incrementally**, not as one final submit |
| Pantry | GET | `/api/pantry` | |
| Pantry | POST | `/api/pantry` | |
| Pantry | PATCH | `/api/pantry/[itemId]` | |
| Pantry | DELETE | `/api/pantry/[itemId]` | |
| Meal plan | POST | `/api/mealplan/generate` | Body includes `cuisine_preferences: string[]`. The only Anthropic call path. **403 if the user's email is unverified** — the single verification gate (§ 3) |
| Meal plan | GET | `/api/mealplan/[planId]` | |
| Meal plan | POST | `/api/mealplan/[planId]/days/[dayId]/select-supper` | Body: `{ supper_option_index: 0\|1\|2 }` |
| Meal plan | POST | `/api/mealplan/[planId]/days/[dayId]/approve` | **400 if no supper option selected yet** |
| Meal plan | POST | `/api/mealplan/[planId]/days/[dayId]/regenerate` | Regenerates breakfast/lunch/snack **and all 3 supper options fresh**, clears any prior selection and `approved_at` |
| Grocery | GET | `/api/grocery-list/[planId]` | Computed from the plan's approved days minus the pantry |
| Health | GET | `/api/health` | Unauthenticated liveness probe; returns no secrets or version detail |

**No `/api/chat/message` in this build** — deferred with the free-text NLP layer (§ 3).

---

## 7. Calorie Target Calculation

**Deterministic — NOT an AI/LLM call.** Reserve AI calls for meal-plan generation only
(`CLAUDE.md` Rule 14). Lives in `src/lib/profile/tdee.ts` as pure functions.

Onboarding collects: age, biological sex (male / female / prefer not to say), height, current weight,
goal weight, target date, activity level (sedentary / lightly active / moderately active / very active /
extra active).

1. **BMR — Mifflin-St Jeor.** Men: `10×weight(kg) + 6.25×height(cm) − 5×age + 5`.
   Women: `10×weight(kg) + 6.25×height(cm) − 5×age − 161`. `prefer_not_to_say` uses the average of both.
2. **TDEE** = BMR × activity multiplier: sedentary 1.2, lightly active 1.375, moderately active 1.55,
   very active 1.725, extra active 1.9.
3. **Required daily deficit** = `(lbs to lose × 3500) / days until target date`.
4. **Suggested calorie target** = TDEE − deficit, clamped to a floor of **1200 kcal**
   (women / prefer-not-to-say) or **1500 kcal** (men), and a **max deficit of 1000 kcal/day**
   (~2 lb/week). If the requested target date would require exceeding either clamp, clamp the calorie
   target instead and recompute an extended target date, shown to the user as:
   *"To keep this safe, we've adjusted your timeline to [date]."*
5. **Confirm or override.** Present the suggested target with: *"Do you agree with this target, or would
   you like to update it yourself?"* A user override runs through the **same clamp** (floor + max
   deficit), with a visible warning if the override was adjusted. The estimated completion date
   recalculates live from whichever calorie target is finally in effect. Presented as a chat bubble with
   two buttons ("Looks good" / "Let me set my own") — the override path reveals an inline number input,
   not free text.

The clamp is a safety boundary, so it is re-applied **server-side** in `PATCH /api/profile`; a client
value is never persisted as-is.

---

## 8. AI Feature — Meal Plan Generation

Meal plan generation is the core differentiator and the **only** endpoint that calls the Anthropic API
in this build. Model id from `AI_MODEL` (default `claude-sonnet-5`).
**Dev mode MUST return mocked plan data and never call the real Anthropic API** (cost control,
non-negotiable). See `CLAUDE.md` Rule 13.

Adapted from the original carb-cycling meal-planning prompt.

### 8.1 Carb Cycling macro schedule (exact values, verbatim)

Applies as **percentages of the user's personalized `calorie_target`** from the TDEE flow, NOT a fixed
calorie number.

| Day | Type | Carbs | Protein | Fat |
|---|---|---|---|---|
| Sunday | High | 45–50% | 25–30% | 20–25% |
| Monday | Mid | 30–35% | 30–35% | 30–35% |
| Tuesday | Low | 10–15% | 40–45% | 35–45% |
| Wednesday | High | 45–50% | 25–30% | 20–25% |
| Thursday | Mid | 30–35% | 30–35% | 30–35% |
| Friday | Low | 10–15% | 40–45% | 35–45% |
| Saturday | Low | 10–15% | 40–45% | 35–45% |

### 8.2 Other three methodologies

**NOT covered by the original prompt (it is carb-cycling-only). Proposed defaults — flagged for Greg to
confirm/adjust rather than treated as extracted fact.**

- **High Protein:** fixed daily target, no cycling — 45% protein / 25% carbs / 30% fat, every day.
- **Vegetarian:** no meat, poultry, fish, or seafood; eggs and dairy allowed. Fixed daily target, no
  cycling — 30% protein / 40% carbs / 30% fat.
- **Pescatarian:** no meat or poultry; fish, seafood, eggs, and dairy allowed. Fixed daily target, no
  cycling — 30% protein / 40% carbs / 30% fat.

**Startup assertion (required).** `src/lib/profile/methodology.ts` asserts at module load that every
fixed macro split above sums to exactly 100 — High Protein 45/25/30, Vegetarian 30/40/30, Pescatarian
30/40/30. A split that does not sum to 100 is a startup failure, not a silently renormalized diet.
Carb cycling (§ 8.1) is expressed as per-day ranges rather than a single three-value split and is not
covered by this assertion; the point values resolved from those ranges for a given day must likewise
sum to 100.

### 8.2b Dietary exclusions — hard constraint

`profiles.dietary_exclusions` (§ 4.4) is a **hard constraint on generation, carrying the same
enforcement weight as the diet methodology's own restrictions.** An excluded category must never appear
in any generated recipe — not in `breakfast`, `lunch`, `snack`, any of the 3 `supper_options`, or the
`OPTIONS:` supporting items.

- Allowed values: `nuts`, `dairy`, `gluten`, `soy`, `shellfish`. An empty array means no exclusions.
- The exclusions are stated in the generation prompt as a prohibition, not a preference — the model is
  told these ingredients are forbidden, alongside the methodology's own restrictions (e.g. Vegetarian's
  "no meat, poultry, fish, or seafood").
- Exclusions apply to the pantry too: a baseline pantry item falling into an excluded category is simply
  not used, and its presence in the pantry is never a licence to include it. The baseline pantry (§ 5)
  contains items in every one of the five categories — shrimp → shellfish; milk, butter, cheese → dairy;
  bread, flour, spaghetti → gluten; soy sauce, tofu → soy.
- Day regeneration (§ 6, `regenerate`) re-applies the exclusions identically; a regenerated day is held
  to the same constraint as the original generation.

**Not a medical safety guarantee.** Model output is validated for shape (`CLAUDE.md` Rule 13), not for
allergen correctness, so the plan view carries the non-medical disclaimer and users are told to check
recipes themselves.

### 8.3 Food usage priorities (verbatim)

Prioritize foods closest to spoilage while maintaining meal quality. For high-quantity pantry items,
spread usage across multiple days rather than dumping it all in one meal. Avoid repeating the same
ingredient as the basis for multiple meals the same day or consecutive suppers. Meals use ONLY
ingredients from the pantry, except: a recipe may reference basic supporting items not in the pantry
labeled `OPTIONS:` (e.g. "OPTIONS: hamburger buns") — these are not counted toward macros/calories and
instead flow into the grocery gap list. Total ingredient usage across the whole week's plan must not
exceed what is in the pantry.

### 8.4 Assumed-always-available seasonings

The tracked no-expiry dry staples (salt, black pepper, garlic powder, onion powder, dried oregano,
dried basil) **plus** this generic additional set, assumed on hand and exempt from pantry depletion
tracking entirely (not modeled as consumable quantities): paprika, ground cumin, chili powder, Italian
seasoning, curry powder, ground cinnamon, ground ginger, crushed red pepper, bay leaves, Cajun/Creole
seasoning, sesame seeds. *(Adapted from the original's personal Penzeys-brand spice list, dropped in
favor of generic names since this is a generic product, not one household's cabinet.)*

### 8.5 Supper: 3 options, substantively unique (verbatim)

Each of the 3 options must feature either a **different main protein** (chicken vs. pork vs. shrimp) or
a **completely different cuisine/preparation style** — a different cooking method alone is not
sufficient. "Blackened Chicken Thighs" vs. "Grilled Chicken Thighs" is **invalid**; "Blackened Chicken
Thighs" vs. "Garlic Shrimp Pasta" vs. "Thai Chicken Curry" is **valid**.

**Precedence (not part of the verbatim rule above).** This requirement is a **level-5 tie-breaker** per
§ 8.6a. When pantry availability (level 3) cannot support three distinct proteins or preparation styles,
levels 1–3 win and uniqueness is **best-effort, not absolute** — the generator gets as close to three
substantively unique options as the pantry allows rather than inventing ingredients it does not have.

### 8.6 Cuisine preference bias (new — not in the original prompt)

Supper options should lean toward the cuisines in `meal_plans.cuisine_preferences` — drawn from the
five pinned values in § 4.7 (`italian`, `mexican`, `asian`, `mediterranean`, `american_comfort`) — while
still satisfying the uniqueness rule above. Three unique options can still all draw from the selected
cuisines; uniqueness is about protein/prep, not abandoning the cuisine preference.

Bias, not constraint: unlike `dietary_exclusions` (§ 8.2b), a cuisine preference is a **preference**. An
empty array means no preference and the generator is unconstrained. A non-empty array never overrides
the methodology's macro schedule, the dietary exclusions, or the spoilage-first pantry rule — if those
cannot be satisfied within the selected cuisines, they win and the preference bends.

### 8.6a Constraint precedence order

When constraints compete, the generator resolves them in this order. **This numbered list is the single
authority on priority** — Prompt 10 implements it directly rather than inferring precedence from the
individual sections. A lower-numbered constraint is never sacrificed to satisfy a higher-numbered one.

1. **Dietary exclusions** (hard — § 8.2b). Never violated, regardless of anything else.
2. **Diet methodology macro targets** (hard — § 8.1 / § 8.2). The day's carb/protein/fat percentages must
   be met.
3. **Pantry availability + spoilage-first ordering** (hard — § 8.3). Use only what is in the pantry,
   prioritizing near-expiry items. `OPTIONS:` supporting items (§ 8.3) remain the sole exception.
4. **Cuisine preference** (soft bias — § 8.6). Applied within whatever recipes already satisfy 1–3. If no
   recipe satisfying 1–3 also matches a preferred cuisine, 1–3 wins and cuisine is dropped for that meal.
5. **Supper uniqueness (§ 8.5) and week-level variety (§ 8.7).** Applied last, as tie-breakers among
   otherwise-valid options.

### 8.7 Week-level variety guardrail

Adapted from the original's per-day version, since only supper has multiple options in this build:
**no single breakfast or lunch recipe repeats more than 2 times across the 7-day week.**

### 8.8 Prep instructions

Detailed enough for someone to actually follow. For any frozen protein (the baseline pantry marks
proteins as frozen, no-expiry), include a thaw-time reminder — e.g. "Thaw chicken breast overnight in
the refrigerator before cooking."

### 8.9 Servings

Every meal (breakfast, lunch, snack, and all 3 supper options) scales to the user's `servings_per_meal`
setting from onboarding. No cross-day leftover tracking and no leftover-confirmation loop — that was a
feature of the original prompt's interactive per-day session model, which does not fit generating the
full week in one call.

### 8.10 Explicitly dropped from the original prompt

The fixed 1,200 kcal/day limit (replaced by the personalized TDEE `calorie_target`), the
ingredient-specific handling notes tied to the original inventory (protein powder, slivered almonds —
none are in the new baseline pantry), the weekly pre-selection/validation workflow (Step 5B), the
interactive leftover-confirmation loop between days, online recipe validation with ★ star-marking, and
the Word/.docx export feature.

---

## 9. PLANS — Tier Limits (the single source; later prompts reference, never restate)

Tiers are **documented, NOT enforced in this build.** Every authenticated user gets full feature access;
no subscription gate is enforced anywhere. The `subscriptions` table (§ 4.5) and the `PLANS` constant
(`src/lib/plans.ts`) exist now so Stripe wiring later is additive, not a rebuild.

| Key | Tier | Price | Planning allowance | Regenerations | Pantry photo uploads / mo | Receipt scanning | PDF export | Enforced in this build? |
|---|---|---|---|---|---|---|---|---|
| `free` | Free | $0 | 1 full week (7 days) / month | 1 per day | 0 | No | No | **No** |
| `pro` | Pro | ~$24.99/mo ($285/yr) | 2 weeks (14 days) / month | 4 per day | 15 | No | Yes | **No** |
| `elite` | Elite | ~$35/mo ($378/yr) | 30 days / month | Unlimited | Unlimited | Yes | Yes | **No** |

Photo uploads and receipt scanning are N/A in this build — there is no photo feature yet (Phase 2/4).
`PLANS` is typed as a frozen constant keyed by `plan_tier`; no other file restates these numbers.

---

## 10. Account Types

One account type for this build, but the schema uses the **workspace pattern** (not raw `user_id`
scoping) — a workspace is a household of one owner for now, so Phase 3's 2-person household accounts
become additive rather than a migration rewrite. See `CLAUDE.md` Rule 5.

---

## 11. Tech Stack (pinned)

- Next.js 15.5.x (App Router), TypeScript 5.7
- Supabase (Postgres + Auth + Storage)
- Tailwind CSS + shadcn/ui
- Upstash Redis (rate limiting)
- Resend (transactional email)
- Anthropic API — model id from `AI_MODEL` env var (use `claude-sonnet-5` unless changed)
- Sentry (optional)
- Vercel (deploy)

**Env vars**
- REQUIRED: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
- FEATURE: `ANTHROPIC_API_KEY`, `AI_MODEL`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`
- OPTIONAL: `SENTRY_DSN`, `AI_MOCK`

**Design direction: Fresh Sage.** These are the **only** palette values in this build — stated once
here, referenced everywhere else (`CLAUDE.md` Rule 17). The earlier "Warm Earth" palette (coral/amber/
cream) is **superseded and must not appear anywhere in the codebase.**

| Token | Hex | Use |
|---|---|---|
| Background | `#F8FAF5` | Page background |
| CTA / primary | `#5B8C3E` | **Large/bold text, icons, borders only** — see the contrast rule below |
| CTA / primary (darkened) | `#4D7735` | **Fill for any solid button carrying normal-size text** |
| Tint | `#EDF5E4` | Surfaces, cards, chat bubbles |
| Text | `#2C3E2D` | Body copy |
| Muted | `#6B8A6D` | Secondary text — same restriction as base CTA |

**Contrast rule (the reason two greens exist).** Base CTA `#5B8C3E` on white is **3.99:1** — it clears
WCAG AA's 3:1 threshold for large/bold text, icons, and UI borders, but **fails the 4.5:1 minimum for
normal-size text.** The darkened variant `#4D7735` on white is **5.24:1** and is therefore the fill for
any solid button whose label is normal-size text. Never put normal-size white text on `#5B8C3E`.

**The same restriction applies to Muted `#6B8A6D`** — **3.83:1** with white. Large/bold text, icons, and
borders only; never normal-size white text on it.

**Verified accessible pairings — stated as fact, not to be re-derived or recalculated:**

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| Text `#2C3E2D` | Background `#F8FAF5` | **10.90:1** | Passes AA and AAA |
| Text `#2C3E2D` | Tint `#EDF5E4` | **10.24:1** | Passes AA and AAA |
| White `#FFFFFF` | Darkened CTA `#4D7735` | **5.24:1** | Passes AA for normal-size text |
| White `#FFFFFF` | Base CTA `#5B8C3E` | **3.99:1** | Large/bold, icons, borders **only** |
| White `#FFFFFF` | Muted `#6B8A6D` | **3.83:1** | Large/bold, icons, borders **only** |

Prompt 2b implements exactly these pairings. It does not invent new colour combinations, and it does not
re-derive these ratios.

---

## 11a. Accessibility — WCAG 2.1 Level AA + Section 508

**This build targets WCAG 2.1 Level AA and US Section 508 conformance.** These are hard requirements on
Prompt 2b (design system and UI primitives), and every later prompt that renders UI inherits them.

Non-negotiables:

1. **Never convey information by colour alone.** Every state carried by colour — expiring pantry items,
   approved days, validation errors, selected supper option — is paired with an icon or a text label.
   (WCAG 1.4.1; Section 508 § 502.3)
2. **Visible focus indicators**, at **≥ 3:1** contrast against adjacent colours. Never `outline: none`
   without an equally visible replacement. Every interactive element is keyboard-reachable and shows
   where focus is. (WCAG 2.4.7, 1.4.11)
3. **Every form input has a programmatically associated label** — a real `<label for>` or an equivalent
   `aria-label` / `aria-labelledby`. **A placeholder is not a label**: it disappears on input and is not
   reliably announced. This covers every chat step control (§ 3.1) as well as the auth forms.
   (WCAG 1.3.1, 3.3.2; Section 508 § 502.3)
4. **Contrast comes from the verified table in § 11** — Prompt 2b implements those pairings and the
   large/bold-only restrictions on `#5B8C3E` and `#6B8A6D`. It does not invent new pairings.

---

## 12. Explicitly Out of Scope for This Build

Documented for later, not built now: Keto/Vegan methodologies, 2-person household accounts,
photo/receipt pantry scanning, exercise tracking, Apple Health / Google Health Connect, Stripe billing
enforcement, grocery store API integrations, push notifications, legal/GDPR pages, CI/CD pipeline,
automated tests, free-text NLP chat parsing, the chat scope-guardrail system prompt, the persistent
cross-app chat FAB, real-time ingredient substitution via chat, mobile-responsive breakpoints (falls
under the Polish tail phase, already deferred — the demo target is a desktop browser via Vercel; nothing
about building on Next.js/Supabase now blocks a dedicated mobile app or a later responsive/PWA pass,
since the API routes and schema are reusable by any client), the weekly pre-selection/validation
workflow, interactive per-day leftover confirmation, AI-assisted online recipe validation/star-marking,
Word/.docx export, daily consumption logging, barcode scanning, weight and water tracking, social
sharing, two-factor authentication (2FA), and Google OAuth sign-in.

These are Phase 2–4 per the product roadmap, not cut for good.

---

## Appendix A — Build File Map

Grouped by the prompt that creates each file. Later prompts add to these files but never re-create a
file an earlier prompt owns.

### Prompt 1 — Spec validation & project setup
- `CLAUDE.md`
- `SPEC.md`

### Prompt 2a — Project scaffold & configuration
- `package.json`, `tsconfig.json`, `next.config.ts`, `.eslintrc.json`, `.prettierrc`
- `.env.example`
- `src/env.ts` (Zod-validated env loading, server/client split)
- `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/supabase/middleware.ts`
- `src/lib/plans.ts` (the `PLANS` constant — numbers from § 9)
- `src/types/database.ts` (generated Supabase types)
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

### Prompt 2b — Design system (Fresh Sage) & UI primitives
Implements the § 11 palette and the § 11a accessibility requirements (WCAG 2.1 AA + Section 508).
- `tailwind.config.ts`, `components.json`
- `src/lib/utils.ts`
- `src/components/ui/*` (button, input, card, chip, checkbox, dialog, label, badge, skeleton, toast)
- `src/components/brand/logo.tsx`

### Prompt 3 — Database schema, RLS, triggers, baseline seed (core spine)
- `supabase/migrations/0001_enums.sql`
- `supabase/migrations/0002_workspaces.sql` — `workspaces`, `workspace_members` + RLS
- `supabase/migrations/0003_profiles.sql` — `profiles` (all TDEE fields) + RLS
- `supabase/migrations/0004_subscriptions.sql` — `subscriptions` + RLS
- `supabase/migrations/0005_pantry_items.sql` — `pantry_items` + RLS + indexes
- `supabase/migrations/0006_meal_plans.sql` — `meal_plans` (incl. `cuisine_preferences text[]`), `meal_plan_days` + RLS + indexes
- `supabase/migrations/0007_handle_new_user.sql` — atomic trigger: profile + workspace + workspace_members + trial subscription + 54 baseline pantry items
- `supabase/seed/baseline_pantry.sql` (the 54 rows, § 5)
- `src/lib/db/queries.ts` (shared typed accessors for spine tables)

### Prompt 4 — Security utilities
- `src/lib/security/rate-limit.ts` (Upstash buckets; fail-open dev / fail-closed prod)
- `src/lib/security/ownership.ts` (`assertWorkspaceOwnership`, `getActiveWorkspace`)
- `src/lib/security/api-handler.ts` (`withApiHandler`: method → auth → rate limit → validate → ownership → handler → typed error)
- `src/lib/security/errors.ts` (error codes + safe client mapping)
- `src/lib/validation/password.ts` (the § 2 policy, shared by signup and reset)
- `src/lib/validation/common.ts` (uuid, date, bounded-number, bounded-text schemas)

### Prompt 5 — Auth (six routes + form UI)
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/lib/auth/schemas.ts`, `src/lib/auth/email.ts` (Resend)
- `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`
- `src/components/auth/auth-form.tsx`, `src/components/auth/password-field.tsx` (UI copy states **12** characters)

### Prompt 6 — App shell, session middleware, health
- `middleware.ts` (session refresh + route protection)
- `src/app/(app)/layout.tsx`, `src/app/(app)/error.tsx`, `src/app/not-found.tsx`
- `src/app/api/health/route.ts`
- `src/components/shell/app-header.tsx`, `src/components/shell/nav.tsx`

### Prompt 7 — Mizfit Chat UI shell & step engine
- `src/app/(app)/chat/page.tsx`
- `src/components/chat/chat-shell.tsx`, `chat-bubble.tsx`, `chat-stream.tsx`, `chat-typing.tsx`
- `src/lib/chat/steps.ts` (ordered step registry + per-step answer shape, § 3.1)
- `src/lib/chat/copy.ts` (all templated AI bubble copy — no model calls)
- `src/lib/chat/use-chat-flow.ts` (resume from `profiles.onboarding_step`, persist-on-capture)
- `src/components/chat/controls/{number-input,chip-select,multi-chip-select,button-row,checklist}.tsx`

### Prompt 8 — Profile / onboarding module (TDEE + diet methodology)
- `src/app/api/profile/route.ts` (**PATCH `/api/profile`**, incremental)
- `src/lib/profile/tdee.ts` (BMR, TDEE, deficit, clamps, extended completion date — pure)
- `src/lib/profile/methodology.ts` (macro schedules from § 8.1–8.2)
- `src/lib/profile/schemas.ts` (Zod, one per chat step)
- `src/components/chat/steps/demographics-step.tsx`
- `src/components/chat/steps/calorie-confirm-step.tsx` (confirm / override + clamp warning)
- `src/components/chat/steps/servings-step.tsx`
- `src/components/chat/steps/dietary-exclusions-step.tsx`
- `src/components/chat/steps/methodology-step.tsx`

### Prompt 9 — Pantry module
- `src/app/api/pantry/route.ts` (**GET, POST `/api/pantry`**)
- `src/app/api/pantry/[itemId]/route.ts` (**PATCH, DELETE `/api/pantry/[itemId]`**)
- `src/lib/pantry/queries.ts` (spoilage-priority ordering; NULL expiry excluded)
- `src/lib/pantry/schemas.ts`
- `src/app/(app)/pantry/page.tsx`
- `src/components/pantry/pantry-list.tsx`, `pantry-item-row.tsx`, `add-item-form.tsx`, `expiry-badge.tsx`
- `src/components/chat/steps/pantry-confirm-step.tsx`

### Prompt 10 — Meal-plan generation module (the AI feature)
- `src/app/api/mealplan/generate/route.ts` (**POST `/api/mealplan/generate`**, body includes `cuisine_preferences: string[]`)
- `src/app/api/mealplan/[planId]/route.ts` (**GET `/api/mealplan/[planId]`**)
- `src/lib/ai/client.ts` (Anthropic client; model id from `AI_MODEL`; **dev-mode mock gate**)
- `src/lib/ai/mock-plan.ts` (deterministic 7-day fixture, 3 supper options per day)
- `src/lib/ai/plan-prompt.ts` (system + user prompt: pantry, spoilage priority, methodology macros, cuisine bias, servings, **dietary exclusions as a hard prohibition (§ 8.2b)**, 3-unique-suppers rule, week-level variety guardrail, thaw reminders, `OPTIONS:` convention)
- `src/lib/ai/plan-schema.ts` (Zod validation of model output before any write)
- `src/lib/mealplan/generate.ts` (orchestration: snapshot profile → build prompt → call → validate → persist plan + 7 days)
- `src/components/chat/steps/cuisine-step.tsx`
- `src/components/chat/steps/generate-step.tsx`

### Prompt 11 — Plan review: select supper, approve, regenerate
- `src/app/api/mealplan/[planId]/days/[dayId]/select-supper/route.ts` (**POST**, body `{ supper_option_index: 0|1|2 }`)
- `src/app/api/mealplan/[planId]/days/[dayId]/approve/route.ts` (**POST**, 400 if nothing selected)
- `src/app/api/mealplan/[planId]/days/[dayId]/regenerate/route.ts` (**POST**, regenerates all four slots, clears selection + approval)
- `src/lib/mealplan/regenerate-day.ts`
- `src/components/mealplan/day-card.tsx`, `meal-slot.tsx`, `supper-option-card.tsx`, `macro-pills.tsx`, `day-actions.tsx`

### Prompt 12 — Grocery gap list
- `supabase/migrations/0008_grocery_gap_items.sql` (single-feature table + RLS)
- `src/app/api/grocery-list/[planId]/route.ts` (**GET `/api/grocery-list/[planId]`**)
- `src/lib/grocery/compute-gap.ts` (plan ingredients + `OPTIONS:` items − pantry, aggregated by name + unit — pure)
- `src/components/grocery/gap-list.tsx`, `gap-item-row.tsx`
- `src/components/chat/steps/grocery-step.tsx`

### DEFERRED — no files in this build
Stripe / billing enforcement · Legal & GDPR pages · Polish (incl. mobile responsive breakpoints) ·
Testing & CI/CD · everything in § 12.


---

## Appendix B — Prompt 1 Spec-Validation Gap Analysis (29 gaps)

Preserved verbatim as generated during Prompt 1 (commit `b655a0c`), which produced it as output but
never committed it. This is a **historical record of the validation pass** — it is not a live
specification. Where a row's suggested resolution differs from the body of this document, **the body
wins** (`CLAUDE.md` Rule 1).

**Status notes.** The rows below are left unedited as the original record; resolutions are tracked here.

- **G-01 — RESOLVED.** Vegetarian split corrected to 30% protein / 40% carbs / 30% fat in **§ 8.2**; the
  OPEN ITEM is withdrawn and the sum-to-100 startup assertion G-01 recommended is now a requirement
  there.
- **G-03 — RESOLVED (both halves).** The row's palette framing is now **backwards**: it lists the PRD's
  "Fresh Sage" palette as a contradiction to be disregarded, but Fresh Sage is the **confirmed final
  palette** (**§ 11**), and the interim "Warm Earth" palette is what is superseded. The PRD's chat
  section therefore agrees with this build rather than contradicting it. The row's second half —
  `README.md` pinning React + Vite + Express — is also closed: README's stack table now reads Next.js
  15.5.24 (App Router) + TypeScript for both frontend and backend, matching **§ 11**.
- **G-06 — RESOLVED.** Email verification does not gate the chat; it is enforced only at
  `POST /api/mealplan/generate`, which returns 403 for an unverified user. See **§ 3** (chat bullet) and
  **§ 6** (route note).
- **G-10 — RESOLVED, and pulled into Phase 1 scope.** `profiles.dietary_exclusions text[]` added in
  **§ 4.4**, collected by a new multi-select chat step (**§ 3.1**, step 5 — after servings, before
  methodology), and enforced as a hard generation constraint in **§ 8.2b**. No longer deferred.
- **G-22 — RESOLVED.** All date math uses UTC dates only, never timestamps, and `week_start_date` is the
  next Sunday on or after the current UTC date. See **§ 4.11** and the **§ 4.7** column note.

**Verdict: buildable, with one blocking correctness bug and a set of security/scale decisions that must be settled before Prompt 3 freezes the schema.** The spec is unusually well-scoped for a hackathon build — routes are enumerated, the AI prompt is extracted with provenance, the deferred list is explicit, and the workspace pattern is chosen up front. What's missing is mostly the *how-safe* layer, not the *what*.

| Gap | Why it matters | Suggested resolution |
|---|---|---|
| **G-01 Vegetarian macro split is arithmetically impossible** — 20% protein / 45% carbs / **60% fat** = 125% | Blocking. Prompt 10 encodes these as percentages of `calorie_target`; 125% either overshoots calories by a quarter or gets silently renormalized into a diet nobody chose | Flagged inline in SPEC.md § 8.2 as an OPEN ITEM. Working assumption **20/45/35** pending Greg's confirmation; Prompt 10 must not ship until confirmed. Add a startup assertion that every methodology's three values sum to 100 |
| **G-02 Tier limits are incomplete** — draft gives Free "1 week/month" and photo counts, but no Pro/Elite planning allowance or regeneration limits | `PLANS` is meant to be the constant Stripe later reads. An incomplete constant gets "filled in" differently by each future prompt | Reconciled against PRD § 5.11 into the single PLANS table (SPEC.md § 9): Free 7 days / 1 regen per day, Pro 14 days / 4, Elite 30 days / unlimited. Numbers exist in exactly one place |
| **G-03 Doc drift** — `README.md` pins React + Vite + Express; PRD § 5.15 pins the "Fresh Sage" palette; both contradict the build | Later prompts read whichever file they hit first and produce a hybrid codebase | SPEC.md declares itself the single source of truth and names both contradictions explicitly; CLAUDE.md Rule 1 repeats it. README should be corrected separately |
| **G-04 RLS policy shape and service-role boundary undefined** | The spec requires the service-role key but never says where it may be used. One convenience call to `admin` inside a route silently disables multi-tenant isolation | CLAUDE.md Rules 4/9/11: policies in the same migration as the table, workspace-scoped through `workspace_members`, service-role limited to `handle_new_user`, `import 'server-only'` on any file touching it |
| **G-05 Password policy absent from the draft** | Signup would ship with Supabase's 6-char default | SPEC.md § 2 states it once — 12 chars, upper/lower/number/symbol — with a note that the two UI strings and CLAUDE.md Rule 12 use that exact number |
| **G-06 Email verification gate undefined** — PRD AUTH-2 requires it; the spec has `/api/auth/callback` but never says whether an unverified user can reach the chat | Determines whether onboarding starts before or after the email round-trip. Ambiguity here breaks the demo flow at the worst moment | Decide now. Recommendation for a judged demo: allow the chat immediately after signup, require verification before generation. Must be stated in SPEC before Prompt 5 |
| **G-07 Rate-limit budgets undefined** — Upstash is in the stack with no limits attached to any route | `/api/mealplan/generate` is an unauthenticated-cost vector: one logged-in user in a loop is real Anthropic spend | CLAUDE.md Rule 10 defines the policy (per-user, per-route buckets; strictest on AI routes; fail-open dev / fail-closed prod). Prompt 4 must set concrete numbers — suggest 5 generations/hour, 20 regenerations/hour |
| **G-08 Forgot-password enumeration and token reuse** | A differing response for known vs unknown email leaks the user list; reset links that survive use are a takeover path | SPEC.md § 6 marks `/api/auth/forgot-password` as always-200. Prompt 5 must single-use the reset token and rate-limit the route separately |
| **G-09 AI output is treated as trusted** — the spec describes the prompt in detail but never says what happens to a malformed response | Model output flows straight into JSONB and then into the UI. Pantry item names are free text, so they are also a prompt-injection surface | CLAUDE.md Rule 13: Zod-validate model output before any write, no partial writes, never render recipe text as HTML. Rule 8 caps pantry name/unit length |
| **G-10 Dietary exclusions / allergies omitted** — PRD PROF-7 is P1; the spec has no field for them | This is the one genuinely unsafe omission. The AI will confidently plan shrimp for someone with a shellfish allergy, and the baseline pantry contains shellfish, pork, dairy, gluten, and soy | Either add `profiles.dietary_exclusions text[]` now (nullable, no Phase 1 UI) so Phase 2 is additive, **or** state the omission plus a visible "review every recipe for allergens" line in the plan UI. Do not ship silently |
| **G-11 No health-claim disclaimer, and the calorie clamp's enforcement point is unstated** | PRD COMP-1/2 — the app is not a medical device. The 1200/1500 floor and 1000 kcal max deficit are safety boundaries; if only the client applies them, an override bypasses them | CLAUDE.md Rule 14 + SPEC § 7: clamp re-applied server-side in `PATCH /api/profile`. Add a one-line non-medical disclaimer to the plan view |
| **G-12 PII in logs / Sentry** | Age, sex, weight, and goal weight are health data and will land in error payloads by default | Scrub `profiles` fields before send; never log request bodies for `/api/profile` |
| **G-13 Account deletion / cascade** — PRD COMP-5 | Even deferred, the FK cascade decision is made now and is expensive to retrofit | All workspace-scoped FKs are `on delete cascade` (SPEC § 4). The deletion *UI* stays deferred |
| **G-14 Session, CSRF, and protected-route strategy unstated** | Every route's auth check is otherwise invented per-prompt | CLAUDE.md Rule 12 + Prompt 6's `middleware.ts`: `@supabase/ssr` cookie sessions, refresh in middleware, all `(app)` routes gated |
| **G-15 Generation latency vs. serverless timeout** — PRD PERF-1 targets <30s; a 7-day plan with 3 supper options per day is a large generation | A Vercel function timeout mid-generation is the single most likely live-demo failure | `meal_plans.status` (`generating`/`ready`/`failed`) + `error_message` exist in the schema (SPEC § 4.7). Prompt 10 sets `maxDuration` explicitly and the UI polls rather than blocking on the response |
| **G-16 No idempotency guard on generate** | Double-tapping "Generate my week" creates two plans and two AI charges | Partial unique index on `(workspace_id, week_start_date) where status <> 'failed'` (SPEC § 4.7), plus a disabled button during flight |
| **G-17 Regenerate has no ceiling and is undefined on an approved day** | Each regenerate is a second AI call. Behaviour on an already-approved day is unspecified, so two prompts will implement it differently | SPEC § 6: regenerate clears `selected_supper_index` **and** `approved_at`. `regenerated_count` is tracked; the rate-limit bucket is the cost ceiling |
| **G-18 No index plan** — PRD SCALE-5 calls it out as a prior-prototype failure | Spoilage-priority sorting and per-plan day lookups are the hot paths | SPEC § 4.6/4.8: `(workspace_id)`, `(workspace_id, expiry_date)`, `unique (meal_plan_id, day_index)`, `(user_id)` on members |
| **G-19 JSONB recipe shape is unversioned** | The recipe object will change in Phase 2 and old rows become unparseable | `meal_plans.schema_version int default 1` (SPEC § 4.7) |
| **G-20 Pantry depletion is asserted but not modeled** — "total usage across the week must not exceed what's in the pantry" is enforced only inside one prompt | Regenerating a day breaks the week-level guarantee, because the new day is generated without knowledge of the other six days' consumption. Quantities are never decremented, so a second week plans against a full pantry | Document the limitation explicitly: Phase 1 does no consumption accounting, and day regeneration is best-effort against the cap. The Phase 2 seam is a `pantry_consumption` ledger — name it in SPEC so it isn't invented ad hoc |
| **G-21 Grocery gap diff has no unit-normalization rule** | The pantry holds "1 bottle olive oil"; a recipe wants "2 tbsp". A naive diff will put olive oil on the shopping list every week | Prompt 12 matches on normalized name first and only compares quantity when units match; unmatched-unit items are treated as present. State the rule in `compute-gap.ts`, aggregate on `(name, unit)` |
| **G-22 Timezone / week boundary undefined** | `CURRENT_DATE + N` at seed time runs in the DB's timezone; "Sun–Sat" needs an anchor. A user near midnight sees wrong expiry ordering, and a Saturday-evening demo could seed a week that starts yesterday | Pin all date math to UTC dates (no timestamps) and define `week_start_date` as the next Sunday ≥ today. Decide before Prompt 3 writes the trigger |
| **G-23 UI units of measure unspecified** | `height_cm` and `current_weight_lbs` are stored mixed-unit while US users enter ft/in and lbs | SPEC § 4.4: UI collects ft/in, converts to cm at the boundary; conversion lives in `tdee.ts`, not in a component |
| **G-24 AI failure path undefined** — PRD REL-2 requires graceful degradation | An Anthropic 429/500 currently has no defined user-visible behaviour, and a partial write leaves an unrenderable plan | `status = 'failed'` + `error_message`, plan written in one transaction after validation, retry affordance in the generate step |
| **G-25 Photo-scanning groundwork missing** (Phase 2/4) | Pro's "15 photos/month" needs a usage counter, and PRD SEC-7 requires photos be deleted immediately after processing — a Storage bucket with the wrong policy is a privacy incident | No bucket in this build. Reserve the seam: a `usage_counters` table keyed by `(workspace_id, metric, period)` is the additive shape, named in SPEC's deferred list rather than invented later |
| **G-26 Household boundary not fully specified** (Phase 3) | The workspace pattern is chosen, but PRD SEC-4 requires each member's *tracking* data to stay private while pantry and plans are shared. If `profiles` were workspace-keyed, Phase 3 becomes a migration | Settled in SPEC § 4.4: `profiles` is keyed by `user_id` (private) with `workspace_id` as an FK; all shared tables are workspace-keyed. `workspace_members.role` enum exists now; the invite table is deferred |
| **G-27 Exercise tracking forecloses on a static `calorie_target`** (Phase 3) | Phase 3 adjusts the daily target from logged exercise. If Prompt 10 reads `profiles.calorie_target` as *the* number, exercise becomes a rewrite | Treat `calorie_target` as the **baseline**; `meal_plans.calorie_target` already snapshots the value used for a given week, so a Phase 3 daily-adjustment layer sits between them additively |
| **G-28 No AI provider abstraction** — PRD SCALE-3 requires the LLM to be swappable | A raw Anthropic SDK call inline in the route makes provider swap a rewrite | CLAUDE.md Rule 13: all calls behind `src/lib/ai/client.ts` with a narrow interface; the mock already proves the seam works |
| **G-29 Four PRD-P1 profile fields silently dropped** — per-meal serving counts (PROF-8), cooking time (PROF-11), skill level (PROF-12), appliances (PROF-13), planning start day (PROF-9) | The spec deliberately simplifies to one uniform `servings_per_meal`, which is the right hackathon call — but it isn't listed in the Out-of-Scope section, so it reads as an oversight rather than a decision | Add them to SPEC § 12's deferred list explicitly. The schema doesn't foreclose them: `servings_per_meal int` widens to a JSONB per-slot map additively |

**29 gaps.** G-01 is blocking (Prompt 10 cannot encode it). G-06, G-10, and G-22 need a decision before Prompt 3/5 freeze the schema and auth flow. The rest are resolved in the two committed files or are documented seams.
