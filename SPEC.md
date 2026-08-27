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

- Chat bubble UI (AI messages left, user responses right), **Warm Earth** palette. The "Fresh Sage"
  palette in the PRD's chat section predates palette finalization and must be disregarded.
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

### 3.1 Chat step sequence

| # | Step key | AI bubble (templated) | Control | Answer shape | Persists to |
|---|---|---|---|---|---|
| 1 | `welcome` | Greeting + what's about to happen | "Let's go" button | `{}` | — |
| 2 | `demographics` | Asks age, sex, height, weight, goal weight, target date, activity level | Inline number inputs + chips | `{ age, biological_sex, height_cm, current_weight_lbs, goal_weight_lbs, target_date, activity_level }` | `profiles` |
| 3 | `calorie_confirm` | Shows suggested target + "Do you agree with this target, or would you like to update it yourself?" | "Looks good" / "Let me set my own" (override reveals a number input) | `{ calorie_target: number }` | `profiles` |
| 4 | `servings` | "How many people are you cooking for?" | Number input, default 1 | `{ servings_per_meal: number }` | `profiles` |
| 5 | `methodology` | Diet methodology explainer | Chips: Carb Cycling / High Protein / Vegetarian / Pescatarian | `{ diet_methodology: enum }` | `profiles` |
| 6 | `pantry_confirm` | "Here's what we've stocked your pantry with" | Editable checklist of the 54 baseline items, add/remove inline (no free text on remove; add uses name + quantity + unit inputs) | `{ confirmed: true }` | `pantry_items` |
| 7 | `cuisine` | Cuisine preference explainer | Multi-select chips: Italian, Mexican, Asian, Mediterranean, American comfort | `{ cuisine_preferences: string[] }` | `meal_plans` (on generate) |
| 8 | `generate` | "Ready when you are" | "Generate my week" button — the one real AI call | `{}` | `meal_plans`, `meal_plan_days` |
| 9 | `review` | Per-day card stream | 3 tappable supper-option cards → Approve, or Regenerate | `{ supper_option_index: 0\|1\|2 }` then approve | `meal_plan_days` |
| 10 | `grocery` | Gap list intro | Read-only list (checkable) | — | `grocery_gap_items` |

Servings applies uniformly to every meal in the plan — no per-meal-type variation, no cross-day
leftover tracking. Step 9 unlocks step 10 only once **every** day has an approved supper selection.

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
| `week_start_date` | date not null | Always a Sunday |
| `status` | `meal_plan_status` not null default `generating` | `ready` once all 7 days are written |
| `cuisine_preferences` | **text[] not null default '{}'** | From the chat's cuisine-chip step; per-week, **not** stored on the profile |
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
| Sirloin steaks | 2 (1 lb each) | package |
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
| Meal plan | POST | `/api/mealplan/generate` | Body includes `cuisine_preferences: string[]`. The only Anthropic call path |
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
  cycling — 20% protein / 45% carbs / 60% fat. **⚠ OPEN ITEM — these three values sum to 125% and cannot
  be encoded as-is.** Prompt 10 must not ship this split until Greg confirms the correction; the working
  assumption pending confirmation is **20% protein / 45% carbs / 35% fat** (fat adjusted, since 20/45
  match the stated intent of a carb-forward vegetarian split). Whatever is confirmed is corrected **here
  first**, then encoded in `src/lib/profile/methodology.ts`.
- **Pescatarian:** no meat or poultry; fish, seafood, eggs, and dairy allowed. Fixed daily target, no
  cycling — 30% protein / 40% carbs / 30% fat.

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

### 8.6 Cuisine preference bias (new — not in the original prompt)

Supper options should lean toward the cuisines selected in the chat's cuisine-chip step, while still
satisfying the uniqueness rule above. Three unique options can still all draw from the selected
cuisines — uniqueness is about protein/prep, not abandoning the cuisine preference.

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

**Design direction:** Warm Earth palette — coral `#D85A30`, amber `#EF9F27`, cream background
`#fdf8f4`, text `#2C2C2A`. The previous pale palette (and the PRD's "Fresh Sage") is rejected.

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
and Word/.docx export.

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

### Prompt 2b — Design system (Warm Earth) & UI primitives
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
- `src/lib/ai/plan-prompt.ts` (system + user prompt: pantry, spoilage priority, methodology macros, cuisine bias, servings, 3-unique-suppers rule, week-level variety guardrail, thaw reminders, `OPTIONS:` convention)
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
