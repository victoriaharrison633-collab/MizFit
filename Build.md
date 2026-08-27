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
