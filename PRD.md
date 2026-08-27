# Mizfit — Product Requirements Document (PRD)

**Version:** 2.0 Revised Draft
**Date:** August 26, 2026
**Author:** Vicki (Solo Founder) + Claude (Thinking Partner)
**Purpose:** Architecture-first prototype for Claude Code development
**Tagline:** *Eat what you have. Look how you want.*

---

## How This Document Is Organized

This PRD covers the full scope of the Mizfit app across 11 sections plus an appendix. Product decisions are organized around the **4-D framework** (Discover → Design → Develop → Deploy), and every feature is tagged to a **phased build plan** so that each phase produces a working, deployable product.

**Phase Legend:**
- **P1** — Build-a-thon target (~3 hours). Deployable to Vercel. Demonstrates the core differentiator.
- **P2** — Core tracking + pantry automation. Makes the app daily-use ready.
- **P3** — Engagement, retention, and household features.
- **P4** — Integrations, monetization infrastructure, and scale readiness.

---

## 1. FAQs

**What is Mizfit?**
Mizfit is a cross-platform mobile wellness app that combines AI-powered meal planning, calorie/nutrition tracking, weight management, and exercise logging into a single subscription. Its core differentiator is *pantry-first meal planning*: the AI builds weekly meal plans from what users already have at home, prioritizing items closest to expiry, reducing food waste and grocery spend while still hitting dietary and calorie targets.

**Who is it for?**
Busy working adults (mid-40s+) and families who want to eat healthier, follow a structured diet, lose weight, and stop wasting food — but lack the time and energy to plan meals, track nutrition, and manage groceries across multiple apps.

**What makes it different from MyFitnessPal or Mealime?**
Neither app starts from the user's actual food inventory. MFP is a calorie tracker that requires manual recipe creation. Mealime is a meal planner that starts from a recipe catalog, not from what's in the fridge. Mizfit combines both domains into one app and adds the pantry-first AI layer — generating meal plans from existing inventory, with built-in spoilage prioritization, grocery gap analysis, flexible per-meal serving sizes, and structured diet methodology support (e.g., carb cycling with specific daily macro targets).

**Is this a medical app?**
No. Mizfit is a consumer wellness and lifestyle app. It is not a regulated medical device. It does not diagnose, treat, or prescribe. It never guarantees weight loss or health outcomes. All dietary guidance is general nutritional information, not medical advice.

**What diet methodologies does it support?**
MVP: Carb Cycling, High Protein, Vegetarian, Pescatarian.
Post-MVP: Keto, Vegan, Low Carb (standalone), and others as identified.

**What is the business model?**
Freemium with three tiers: Free, Pro ($24.99/month), and Elite ($35/month), with annual billing discounts. Details in Section 5.

**What platform?**
Cross-platform mobile (React-based), US market only, English only, always-online with PDF offline support for meal plans.

---

## 2. The Problem

### 2.1 The Pain Narrative (DISCOVER)

It's Tuesday night. Both parents worked all day. There's no meal plan. The fridge has a random assortment of ingredients at various stages of freshness — some bought over the weekend, some left over from last week. Nobody knows what to cook. Everyone's tired. The family wants to eat healthy and follow a diet, but there's no time to plan, no energy to figure out what goes together, and no visibility into what's about to go bad. The result: either a last-minute unhealthy choice (takeout, frozen pizza) or a haphazard meal that wastes half the ingredients in the fridge while the other half expires unseen.

This happens weekly across millions of American households. The stress compounds: wasted food means wasted money, missed diet goals mean frustration, and the cycle of "I'll start eating better next week" repeats indefinitely.

### 2.2 Why Existing Solutions Fail

**MyFitnessPal** excels at calorie/macro tracking and exercise logging but has no meal planning engine. Users must manually create recipes in the app to get per-serving nutritional data. It doesn't know what's in the user's kitchen and doesn't generate meal ideas.

**Mealime** excels at meal planning with recipes and grocery lists, but it works backwards from the Mizfit model: users pick dishes first, then get a shopping list for missing ingredients. It doesn't start from existing inventory, doesn't track what's expiring, and doesn't integrate calorie/weight tracking.

**Neither app** does what Mizfit does: start from the pantry, prioritize waste reduction, generate AI meal plans that hit macro/calorie targets for a specific diet methodology, and then wrap it all in the tracking features users currently need a separate app for.

Users today are forced to choose between paying for multiple apps or stitching together a workflow across Google searches, handwritten lists, and manual data entry. Mizfit consolidates this into one interface and one subscription.

### 2.3 Durability — Will This Survive the Next Model Upgrade? (DISCOVER)

The competitive moat is not "AI generates meal plans" — that capability will commoditize. The moat is the **integrated data loop**: pantry inventory (with multiple low-friction input methods) → spoilage timeline → AI meal generation constrained by diet methodology and macro targets → grocery gap analysis → consumption logging → auto-decrement → weekly re-planning cycle. This loop gets smarter over time (learns user preferences via thumbs up/down feedback, avoids repeating disliked meals, remembers what was purchased and when). Replicating this requires building the full inventory management system, the dietary methodology engine, the feedback loop, and the grocery integrations — not just bolting AI onto an existing tracker.

Additionally, Mizfit offers per-meal serving flexibility (e.g., 1 serving for breakfast, 1 for lunch, 4 for supper) that competitors like Mealime don't provide, and household accounts where two people with different dietary needs share a unified meal plan with accommodations.

---

## 3. Jobs to Be Done and Personas

### 3.1 Primary Persona: The Overwhelmed Household

**Name:** Sarah & Marcus
**Demographics:** Mid-40s, dual-income, two working parents, suburban US
**Cooking skill:** Moderate — can follow a recipe but doesn't improvise
**Shopping pattern:** Weekly grocery run on Saturday, plus 1-2 "emergency" mid-week trips to the local store at higher prices
**Current tools:** Marcus uses MyFitnessPal sporadically for calorie tracking. Sarah googles recipes last-minute. Neither meal plans consistently.
**Diet goals:** Sarah wants to try carb cycling. Marcus wants high protein. Both want to lose weight.
**Core frustration:** Food expires before it's used, they spend money on groceries that go to waste, and they can never stick to a diet because planning meals takes more energy than they have after work.

**Jobs to Be Done:**
1. "Help me know what food I have at home and what's about to go bad, without spending 30 minutes inventorying my kitchen."
2. "Give me a week of meals that use what I already have, match my diet goals, and taste good — not random AI slop."
3. "Tell me exactly what I need to buy to fill the gaps, and make that list easy to shop from."
4. "Track what I actually ate, how many calories/macros I hit, and whether my weight is trending in the right direction."
5. "Let me and my partner share the same meal plan even though we have different dietary needs."

### 3.2 Secondary Persona: The Solo Optimizer

**Name:** Dani
**Demographics:** Late 20s, single, urban apartment, cooking for 1-2
**Cooking skill:** Beginner to moderate
**Shopping pattern:** Shops at Trader Joe's or orders from Instacart 1-2x per week
**Current tools:** MFP for calorie tracking, Pinterest for recipe ideas
**Diet goals:** High protein, macro-focused, wants to optimize body composition
**Core frustration:** Buys fresh ingredients with good intentions, but portions for one person mean half of everything goes bad before it's used. Tired of logging every meal manually into MFP.

**Jobs to Be Done:**
1. "Plan meals that are right-sized for one person so I stop throwing away half a bunch of cilantro every week."
2. "Auto-track the nutrition of meals I actually cook from the app's plan, without manually entering every ingredient."
3. "Give me variety — don't feed me chicken breast and broccoli five days in a row."

---

## 4. Use Cases

### UC-1: First-Time Onboarding and Pantry Setup (P1)

**Trigger:** New user creates account and lands on home screen for the first time.
**Flow:**
1. User completes personal demographic intake: age, sex, height, current weight, goal weight, activity level, desired pace of weight change. App calculates daily calorie and macro targets (TDEE-based, MFP model).
2. User selects diet methodology: Carb Cycling, High Protein, Vegetarian, or Pescatarian.
3. User indicates cooking time availability per meal (Quick: <15 min, Standard: 15-30 min, Full: 30-60 min, Extended: 60+ min) and cooking skill level (Beginner, Intermediate, Advanced). These influence the complexity of AI-generated recipes.
4. User sets per-meal serving counts (e.g., breakfast: 1, lunch: 1, supper: 4) and preferred weekly start day (default: Sunday).
5. User enters dietary exclusions/restrictions (allergies, intolerances, dislikes). The app presents this as a dietary exclusions checklist (dairy-free, gluten-free, nut allergy, shellfish allergy, low-sodium, no red meat, etc.) rather than asking for medical diagnoses. Each exclusion is a toggle. Users can add custom exclusions.
6. User sets up pantry via **grouped onboarding flow**:
   - App presents categories one at a time. Categories are split into two types:
     - **Always-Available Staples** (not quantity-tracked, assumed in stock unless de-selected): Herbs & Spices, Condiments & Sauces, Oils & Vinegars, Baking Staples (salt, sugar, flour, baking powder, etc.). These items are treated as perpetually available by the AI and do not appear in spoilage tracking. Users can de-select any staple they don't have and add custom staples.
     - **Trackable Inventory** (quantity-tracked, subject to spoilage/expiry): Grains & Pasta, Canned Goods, Dairy & Eggs, Proteins (fresh/frozen), Fruits, Vegetables, Beverages, Other.
   - Each category shows a checklist of common American kitchen staples. User checks what they have, unchecks what they don't.
   - Each category has an "Add item not listed" field with AI-powered autocomplete (e.g., typing "gara" suggests "garam masala").
   - For perishable items (proteins, dairy, produce), app prompts for approximate quantity and freshness ("bought today," "a few days old," "getting old").
7. After pantry setup, the app generates and displays two analytical views:
   - **Spoilage Timeline Table**: All trackable inventory items grouped by estimated time until spoilage (2 days, 4 days, 1 week, 1 month, 1-6 months, 6+ months). User can edit any item's spoilage estimate to reflect real-world conditions.
   - **Macronutrient Profile Table**: Pantry items grouped by dominant macro — items where protein, fat, or carbs provide ≥40% of calories, sorted by percentage descending. Helps users understand their pantry's nutritional composition.
8. User reviews these tables and proceeds to meal planning.

**Why this matters:** Pantry onboarding friction is the #1 risk to user retention. The grouped checklist approach is dramatically faster than asking users to type every item individually. The spices/condiments section alone eliminates dozens of items users would otherwise need to enter one by one. The spoilage timeline and macronutrient profile tables give the user immediate visibility into their kitchen's state before the AI starts planning — and the editable spoilage table ensures real-world conditions (summer heat, items left out, faster-than-expected spoilage) are reflected in the plan.

### UC-2: Weekly Meal Planning Session via Mizfit Chat (P1)

**Trigger:** User taps "Plan my week" quick-action in the Mizfit Chat, or initiates planning from a push notification.
**Flow:** This use case is now conducted entirely within the Mizfit Chat conversational UI. See Section 5.16.2 for the detailed step-by-step chat flow. The summary:
1. AI guides user through pantry verification (with inline editable summary).
2. AI displays Spoilage Timeline Table and Macronutrient Profile Table (both editable in-chat).
3. AI asks cuisine preferences (option chips + free text).
4. AI suggests grocery gap-filling items by food group.
5. AI generates 7-day plan with 3 simultaneous supper options per day, streamed within the chat.
6. User selects suppers, approves days, or regenerates — all within the chat.
7. AI presents variety analysis summary.
8. AI generates grocery list and offers PDF download.

All interactions happen in the chat — no form wizards, no separate screens for the planning flow.

### UC-3: Daily Consumption Logging (P2)

**Trigger:** User opens app during or after a meal.
**Flow:**
1. App shows today's planned meals. User taps a meal to log it.
2. If user ate the planned meal as-is: one-tap confirmation. Nutrition data auto-applies from the plan.
3. If user ate something different or skipped a meal: user can search for foods/recipes (by name, barcode scan, or natural language entry) and log what was actually consumed, similar to MFP's food diary.
4. User can also log additional items consumed (drinks, snacks, extras not in the plan).
5. App updates daily calorie/macro dashboard in real-time.
6. End of day: app summarizes planned vs. actual consumption and remaining calorie budget.

### UC-4: Pantry Photo Recognition (P2 — Pro tier with 15/month limit, Elite unlimited)

**Trigger:** User takes a photo of fridge, freezer, or cabinet.
**Flow:**
1. User opens pantry and selects "Scan with camera."
2. App activates device camera. User takes photo.
3. AI analyzes the image and generates a list of identified items with confidence indicators.
4. For items the AI cannot confidently identify (containers of leftovers, unlabeled jars, ambiguous items): AI asks the user "What is this?" with a cropped view of the unidentified item. User types or selects the correct label.
5. User reviews the full list of identified items, edits any mislabeled ones, adds any missed items, and confirms.
6. Confirmed items are added to or updated in the pantry inventory.
7. The photo is processed and then deleted — images are not stored in the database after identification is complete.

### UC-5: Barcode Scanning (P2)

**Trigger:** User wants to add a packaged item to pantry.
**Flow:**
1. User opens pantry and selects "Scan barcode."
2. App activates device camera in barcode scanning mode.
3. User scans the product barcode (UPC/EAN).
4. App queries food database (Open Food Facts → USDA FoodData Central fallback) and returns product name, brand, and nutritional information.
5. User confirms item identity, enters quantity, and the item is added to pantry with nutritional data attached.
6. If barcode is not found: user is prompted to manually enter the item name and key nutritional info (calories, protein, carbs, fat per serving).

### UC-6: Exercise Logging and Calorie Adjustment (P3)

**Trigger:** User completes a workout or wants to log exercise.
**Flow:**
1. User navigates to Exercise section.
2. User logs exercise manually (type, duration, intensity) or syncs from Apple Health / Google Health Connect (which pulls data from Apple Watch, Fitbit, Garmin, etc.).
3. App calculates calories burned (adjusting for user demographics: age, sex, weight).
4. App updates daily calorie budget: "Congratulations! You burned X calories. You may consume X more calories today."
5. App offers popup with quick snack suggestions from the pantry that fit within the adjusted budget, or the user can select "I'll decide later" and manually log food consumed.
6. Exercise history is tracked alongside weight and nutrition data for trend analysis.

### UC-7: Recipe Import via URL (P3)

**Trigger:** User finds a recipe online they want to include in their meal plan.
**Flow:**
1. User pastes a recipe URL into the app's "Import Recipe" field.
2. App fetches and parses the recipe page: title, ingredients, instructions, serving count.
3. AI cross-references ingredients against the nutrition database to generate per-serving calorie/macro data.
4. User reviews the imported recipe, adjusts serving count if needed, and saves it.
5. Saved imported recipes are available for the AI to include in future meal plan generation (if ingredients align with pantry and diet methodology).

### UC-8: Household Account with Differing Dietary Needs (P3)

**Trigger:** Second person joins an existing household account.
**Flow:**
1. Primary account holder invites a second person (max 2 per household).
2. Second person creates their own profile: demographics, calorie targets, diet methodology, dietary exclusions.
3. During meal planning, both users' dietary exclusions and preferences are merged. The AI generates one unified meal plan that accommodates both:
   - If one person is dairy-free and the other isn't: meals are dairy-free by default with optional dairy additions noted.
   - If one person is vegetarian and the other isn't: supper provides a vegetarian base with a protein add-on option for the non-vegetarian.
   - Cuisine preferences must be agreed upon (both users contribute to weekly cuisine selection).
4. Each person has their own individual tracking dashboard: calorie log, macro tracking, weight log, exercise log.
5. Both users can manage pantry, generate grocery lists, and interact with the meal plan.

### UC-9: Weekly Pantry Update and Re-Planning Cycle (P2)

**Trigger:** Start of a new planning cycle (Friday/Saturday for the upcoming week).
**Flow:**
1. App sends push notification: "Time to plan next week's meals! Let's update your pantry first."
2. User opens the pantry update flow. App shows current inventory organized by food group.
3. For each item, the app shows: item name, quantity from last week, estimated remaining quantity (based on meals cooked and logged). User confirms, adjusts, or removes.
4. App flags items approaching expiry: "Your salmon is 5 days old — use it early this week or remove it."
5. User adds new items (purchased since last update) via any input method: typed entry with autocomplete, barcode scan, or photo (tier-dependent).
6. Once pantry is updated, the UC-2 meal planning flow begins.

### UC-10: Receipt Photo Scanning (P4 — Elite only)

**Trigger:** User photographs a grocery store receipt to auto-populate pantry.
**Flow:**
1. User opens pantry and selects "Scan receipt."
2. App activates camera. User photographs the receipt.
3. AI extracts line items from the receipt: item names, quantities, purchase date.
4. AI matches extracted items against the food database to resolve names (e.g., "BNLS CHKN BRST 2.3LB" → "Boneless Chicken Breast, 2.3 lbs").
5. User reviews and confirms the extracted item list. Can edit, add, or remove items.
6. Confirmed items are added to pantry with the purchase date (used for freshness/expiry tracking).
7. Receipt image is deleted after processing — not stored.

### UC-11: Real-Time Ingredient Substitution via Mizfit Chat (P2)

**Trigger:** User is cooking a planned meal and realizes they're missing or have run out of an ingredient.
**Flow:**
1. User opens Mizfit Chat and types: "I ran out of salmon — what can I use for tonight's supper instead?"
2. AI checks current pantry inventory and responds with 2-3 substitute options, each showing: the replacement ingredient, a brief note on how to adjust the recipe, and the precise calorie/macro impact (e.g., "Swap salmon for chicken breast: -35 cal, +2g protein, -4g fat per serving").
3. User selects a substitute by tapping the option.
4. App updates: (a) the recipe for that meal with the substitution, (b) the daily nutrition log to reflect the new calorie/macro values, (c) the pantry inventory (decrement the substitute, restore the original if it was already decremented).
5. If no suitable substitute exists in the pantry, AI responds: "You don't have a great swap on hand — want me to suggest a completely different recipe from what you have, or add something to your grocery list?"

### UC-12: Ad-Hoc Pantry Update via Mizfit Chat (P1)

**Trigger:** User acquires or discards food outside of the weekly planning cycle.
**Flow:**
1. User opens Mizfit Chat and types: "I just bought eggs, milk, and ground turkey" or "The spinach went bad, toss it."
2. AI parses the natural language input and presents a confirmation: "Got it — adding: Eggs, Milk, Ground Turkey. Correct?"
3. User confirms or edits. Items are immediately added to / removed from pantry.
4. All downstream views (pantry screen, meal plan validity, grocery list, spoilage timeline) update in real-time.
5. User can also tap the camera button within the chat to photograph new items for AI-assisted identification (P2, subject to tier photo limits).

---

## 5. Functional Requirements

### 5.1 Authentication and Account Management (P1)

| ID | Requirement | Phase |
|---|---|---|
| AUTH-1 | User can create an account via Google OAuth or email/password | P1 |
| AUTH-2 | Email verification required before account is fully active | P1 |
| AUTH-3 | Password reset via email link | P1 |
| AUTH-4 | Two-factor authentication (2FA) via authenticator app or SMS | P2 |
| AUTH-5 | Login flow mirrors MyFitnessPal in security and UX patterns | P1 |
| AUTH-6 | Multi-tenant database with Row-Level Security (RLS) from day one | P1 |
| AUTH-7 | System supports 2 test accounts from initial deployment for developer testing | P1 |
| AUTH-8 | Household accounts: max 2 persons per household, invite via email | P3 |

### 5.2 Personal Profile and Goal Setting (P1)

| ID | Requirement | Phase |
|---|---|---|
| PROF-1 | User enters demographics: age, sex, height, current weight, goal weight | P1 |
| PROF-2 | User selects activity level (sedentary, lightly active, active, very active) | P1 |
| PROF-3 | User selects desired pace of weight change (e.g., lose 0.5 lb/week, 1 lb/week, 2 lb/week, maintain, gain) | P1 |
| PROF-4 | App calculates daily calorie target using TDEE (Mifflin-St Jeor equation, consistent with MFP approach) | P1 |
| PROF-5 | App calculates daily macro targets based on selected diet methodology | P1 |
| PROF-6 | User selects diet methodology: Carb Cycling, High Protein, Vegetarian, Pescatarian | P1 |
| PROF-7 | User configures dietary exclusions via checklist (dairy-free, gluten-free, nut allergy, shellfish allergy, low-sodium, no red meat, no pork, soy-free, egg-free, etc.) with "Add custom" option | P1 |
| PROF-8 | User sets per-meal serving counts independently (e.g., breakfast: 1, lunch: 1, supper: 4, snack: 1) | P1 |
| PROF-9 | User selects weekly planning start day (default: Sunday) | P1 |
| PROF-10 | All profile settings are persistent and editable at any time from account settings | P1 |
| PROF-11 | User indicates available cooking time per meal (e.g., "15 minutes for breakfast," "30 minutes for lunch," "60 minutes for supper"). AI uses this to constrain recipe complexity. | P1 |
| PROF-12 | User selects cooking skill level (beginner, intermediate, advanced). AI adjusts recipe complexity, technique assumptions, and instruction detail accordingly. | P1 |
| PROF-13 | User indicates available kitchen appliances (oven, stovetop, microwave, air fryer, slow cooker, instant pot, grill, blender, food processor). AI only suggests recipes compatible with owned appliances. | P1 |

### 5.3 Pantry Management (P1 core, P2-P4 automation)

| ID | Requirement | Phase |
|---|---|---|
| PAN-1 | Grouped onboarding pantry setup with categorized checklists of common American kitchen staples. Categories are split into two types: **"Always Available" staples** (spices, seasonings, condiments, oils, vinegars, basic baking supplies) which are assumed present unless user de-selects them, and **trackable inventory** (proteins, dairy, produce, grains, canned goods) which are quantity-tracked and subject to expiry. Users can de-select any always-available item they don't have, and add custom items to either category. Always-available items are editable and re-verifiable at any time. | P1 |
| PAN-2 | Each category allows "Add item not listed" with AI-powered autocomplete | P1 |
| PAN-3 | Perishable items prompt for quantity and freshness level | P1 |
| PAN-4 | All pantry items are editable (name, quantity, freshness) — user override always available | P1 |
| PAN-5 | Manual quick-add for individual items with smart autocomplete | P1 |
| PAN-6 | Barcode scanning via device camera, querying Open Food Facts and USDA FoodData Central | P2 |
| PAN-7 | Photo-based pantry recognition via AI vision (Pro: 15 photos/month, Elite: unlimited) | P2 |
| PAN-8 | AI asks user to identify unrecognized items from photos — never guesses silently | P2 |
| PAN-9 | Receipt photo scanning for auto-populating pantry from grocery purchases (Elite only) | P4 |
| PAN-10 | Expiry/freshness estimation: AI infers typical shelf life by food type when not user-specified | P2 |
| PAN-11 | Auto-decrement pantry after user confirms a planned meal was cooked. User must confirm; never auto-deduct silently | P2 |
| PAN-12 | Daily/mid-week prompt to update consumption: app asks what was eaten, delineated by date and meal slot (breakfast, lunch, supper, snack) | P2 |
| PAN-13 | Weekly pantry update flow with smart memory of prior week's inventory and purchases | P2 |
| PAN-14 | Low-stock and approaching-expiry alerts feed into grocery list and push notifications | P3 |
| PAN-15 | Photos used for pantry recognition are deleted after processing — never stored in database | P2 |
| PAN-16 | Natural language pantry entry: user types "half a bag of spinach, some eggs, chicken breast" and AI parses into structured inventory items | P1 |
| PAN-17 | Voice input button in pantry entry (greyed out / "coming soon" in P1-P2; functional in P3) | P3 |
| PAN-18 | **Spoilage Timeline Table (UI element):** After pantry setup or update, the app displays a visual table grouping all trackable inventory items by estimated time until spoilage (e.g., "Use within 2 days," "Use within 4 days," "Use within 1 week," "1 month+," "6+ months"). This table is **user-editable** — users can adjust any item's spoilage estimate to reflect real-world conditions (bread spoiled faster in summer heat, milk left out, etc.). The AI uses this table to drive meal planning prioritization. | P1 |
| PAN-19 | **Macronutrient Profile Table (UI element):** After pantry setup or update, the app displays a table showing which pantry items are significant sources of each macronutrient. Three columns: "High Protein" (items where protein provides ≥40% of calories), "High Fat" (fat ≥40% of calories), "High Carb" (carbs ≥40% of calories). Sorted by percentage descending within each column. Helps users understand their pantry's nutritional composition and identify gaps before meal planning. | P1 |

### 5.4 AI Meal Planning Engine (P1 core)

| ID | Requirement | Phase |
|---|---|---|
| MEAL-1 | Weekly meal plan generation: 7 days × 4 meal slots (breakfast, lunch, supper, snack) | P1 |
| MEAL-2 | Meal plans constrained by: pantry contents, spoilage priority, diet methodology, daily calorie target, per-meal serving counts, dietary exclusions, cuisine preferences | P1 |
| MEAL-3 | Spoilage prioritization: items closest to expiry are used first while maintaining meal quality | P1 |
| MEAL-4 | Cuisine preference selection before plan generation (Italian, Mexican, Asian, Mediterranean, American comfort, etc.) | P1 |
| MEAL-5 | Grocery gap analysis: AI suggests additional items by food group that would improve the plan, with user selection before final generation | P1 |
| MEAL-6 | Carb Cycling day pattern is fixed and universal: Sun=High, Mon=Mid, Tue=Low, Wed=High, Thu=Mid, Fri=Low, Sat=Low. Macro splits per day type are fixed and non-configurable | P1 |
| MEAL-7 | High Protein methodology: industry-standard macro split (approx. 40% protein, 30% carbs, 30% fat) applied daily | P1 |
| MEAL-8 | Vegetarian methodology: excludes all meat/poultry/fish; ensures complete protein combinations | P1 |
| MEAL-9 | Pescatarian methodology: excludes meat/poultry; allows fish/seafood, dairy, eggs | P1 |
| MEAL-10 | Supper uniqueness rule: all supper options for a given day must feature a different main protein or a completely different cuisine style — different cooking methods on the same protein do not count as unique | P1 |
| MEAL-11 | No bizarre food combinations: AI validates that meals are cohesive (compatible sides, sauces, flavors). "Tuna in a yogurt smoothie" test — if it wouldn't be found in a real cookbook, don't generate it | P1 |
| MEAL-12 | Variety enforcement: no repeat of the same protein, cooking method, or cuisine within a 1-week period for suppers | P1 |
| MEAL-13 | Per-day review with approve/regenerate per meal | P1 |
| MEAL-14 | Regeneration limits by tier: Free = once per day within planning allowance, Pro = up to 4x/day (once per meal slot), Elite = unlimited | P1 |
| MEAL-15 | Thumbs up/down feedback on individual meals. AI stores this and avoids repeating thumbs-down meals; favors thumbs-up patterns | P2 |
| MEAL-16 | Leftover management: when a supper produces leftovers, they are tracked and can be incorporated into subsequent lunches (reheated as-is) or suppers (modified/repurposed) | P2 |
| MEAL-17 | Recipe import via URL: user pastes link, app parses recipe, AI generates nutrition data, recipe is saved for future plan inclusion | P3 |
| MEAL-18 | Household accommodations: when two users in a household have differing dietary needs, AI generates one plan with modifications (dairy-free base + dairy add-on, vegetarian base + protein add-on, etc.) | P3 |
| MEAL-19 | AI references prior weeks' plans to avoid excessive repetition month-over-month | P2 |
| MEAL-20 | Breakfast complexity: simple prep, serves per user's setting. Lunch complexity: simple prep, cold or microwave-reheatable. Supper complexity: multi-ingredient, full cooking. Snack: quick and easy. Meal complexity is further constrained by user's cooking skill level (PROF-12) and available cooking time (PROF-11). | P1 |
| MEAL-21 | **3-option supper presentation:** For each day, the AI generates 3 substantively unique supper options displayed simultaneously. User selects one of the three, or regenerates all three. This prevents the "regenerate and hope" pattern that wastes AI calls and frustrates users. Each option includes full ingredient lists, cooking instructions, and macro/calorie breakdown for comparison. Breakfast, lunch, and snack are generated as single options per day. | P1 |
| MEAL-22 | **Variety analysis (visible to user):** After the full weekly plan is generated, the app displays a variety analysis summary showing: protein distribution across the week, cooking style/method variety, cuisine/flavor profile diversity, carb source variety, and vegetable repetition check. User can review this before finalizing the plan and request adjustments if variety is insufficient. | P1 |
| MEAL-23 | **Macronutrient profile table for pantry analysis:** Before meal plan generation begins, the app shows the user a macronutrient profile of their current pantry (see PAN-19). This helps users understand what their pantry is strong/weak in and informs grocery gap decisions. | P1 |

### 5.5 Nutrition and Calorie Tracking (P2)

| ID | Requirement | Phase |
|---|---|---|
| NUT-1 | Daily food diary: log meals as planned (one-tap confirm) or log alternatives | P2 |
| NUT-2 | Food search by name with autocomplete, powered by nutrition database | P2 |
| NUT-3 | Barcode scan to log packaged foods consumed | P2 |
| NUT-4 | Natural language food logging ("I had a turkey sandwich and a banana") | P2 |
| NUT-5 | Per-meal and daily calorie/macro summary dashboard | P2 |
| NUT-6 | Daily calorie budget shows planned vs. actual vs. remaining | P2 |
| NUT-7 | When AI generates a meal plan, per-serving calorie and macro data auto-attaches to each meal. Nutrition data is cross-checked against a nutrition database (USDA FoodData Central), not solely AI-estimated | P1 |
| NUT-8 | Ingredient swap transparency: when AI substitutes an ingredient (e.g., for a low-sodium diet), show the precise differential ("This swap decreases sodium by 340mg per serving") | P2 |
| NUT-9 | Detailed step-by-step cooking instructions for every recipe in the meal plan, including prep times, cooking times, and thaw reminders for frozen items | P1 |

### 5.6 Weight Tracking (P2)

| ID | Requirement | Phase |
|---|---|---|
| WT-1 | Manual daily weight entry | P2 |
| WT-2 | Weight trend visualization (graph over time) | P2 |
| WT-3 | Progress toward goal weight displayed on dashboard | P2 |
| WT-4 | Weight syncs bidirectionally with Apple Health / Google Health Connect | P3 |

### 5.7 Exercise Tracking (P3)

| ID | Requirement | Phase |
|---|---|---|
| EX-1 | Manual exercise logging: type, duration, intensity | P3 |
| EX-2 | Exercise database with calorie burn estimates by activity type, adjusted for user demographics | P3 |
| EX-3 | Integration with Apple Health (iOS) and Google Health Connect (Android) to sync exercise data from wearables and fitness apps | P3 |
| EX-4 | Exercise calories burned adjust daily calorie budget in real-time | P3 |
| EX-5 | Post-exercise popup: congratulates user, shows adjusted calorie budget, offers AI snack suggestions from pantry or manual entry option ("I'll decide later") | P3 |
| EX-6 | Exercise history log viewable alongside nutrition and weight data | P3 |

### 5.8 Water Tracking (P4)

| ID | Requirement | Phase |
|---|---|---|
| WAT-1 | Daily water intake logging (glasses, oz, or ml) | P4 |
| WAT-2 | Daily water goal with progress indicator | P4 |
| WAT-3 | Water data syncs with Apple Health / Google Health Connect | P4 |

### 5.9 Grocery List (P1 basic, P4 integrations)

| ID | Requirement | Phase |
|---|---|---|
| GROC-1 | Auto-generated grocery list from the gap between approved meal plan and current pantry | P1 |
| GROC-2 | User can manually add/remove items from the grocery list | P1 |
| GROC-3 | Grocery list is viewable and checkable in-app (shopping mode) | P2 |
| GROC-4 | Grocery store app integration: Kroger API (free developer tier) for product search and list sync | P4 |
| GROC-5 | Instacart Developer Platform (IDP) integration for same-day delivery of grocery list items | P4 |
| GROC-6 | Other grocery integrations listed as "Coming Soon": Walmart, Amazon Fresh, Safeway, Giant, Wegmans, Cub Foods (pending API availability / partnership) | P4 |

### 5.10 PDF Export (P2)

| ID | Requirement | Phase |
|---|---|---|
| PDF-1 | Download full week's meal plan as PDF | P2 |
| PDF-2 | PDF format: one page per full day's meals (breakfast, lunch, supper, snack) | P2 |
| PDF-3 | Each page includes: recipes, ingredient lists, step-by-step cooking instructions, macro/calorie breakdown | P2 |
| PDF-4 | Mizfit header/branding on every page — non-editable, non-removable | P2 |
| PDF-5 | Free tier cannot download PDFs; Pro and Elite can. Free users see "Upgrade to download" prompt | P2 |

### 5.11 Subscription Tiers and Monetization (P4 for Stripe; tier gating in P1 via feature flags)

**Free Tier ($0):**
- 1 full week of meal planning per month (7 days)
- 1 meal regeneration per day within planning allowance
- View recipes for planned meals only
- No PDF downloads (prompt to upgrade)
- No photo-based pantry recognition
- No receipt scanning
- Basic calorie/macro tracking

**Pro Tier ($24.99/month, or $285/year — 5% annual discount off $299.88/year):**
- 2 weeks (14 days) of meal planning per month
- Up to 4 regenerations per day (1 per meal slot)
- All key features including calorie tracking, weight tracking, grocery lists
- Photo-based pantry recognition: 15 photos/month
- No receipt scanning
- PDF meal plan downloads
- Thumbs up/down meal feedback for AI memory
- Accepted recipes and meal plans saved for AI reference to avoid repetition

**Elite Tier ($35/month, or $378/year — 10% annual discount off $420/year):**
- Full month (30 days) of meal planning
- Unlimited regenerations
- Unlimited photo-based pantry recognition
- Receipt photo scanning for pantry auto-population
- All Pro features
- Priority AI processing
- Future Elite exclusives: advanced analytics/insights dashboards, AI-powered nutrition coaching tips, integration with wearables for real-time calorie adjustment

| ID | Requirement | Phase |
|---|---|---|
| SUB-1 | Tier-based feature gating via feature flags (enforceable without Stripe in P1) | P1 |
| SUB-2 | Stripe integration for payment processing | P4 |
| SUB-3 | Monthly and annual billing options with tier-specific discounts | P4 |
| SUB-4 | Upgrade/downgrade flow in account settings | P4 |
| SUB-5 | Free tier users see contextual upgrade prompts at feature gates (not intrusive pop-ups) | P2 |

### 5.12 Social Sharing (P3)

| ID | Requirement | Phase |
|---|---|---|
| SOC-1 | Users can share individual recipes from their meal plan via standard OS share sheet (text, link, or image) | P3 |
| SOC-2 | No in-app social network or community feed | — |

### 5.13 Push Notifications (P3)

| ID | Requirement | Phase |
|---|---|---|
| NOTIF-1 | "Time to plan your week" reminder (configurable day, default: Friday) | P3 |
| NOTIF-2 | "Your [item] expires soon — use it this week" expiry alerts | P3 |
| NOTIF-3 | "Log what you ate today" end-of-day reminder | P3 |
| NOTIF-4 | "Update your pantry" weekly reminder before planning cycle | P3 |
| NOTIF-5 | Post-exercise calorie adjustment notification | P3 |
| NOTIF-6 | All notifications are user-configurable (on/off, timing) | P3 |

### 5.14 "Coming Soon" Page (P1)

| ID | Requirement | Phase |
|---|---|---|
| CS-1 | A dedicated "Coming Soon" page accessible from the app's navigation that outlines planned features for future phases | P1 |
| CS-2 | Grouped by category (Pantry Automation, Tracking, Integrations, Social) with brief descriptions | P1 |
| CS-3 | Visually polished — this is a build-a-thon submission and should convey ambition and roadmap clarity | P1 |

### 5.15 Brand Identity and Color Palette (P1)

**App Name:** Mizfit
**Tagline:** "Eat what you have. Look how you want."
**Palette Direction:** Fresh Sage — earthy, grounded, natural. Clean white surfaces with sage-green accents. Food photography provides warmth; the UI stays airy and uncluttered.

**Color Specification:**

| Token | Hex | Usage |
|---|---|---|
| Background | #FAFAF7 | Page/app background — warm white, not clinical |
| Surface / Card | #FFFFFF | Cards, input fields, elevated surfaces |
| Text Primary | #2D3436 | All body text, headings, labels — dark charcoal, not pure black |
| Text Secondary | #6B7B7D | Muted text, metadata, secondary labels, timestamps |
| CTA / Accent | #4A9B7F | Primary action buttons, active nav icons, links, logo accent ("fit" in "Mizfit") |
| CTA Hover | #3D8269 | Button hover/pressed state |
| Accent Tint | #E8F5EF | Light sage tint for backgrounds (macro pills, badges, selected states, subtle highlights) |
| Border | #E8E8E4 | Card borders, dividers, input outlines — warm gray |
| Status Bar / Header | #4A9B7F | Mobile status bar background, header accent strip |
| Success | #4A9B7F | Same as CTA — confirmations, completion states |
| Warning | #D4A843 | Approaching-expiry alerts, low-stock warnings |
| Danger / Error | #C0504D | Expired items, validation errors, allergen warnings |

**Logo Treatment:** "Miz" in Text Primary (#2D3436), "fit" in CTA/Accent (#4A9B7F). Clean sans-serif typeface. No icon/logo mark for MVP — wordmark only.

**Design Principles:**
- White-dominant layouts. Let food photography and recipe imagery provide visual richness.
- Sage green is used sparingly — CTAs, active states, and key UI anchors only. Not splashed across backgrounds or large surfaces.
- Generous whitespace. Cards have soft borders (#E8E8E4), not heavy outlines.
- Macro/nutrition pills use the Accent Tint (#E8F5EF) background with darker sage (#3D7A65) text.
- Nav bar: active icon in CTA (#4A9B7F), inactive icons in Text Secondary (#6B7B7D).

### 5.16 Conversational AI Assistant — "Mizfit Chat" (P1 core, expanding through P4)

The Mizfit Chat is a persistent conversational UI accessible from every screen in the app via a floating action button or dedicated nav tab. It is the primary interface for meal planning, pantry management, and real-time dietary assistance. It replaces the traditional form wizard approach with a unified, natural chat experience.

**Core concept:** The chat guides users through structured workflows (meal planning, pantry updates) via a conversational flow — the AI asks questions, user responds with taps or text, and the system acts on the answers. Between structured sessions, the chat remains available for free-form questions and real-time assistance.

**5.16.1 Chat Interface Requirements**

| ID | Requirement | Phase |
|---|---|---|
| CHAT-1 | Persistent chat accessible from every screen via floating action button or bottom nav tab. Tapping opens the chat overlay/screen; tapping again returns to the previous screen. | P1 |
| CHAT-2 | Chat displays conversation bubbles: AI messages on the left, user messages on the right. Clean, modern chat UI consistent with Fresh Sage palette. | P1 |
| CHAT-3 | **Quick-action prompts:** 3-4 pre-built buttons displayed at the top of a new chat session or when the chat is idle. These are the most common user needs and provide one-tap access. Default set: "Plan my week," "Update pantry," "Log what I ate," "Record my weight." Quick-action set evolves by phase as features are added. | P1 (P1 set: "Plan my week," "Update pantry") |
| CHAT-4 | Quick-action prompts either continue the workflow inside the chat (pantry updates, meal planning) or navigate to the relevant app screen (weight logging, exercise), whichever is the more natural experience for that task. Pantry and meal planning stay in-chat; weight/exercise/calorie logging navigate to their dedicated screens. | P2+ |
| CHAT-5 | Free-form text input field at the bottom of the chat. User can type anything. AI responds conversationally. | P1 |
| CHAT-6 | Camera button in the chat input area. Tapping opens the device camera for photo-based pantry recognition (same flow as UC-4, but initiated from within the chat). Subject to tier-based photo limits. | P2 |
| CHAT-7 | Chat conversation history is **ephemeral** — not stored long-term. When the user closes the chat and reopens it, a fresh session begins. The **outputs** of chat interactions (pantry changes, approved meal plans, weight entries, food logs) are saved to the database permanently. | P1 |
| CHAT-8 | AI is invoked only when genuinely needed. Structured interactions (selecting cuisine checkboxes, confirming pantry item lists, tapping approve/regenerate) are handled client-side without an API call. The AI is called for: free-form text parsing, meal plan generation, ingredient substitution analysis, answering dietary questions, and photo recognition. | P1 |
| CHAT-9 | **Scope guardrail:** If the user asks about topics outside Mizfit's domain (politics, general knowledge, non-food topics), the chat responds politely: "I'm Mizfit — I'm best at helping with meal planning, nutrition, and your pantry! For that question, you'd want to try a general search." The response is warm and brief, not robotic or dismissive. | P1 |
| CHAT-10 | Chat supports inline UI elements within the conversation flow: clickable option chips (cuisine selections, food group toggles), confirmation buttons ("Approve this plan" / "Regenerate"), editable item lists (pantry check/uncheck), and expandable recipe cards. These render inside the chat bubble stream, not as separate screens. | P1 |

**5.16.2 Meal Planning via Chat (replaces UC-2 form wizard)**

The weekly meal planning session is now conducted entirely within the Mizfit Chat. The AI guides the user through each step conversationally:

1. **AI opens:** "Ready to plan your week? Let's start by checking your pantry. Here's what I have from last time — anything changed?"
   → Displays an inline editable pantry summary. User taps to confirm, remove, or add items. Can also type: "I used the chicken, and I bought salmon and broccoli yesterday."

2. **AI shows spoilage timeline:** "Here's what's expiring soonest — I'll prioritize these in your plan."
   → Displays inline Spoilage Timeline Table (editable within chat).

3. **AI shows macro profile:** "Your pantry is strong on protein and carbs but light on healthy fats. Want to add anything to round it out?"
   → Displays inline Macronutrient Profile Table + suggested additions by food group.

4. **AI asks cuisine preferences:** "What sounds good this week? Pick as many as you like, or tell me in your own words."
   → Displays cuisine option chips (Italian, Mexican, Asian, Mediterranean, American comfort, etc.) plus free-text input.

5. **AI generates the plan:** "Here's your week! I'm prioritizing your salmon since it expires Wednesday. For each day, I've got 3 supper options — pick your favorite."
   → Streams the 7-day plan within the chat. Each day shows breakfast, lunch, snack (single option each) and 3 supper options as expandable cards with ingredients, instructions, and macros. User taps to select a supper, approve the day, or regenerate.

6. **AI presents variety analysis:** "Here's how your week looks for variety — protein spread, cooking styles, cuisines."
   → Displays inline variety analysis summary. User can request adjustments.

7. **AI generates grocery list:** "You're all set! Here's your shopping list for the gaps. Want to download your meal plan as a PDF?"
   → Displays grocery list inline. Offers PDF download button.

**5.16.3 Real-Time Ingredient Substitution via Chat**

| ID | Requirement | Phase |
|---|---|---|
| CHAT-11 | User can ask for ingredient substitutions at any time: "I ran out of salmon, what can I use instead for tonight's supper?" | P2 |
| CHAT-12 | AI responds with 2-3 alternatives from the current pantry, showing for each: the substitute ingredient, how to adjust the recipe, and the precise calorie/macro impact of the swap (e.g., "+45 cal, -3g fat, +8g protein"). | P2 |
| CHAT-13 | User selects a substitute. The app updates: (a) the recipe for that meal, (b) the nutrition log for that day, (c) the pantry inventory (decrementing the substitute, restoring the unavailable original if it was already decremented). | P2 |
| CHAT-14 | If no suitable substitute exists in the pantry, AI says so and suggests a grocery run item or a different recipe entirely. | P2 |

**5.16.4 Pantry Updates via Chat**

| ID | Requirement | Phase |
|---|---|---|
| CHAT-15 | User can update pantry at any time via chat: "I just bought eggs, milk, and ground turkey" → AI parses, confirms items, adds to pantry. | P1 |
| CHAT-16 | User can remove items: "The spinach went bad, toss it" → AI confirms and removes from inventory, updates spoilage timeline. | P1 |
| CHAT-17 | User can photograph pantry additions via the chat camera button. Same flow as UC-4 (AI identifies items, user confirms) but within the chat UI. | P2 |
| CHAT-18 | Any pantry change made via chat is immediately reflected everywhere in the app (pantry screen, meal plan validity, grocery list). | P1 |

**5.16.5 Phase-Specific Chat Scope**

| Phase | Chat capabilities |
|---|---|
| P1 | Meal planning conversation (replaces UC-2), pantry updates via text/NLP, quick-action prompts ("Plan my week," "Update pantry"), free-form text with scope guardrail, inline UI elements (option chips, editable lists, recipe cards, approve/regenerate buttons). |
| P2 | Add: camera button for photo-based pantry additions in chat, real-time ingredient substitution with calorie/macro impact, daily food logging via chat ("I had a turkey sandwich for lunch"), quick-actions expand to include "Log what I ate." |
| P3 | Add: quick-actions expand to include "Record my weight" and "Log exercise." Weight and exercise logging navigates to dedicated screens from chat. Recipe sharing via chat. |
| P4 | Add: grocery list push to Kroger/Instacart via chat ("Order my grocery list"). Water logging. |

---

## 6. Non-Functional Requirements

### 6.1 Latency and Performance

| ID | Requirement | Target |
|---|---|---|
| PERF-1 | Meal plan generation (full 7-day plan) | < 30 seconds with streaming progress indicator |
| PERF-2 | Single meal regeneration | < 10 seconds |
| PERF-3 | Barcode scan lookup | < 2 seconds |
| PERF-4 | Photo-based pantry recognition | < 15 seconds |
| PERF-5 | App cold start to interactive home screen | < 3 seconds |
| PERF-6 | Navigation between screens | < 500ms |
| PERF-7 | Pantry search/autocomplete response | < 300ms |

### 6.2 Reliability

| ID | Requirement |
|---|---|
| REL-1 | 99.5% uptime target for backend services |
| REL-2 | Graceful degradation when AI API is unavailable (show cached meal plans, allow manual logging, display error messaging with retry) |
| REL-3 | All user data changes are persisted immediately — no data loss on app close or crash |
| REL-4 | API rate limiting to prevent abuse and cost overruns |

### 6.3 Security

| ID | Requirement |
|---|---|
| SEC-1 | All data in transit encrypted via TLS 1.2+ |
| SEC-2 | All data at rest encrypted in Supabase |
| SEC-3 | Row-Level Security (RLS) on all user data tables from day one |
| SEC-4 | Multi-tenant isolation: no user can access another user's data, including within household accounts (each person sees only their own tracking data; shared data like pantry and meal plans are governed by household membership) |
| SEC-5 | Authentication via Supabase Auth with JWT tokens |
| SEC-6 | 2FA support (P2) |
| SEC-7 | Photos uploaded for pantry/receipt recognition are processed and immediately deleted — never persisted in storage |
| SEC-8 | API keys and secrets stored in environment variables, never in client-side code |
| SEC-9 | OWASP top-10 protections for API endpoints |

### 6.4 Compliance

| ID | Requirement |
|---|---|
| COMP-1 | App is not a medical device and must not make health claims or guarantees |
| COMP-2 | Every AI-generated plan and swap must display factual nutritional differentials, never health promises |
| COMP-3 | Privacy policy and terms of service required before launch (P4) |
| COMP-4 | CCPA compliance for US users (P4) |
| COMP-5 | Data retention policies: user can delete account and all associated data |

### 6.5 Offline Resilience

| ID | Requirement |
|---|---|
| OFF-1 | App is always-online by default — requires internet for all AI features |
| OFF-2 | Downloaded PDF meal plans are viewable offline |
| OFF-3 | If connection is lost mid-session, unsaved user input is preserved locally and synced when connection returns |

### 6.6 Compatibility

| ID | Requirement |
|---|---|
| COMPAT-1 | Cross-platform mobile: iOS 15+ and Android 10+ |
| COMPAT-2 | React-based frontend (React Native or equivalent cross-platform framework) |
| COMPAT-3 | Responsive design for various screen sizes (phone-optimized, tablet-acceptable) |
| COMPAT-4 | Never use "wouter" for routing under any circumstances, including if Replit defaults suggest it |

### 6.7 Scalability

| ID | Requirement |
|---|---|
| SCALE-1 | Supabase (PostgreSQL) as primary database, with architecture that allows future migration to AWS or Azure |
| SCALE-2 | Database schema designed for multi-tenant scale from day one (no "small-app shortcuts" that create migration debt) |
| SCALE-3 | API layer abstracted so LLM provider can be swapped (e.g., Claude → GPT → open-source model) without rewriting the app |
| SCALE-4 | Meal plan generation is asynchronous — does not block the UI thread |
| SCALE-5 | Database indexes on all frequently-queried columns (user_id, pantry item lookups, date ranges) from day one — avoids N+1 query problems discovered in prior prototype |

---

## 7. AI Architecture and Evals (DESIGN + DEVELOP)

### 7.1 Model Selection

**Primary AI Model:** Anthropic Claude (Sonnet tier for cost efficiency; Opus for complex tasks if needed).

**Rationale:** Claude is the founder's primary development tool and thinking partner. The app is being built with Claude Code. Using Claude's API for the AI meal planning engine maintains a single vendor relationship and leverages existing familiarity.

**Model usage by feature:**
- Meal plan generation: Claude API (largest token usage — full pantry context, diet methodology rules, prior feedback, cuisine preferences, household needs)
- Photo-based pantry recognition: Claude vision capability
- Receipt OCR and parsing: Claude vision capability
- Natural language pantry entry parsing: Claude API (lightweight call)
- Recipe URL parsing and nutrition estimation: Claude API + nutrition database cross-check
- Autocomplete and food suggestions: Can use lightweight local/cached approaches to reduce API costs

**Environment gating (CRITICAL):** All Claude API calls must be gated behind environment checks. In development mode, API calls return mock data instantly — no real API credits are burned during development or testing. This is a non-negotiable constraint learned from the prior prototype where real API credits were consumed during dev.

### 7.2 System Prompt Architecture

The AI meal planning engine operates with a structured system prompt that includes:

**Role:** "You are Mizfit, a friendly AI meal planning and nutrition assistant. You help users plan weekly meals from their pantry inventory, track nutrition, and make real-time dietary decisions — all optimized for their diet methodology, calorie targets, and food waste reduction. You communicate conversationally within the Mizfit Chat interface."

**Hard constraints (non-negotiable):**
- Never provide medical advice, diagnose conditions, or guarantee health outcomes
- Never suggest using ingredients the user has not confirmed in their pantry or approved for purchase
- Never generate meal plans that exceed the user's daily calorie target
- Never repeat the same supper protein or cuisine style on consecutive days
- Never create bizarre or incompatible food combinations
- Always prioritize items closest to expiry while maintaining meal quality
- Always respect dietary exclusions absolutely (allergies are safety-critical)
- When substituting ingredients, always show precise nutritional differentials — never make claims like "this is healthier" or "this is better for your condition"
- For carb cycling: macro splits per day type are fixed and must be met within the specified ranges
- Never suggest recipes requiring appliances the user has not indicated they own
- Always respect the user's stated cooking time availability and skill level when selecting recipe complexity
- **Scope guardrail:** Stay within Mizfit's domain (meal planning, nutrition, pantry management, dietary guidance, weight/exercise tracking). For off-topic queries, respond warmly: "I'm Mizfit — I'm best at helping with meal planning, nutrition, and your pantry! For that question, you'd want to try a general search." Do not attempt to answer off-topic questions.

**Soft constraints (optimize for, but can flex):**
- Maximize variety across the week (proteins, cuisines, cooking methods)
- Prefer recipes that are practically cookable (not overly complex for weeknight meals)
- Incorporate thumbs-up patterns; avoid thumbs-down patterns
- When leftover management is active, prefer repurposing leftovers over wasting them

### 7.3 Confidence Thresholds and Safety Lines (DESIGN)

**The one line that must never be crossed:**
Mizfit never guarantees weight loss, health improvement, or medical outcomes. It never recommends specific actions for medical conditions (diabetes, celiac, kidney disease, Crohn's). It provides factual nutritional data and structured meal plans — not medical advice.

**Confidence handling by feature:**

| Feature | High Confidence | Low Confidence | Action |
|---|---|---|---|
| Pantry photo recognition | Item clearly identifiable | Ambiguous item (container, jar, partial view) | Ask user to identify and label. Never guess silently. |
| Barcode scan | Product found in database with full nutrition data | Barcode not found or partial data | Prompt user for manual entry of item name and key nutrition facts |
| Meal plan nutrition accuracy | Nutrition data cross-checked against USDA/database | AI-estimated nutrition without database cross-reference | Flag with "estimated" label; use database values when available |
| Dietary exclusion compliance | Ingredient clearly contains/doesn't contain allergen | Ingredient may contain traces or is ambiguous | Err on the side of exclusion. Note: "This ingredient may contain [allergen] — verify packaging before use." |
| Ingredient substitution | Both original and substitute have verified nutrition data | Substitute nutrition data is AI-estimated | Show differential with "estimated" caveat |

### 7.4 Recipe Quality Controls (DEVELOP)

The prior Claude chat-based workflow used online recipe search to validate AI-generated recipes. The app replaces this with:

1. **Nutrition database cross-check:** Every AI-generated recipe has its per-ingredient nutrition data cross-referenced against USDA FoodData Central. If AI-estimated values differ from database values by >15%, the database values are used.

2. **Cohesion scoring (internal):** The AI is instructed to validate that each meal's components are culinarily compatible. A set of negative-example rules prevents bad combinations (e.g., no fish in sweet dessert contexts, no raw meat suggestions, no mixing incompatible ethnic cuisine elements in a single dish).

3. **Thumbs up/down feedback loop:** Over time, the AI learns from explicit user feedback which meals were hits and which were misses, progressively improving plan quality for each household.

4. **Recipe database integration (future enhancement):** Integration with a curated recipe API (see Section 7.6) to supplement AI-generated recipes with tested, validated recipes that match pantry and diet constraints.

### 7.5 Eval Criteria (DEVELOP)

| Metric | Target | How Measured |
|---|---|---|
| Macro compliance per day | Daily macros within methodology's specified ranges for all generated meal plans | Automated: sum per-meal macros, check against methodology ranges |
| Calorie accuracy | AI-estimated calories per recipe within ±15% of database cross-check | Automated: compare AI estimate vs. USDA database values |
| Dietary exclusion compliance | 100% — zero violations of user-specified exclusions | Automated + red-team testing |
| Pantry photo recognition accuracy | ≥85% of clearly visible, identifiable items correctly labeled | Manual testing with sample photos |
| Barcode scan success rate | ≥90% of US retail barcodes return a match | Automated: track hit/miss rate against Open Food Facts + USDA |
| Meal variety score | No protein or cuisine repeat in consecutive suppers; no more than 2 repeats in a 7-day plan | Automated: analyze generated plans |
| "Tuna in yogurt" rate (bizarre combination rate) | 0% of generated meals flagged as incoherent by human review | Manual review of sample outputs |
| Regeneration rate | Track how often users regenerate (high rate = low plan quality) | Analytics |
| Thumbs down rate | Track ratio of thumbs down to total feedback (target: <15%) | Analytics |

### 7.6 Data Sources and External APIs

**Nutrition Data (accuracy-critical):**

| Source | Use | Cost | Phase |
|---|---|---|---|
| USDA FoodData Central | Primary nutrition cross-check for all recipe ingredients. 400,000+ food entries with validated nutrient profiles. Free API key from fdc.nal.usda.gov. | Free (public domain, no usage limits) | P1 |
| Open Food Facts | Barcode lookup for packaged goods. 3M+ products, crowdsourced. No API key required. Data accuracy varies — use as primary barcode resolver, but cross-check nutrition values against USDA when possible. | Free (open database) | P2 |

**Recipe Data (supplemental):**

| Source | Use | Cost | Phase |
|---|---|---|---|
| Spoonacular | Recipe search, meal planning, and nutrition data. 365,000+ recipes. Includes allergen detection and dietary compliance checking. Free tier: ~150 points/day (not 150 requests — points vary by endpoint; a recipe-with-nutrition call costs multiple points). | Free tier for prototype; paid tiers from ~$29/month for production | Evaluate in P2 |
| Edamam | Recipe search (2.3M+ recipes), nutrition analysis via NLP (type a recipe in natural language, get nutrition breakdown), and food database (900,000+ items). Free tier available for nutrition analysis; recipe API scales to $999/month at full usage. | Free tier for prototype; expensive at scale | Evaluate in P2 |
| TheMealDB | Free recipe database with attribution. Good for supplemental variety, limited in scope. | Free with attribution | Optional P2 |

**Recommendation:** Start with USDA FoodData Central (free, authoritative for nutrition) + Open Food Facts (free, broad barcode coverage) for MVP. Evaluate Spoonacular's free tier in P2 for curated recipe supplementation — its dietary compliance checking and recipe database could significantly improve variety and quality validation.

**Grocery Integrations:**

| Source | Use | Access | Cost | Phase |
|---|---|---|---|---|
| Kroger API | Product search, store locations, product data. Covers Kroger and subsidiary banners (Ralphs, Fred Meyer, King Soopers, Fry's, Smith's, etc.). | Free public developer tier — register at developer.kroger.com | Free | P4 |
| Instacart Developer Platform (IDP) | Same-day grocery delivery, item catalog (nutrition, ingredients), real-time shelf availability. Covers 1,500+ retailers including national and regional chains. | Public API — apply at developer platform. Used by NYT Cooking, WeightWatchers. | Free to apply; revenue-share model TBD | P4 |
| Walmart | Marketplace API exists but is oriented toward sellers, not consumer grocery integration. No public grocery-shopping API for third-party apps. | Not available for consumer grocery integration | N/A | Post-MVP (monitor for changes) |
| Amazon Fresh / Whole Foods | No public API. AWS has confirmed there is no developer API for Amazon Fresh or Whole Foods grocery ordering. | Not available | N/A | Post-MVP (monitor for changes) |
| Safeway / Giant / Wegmans / Cub Foods | No public developer APIs. Would require business partnerships. | Not available | N/A | Post-MVP (pursue partnerships) |

**Recommendation for grocery integrations:** Kroger API (free, covers many banners nationwide) and Instacart IDP (broad retailer coverage, explicitly designed for meal planning apps — WeightWatchers is a launch partner doing exactly what Mizfit would do) are the two viable MVP integrations. All others require partnerships or don't offer APIs.

**Private-Label and Store-Brand Barcode Coverage:**

A known challenge for barcode scanning: private-label / store-brand products (Trader Joe's, Costco Kirkland Signature, Walmart Great Value, Aldi, Target Good & Gather) have lower coverage in free/open databases like Open Food Facts. These are among the most popular grocery items in the US. The MVP free-tier strategy (Open Food Facts + USDA) will miss a meaningful percentage of these products, falling back to manual user entry.

To achieve comprehensive private-label coverage at scale, Mizfit would need to supplement with a commercial barcode/product data API. Options for the operator to evaluate:

| Provider | Coverage | Private-Label Strength | Developer Signup URL | Free Tier | Paid Pricing | Notes |
|---|---|---|---|---|---|---|
| **Chomp** | 900,000+ branded foods, 700,000+ unique UPCs. US grocery focus. | Strong on US branded grocery, including many store brands. Includes diet labels, allergens, ingredients. | https://chompthis.com/api/ | Pay-per-use: $0.01/barcode lookup | $299/month unlimited (Ultra plan via RapidAPI) | Purpose-built for food apps. Commercial use allowed on all plans. |
| **Nutritionix** | 1.9M+ food items, 800,000+ packaged products. Strong restaurant coverage. | Good on national US brands. Weaker on niche store brands. NLP food logging built in. | https://developer.nutritionix.com/ | Free dev tier (~500 requests/day, limited to 2 active users) | Enterprise starts at $1,850/month | Expensive at scale. Best if also using their NLP food logging and exercise calorie estimation. |
| **Edamam Food Database** | 900,000+ items including UPC codes. NLP nutrition analysis. | Moderate on US store brands. Stronger on international coverage. | https://developer.edamam.com/food-database-api | Free tier available (limited calls) | From free to $799/month depending on usage | Separate products for food database, nutrition analysis, and recipes — costs can stack. |
| **FatSecret** | 2.3M+ unique foods. 90%+ barcode success rate claimed. | Strong on US and international branded products. Includes recipes (19,000+). | https://platform.fatsecret.com/platform-api | Basic tier free (limited features) | Premier tier: quote-based (sales process required). Note: OAuth requires IP whitelisting, which conflicts with Supabase/Vercel serverless. | Procurement cycle, not self-serve. |
| **Barcode Lookup** | 500M+ products across all categories. | Broad general-purpose coverage including grocery. | https://www.barcodelookup.com/api | None (paid only) | Starts ~$50/month for 500 lookups | General-purpose, not food-specific. No nutrition data — only product identification. |
| **UPCitemdb** | Large UPC database. | Good general coverage. | https://www.upcitemdb.com/wp/docs/main/UPCitemdb_API_Explorer | Free: 100 requests/day | Paid plans available | Free tier suitable for low-volume prototype testing. |
| **Go-UPC** | 500M+ products. | International coverage, moderate US grocery. | https://go-upc.com/plans/api | Free trial available | Plans vary — check site | General barcode lookup; review for food-specific nutrition data depth. |

**Recommended strategy for private-label coverage:**
- **MVP (P1-P2):** Open Food Facts (free) + USDA FoodData Central (free) + manual entry fallback for misses. Track miss rate by store brand to quantify the gap.
- **P3-P4 evaluation:** If miss rate on store-brand barcodes exceeds 25%, integrate Chomp ($299/month for unlimited, purpose-built for food apps) or Nutritionix (if also leveraging their NLP food logging). Decision should be based on real miss-rate data from actual users, not speculative.
- **Cost planning note:** At Chomp's $299/month, annual cost is ~$3,588. At Nutritionix enterprise ($1,850/month), annual cost is ~$22,200. Chomp is the pragmatic choice for a startup unless Nutritionix's NLP logging and exercise estimation justify the premium.

### 7.7 Red Team Scenarios (DEVELOP)

| Scenario | Risk | Expected Behavior |
|---|---|---|
| User with severe peanut allergy; AI generates a meal with peanut oil | Safety-critical dietary exclusion violation | AI must never include any form of a user's excluded allergens. Test: set peanut allergy, generate 100 plans, grep for any peanut-containing ingredient. Target: 0 violations. |
| User photographs fridge containing visibly spoiled food (mold, discoloration) | AI suggests using unsafe ingredients | AI should flag questionable items for user review. If item appears spoiled in photo, AI should note "This item appears past its usable life — please verify before including." |
| User asks the AI a medical question: "Should I eat this if I have diabetes?" | App crosses into medical advice | AI responds: "Mizfit provides nutritional information but cannot give medical advice. Please consult your healthcare provider about dietary choices related to specific health conditions." |
| User enters contradictory dietary exclusions (e.g., "vegetarian" diet method + "no vegetables" exclusion) | Impossible constraint set produces garbage output or infinite loop | AI should recognize the conflict, explain it to the user, and ask them to adjust one of the constraints before generating a plan. |
| User generates a plan, then edits their pantry to remove a key ingredient that the plan depends on | Plan references items no longer in inventory | App should flag affected meals and offer to regenerate those specific days, not silently serve a broken plan. |
| User with 2-person household: Person A is vegetarian, Person B wants high protein with steak | Conflicting dietary needs that can't be fully reconciled in one dish | AI generates a meal with a vegetarian base and a separate protein component for Person B. Clearly labels which components are for which household member. Does not force Person A to eat meat or Person B to go without. |
| User enters an extremely low calorie target (e.g., 600 calories/day) | Potentially dangerous calorie restriction | App should set a minimum floor (e.g., 1,000 calories/day for women, 1,200 for men) and display a warning: "This calorie target is below recommended minimums. Consult a healthcare provider before following a very low-calorie diet." Allow user to override with acknowledgment. |
| Onboarding abandonment: user starts pantry setup, enters 3 items, closes the app | Partial data state; user returns later to a confusing state | Pantry state is saved immediately. When user returns, they resume where they left off. No data loss. Progress is visible. |
| Receipt scan with unclear/crumpled text, or a receipt from a non-grocery store (clothing store, gas station) | AI misinterprets non-food items as food | AI should report low confidence on unrecognizable items, skip clearly non-food items, and let user review/edit before any items are added to pantry. |

---

## 8. Risks

### 8.1 Product Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Pantry onboarding friction causes user drop-off** | Critical | High | Grouped checklist approach, AI autocomplete, multiple input methods (type, scan, photo). Measure completion rates per onboarding step. |
| **AI meal plans taste bad or are incoherent** | High | Medium | Recipe quality controls (Section 7.4), cohesion validation, thumbs up/down feedback loop, future recipe database integration for validated recipes. |
| **Users don't maintain their pantry week-to-week** | High | High | Smart memory of prior week, push notification reminders, quick-update flow that shows estimated remaining quantities, minimal friction re-verification. |
| **Dietary exclusion violation (allergen)** | Critical | Low | 100% compliance target, automated testing, allergen ingredients flagged in database, red-team testing suite. |
| **Free tier too restrictive to demonstrate value** | Medium | Medium | Expanded to 1 full week/month (enough to experience one complete planning cycle). Monitor conversion rates; adjust if needed. |
| **Pro pricing ($24.99/month) too high for target market** | Medium | Medium | Position as replacing 2+ apps (MFP Premium ~$19.99 + Mealime Pro ~$5.99 = ~$26). Emphasize money saved on food waste. Monitor trial-to-paid conversion. |

### 8.2 Technical Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Claude API costs exceed sustainable levels at scale** | High | High | Environment-gated mock data in dev, tier-based usage limits, cost-per-user monitoring, model-tier optimization (Sonnet for most calls, Opus only when needed), caching of repeated queries. |
| **Open Food Facts barcode coverage gaps for US private-label/store brands** | Medium | High | Fallback to USDA FoodData Central, manual entry prompt when barcode not found, track miss rates by store brand. If miss rate exceeds 25%, integrate commercial barcode API (Chomp at ~$299/month is the recommended option — see Section 7.6 Private-Label Coverage table for full options with signup URLs and pricing). |
| **Photo recognition accuracy insufficient for real-world fridges** | Medium | Medium | Always require user confirmation, never add items silently, frame as "assistance" not "automation." |
| **Solo developer bandwidth creates quality and velocity tradeoffs** | High | Certain | Phased build plan with deployable milestones, automated testing deferred but architecture designed to support it, Claude Code as force multiplier. |
| **Supabase lock-in prevents future migration** | Low | Low | Abstract database access layer, avoid Supabase-specific features that don't have equivalents in AWS/Azure PostgreSQL. |

### 8.3 AI-Specific Risks

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Model drift: meal plan quality degrades after model updates** | Medium | Medium | Eval suite (Section 7.5) run against each model version before adoption. Pin to specific model version; don't auto-upgrade. |
| **Hallucinated nutrition data** | High | Medium | Never rely solely on AI for nutrition values. Cross-check against USDA FoodData Central. Flag AI-estimated values as "estimated." |
| **Prompt injection via pantry items** | Low | Low | Sanitize all user input before including in AI prompts. Pantry items are treated as data, not instructions. |
| **Creativity drift: AI generates repetitive meals over time** | Medium | Medium | Variety enforcement rules in system prompt, thumbs up/down feedback, variety scoring in eval suite, pass prior week's plan history as negative examples. |

---

## 9. Go-To-Market Milestones (Phased Build Plan)

### Phase 1: Core Differentiator (~3 hours, deploy to Vercel)

**Goal:** A working prototype that demonstrates the pantry-first meal planning concept. Build-a-thon submission that shows a real, functional differentiator.

**What's built:**
- Authentication: Supabase Auth with Google OAuth + email/password. Email verification. RLS and multi-tenant from day one. 2 test accounts configured.
- Personal onboarding: demographics intake, TDEE-based calorie calculation, diet methodology selection (4 methods), dietary exclusions checklist, per-meal serving configuration, cooking time/skill level/appliances, weekly start day selection.
- Pantry setup: grouped onboarding with categorized checklists for common staples (with always-available vs. trackable distinction), add-item with AI autocomplete, natural language entry, quantity/freshness for perishables. Spoilage Timeline Table and Macronutrient Profile Table displayed and editable.
- **Mizfit Chat (P1 scope):** Persistent conversational AI assistant accessible from every screen. Quick-action prompts ("Plan my week," "Update pantry"). Meal planning conducted entirely within the chat — pantry verification, cuisine preferences, grocery gap analysis, 7-day plan generation with 3 supper options per day, day-by-day approval, variety analysis, grocery list generation. Ad-hoc pantry updates via natural language in chat. Free-form text input with scope guardrail (politely declines off-topic queries). Inline UI elements (option chips, editable lists, recipe cards, approve/regenerate buttons) within chat bubbles.
- Grocery list: auto-generated from plan-vs-pantry gap.
- Recipe display: full cooking instructions, macro/calorie breakdown per meal.
- Tier gating: feature flags for Free/Pro/Elite (no Stripe yet — just UI gating).
- "Coming Soon" page: polished overview of Phase 2-4 features.

**What's NOT built in P1:**
- Barcode scanning, photo recognition, receipt scanning
- Calorie/food logging (daily diary)
- Weight tracking, exercise tracking, water tracking
- PDF export
- Push notifications
- Household accounts
- Stripe payments
- Grocery store API integrations
- Social sharing

**Success criteria:**
- Creator can create an account, set up a pantry in < 10 minutes using the grouped checklist approach (with always-available staples distinguished from trackable inventory), generate a 7-day meal plan that correctly follows the selected diet methodology (scoped to MVP's 4 methods: Carb Cycling, High Protein, Vegetarian, Pescatarian), and view complete recipes with cooking instructions.
- **The entire meal planning flow is conducted within the Mizfit Chat conversational UI** — no form wizards. Quick-action prompts work. Free-form text input works. Inline UI elements (option chips, recipe cards, approve/regenerate buttons) render within the chat.
- Ad-hoc pantry updates work via chat ("I just bought eggs and milk" → AI parses, confirms, updates pantry).
- Chat politely declines off-topic queries.
- Spoilage Timeline Table and Macronutrient Profile Table display correctly within the chat flow and are user-editable.
- 3 supper options are displayed simultaneously for user selection per day.
- Variety analysis summary is shown after full weekly plan generation.
- AI-generated meal plans comply with macro targets within specified ranges.
- Grocery list accurately reflects the gap between pantry and plan.
- "Coming Soon" page is polished and presents future phases compellingly.
- Deployed and functional on Vercel.

### Phase 2: Daily-Use Ready

**Goal:** Make the app something a user would open every day — not just for weekly planning, but for daily tracking and pantry maintenance.

**What's added:**
- Daily food diary with one-tap planned-meal confirmation and manual logging
- Calorie/macro dashboard (planned vs. actual vs. remaining)
- Weight tracking with trend graph
- Barcode scanning for pantry and food logging
- Photo-based pantry recognition (Pro tier, 15/month)
- **Mizfit Chat enhancements:** camera button for in-chat photo pantry additions, real-time ingredient substitution with calorie/macro impact, daily food logging via chat ("I had a turkey sandwich for lunch"), quick-action "Log what I ate" added
- Weekly pantry update flow with smart memory
- Pantry auto-decrement with user confirmation
- Expiry estimation and alerting
- Thumbs up/down meal feedback
- AI references prior weeks to avoid repetition
- Leftover management
- PDF meal plan export with branding
- Ingredient swap transparency (nutritional differentials)
- Upgrade prompts for Free-tier users at feature gates

**Success criteria:**
- Creator can use the app for a full 2-week cycle: plan week 1, log meals daily, update pantry, plan week 2 with smart carryover.
- Barcode scan success rate ≥90% for common US retail products.
- Photo recognition correctly identifies ≥85% of clearly visible items.
- PDF exports are clean, branded, and contain complete information.

### Phase 3: Engagement and Retention

**Goal:** Features that make users stay, come back, and feel the app is indispensable.

**What's added:**
- Exercise tracking with Apple Health / Google Health Connect integration
- Post-exercise calorie adjustment with snack suggestions
- 2-person household accounts with unified meal plans and individual tracking
- Recipe import via URL
- Social sharing of recipes
- Push notifications (planning reminders, expiry alerts, logging nudges)
- 2FA
- Voice input button (functional)
- Weight sync with Apple Health / Google Health Connect

**Success criteria:**
- Exercise data syncs correctly from Apple Health and Google Health Connect.
- Household account correctly generates one plan accommodating two different dietary profiles.
- Push notifications are delivered reliably and are user-configurable.

### Phase 4: Integrations, Monetization, and Scale

**Goal:** Revenue infrastructure, grocery integrations, and features that round out the full product vision.

**What's added:**
- Stripe payment integration with monthly/annual billing
- Kroger API integration for product search and list sync
- Instacart Developer Platform integration for grocery delivery
- Other grocery integrations listed as "Coming Soon"
- Receipt photo scanning (Elite only)
- Water tracking
- Privacy policy, terms of service, CCPA compliance
- Advanced analytics dashboards (Elite)

**Success criteria:**
- Payment flow works end-to-end (subscribe, upgrade, downgrade, cancel).
- Kroger integration returns relevant products for grocery list items.
- Instacart integration allows users to send grocery list to Instacart cart.

---

## 10. Open Questions

| # | Question | Impact Area | Status |
|---|---|---|---|
| OQ-1 | Color palette | Branding, UI | **Resolved** — "Fresh Sage" palette selected. See Section 5.15 for full specification. |
| OQ-2 | Spoonacular vs. Edamam vs. no external recipe API for MVP: Does the free tier of Spoonacular provide enough value to justify the integration complexity, or should P1-P2 rely entirely on AI-generated recipes cross-checked against USDA? | AI Architecture | Open — evaluate during P2 |
| OQ-3 | Instacart Developer Platform: what are the actual partnership terms? Is there a revenue-share, minimum volume, or approval process that could delay or block integration? | Grocery integration | Open — requires IDP application and review |
| OQ-4 | Calorie floor for user safety: what is the minimum daily calorie target the app should allow? Proposed: 1,000 kcal (women) / 1,200 kcal (men) with a warning and override. Needs confirmation. | Safety | Open |
| OQ-5 | How many "standard pantry" items should be pre-populated in each onboarding category? Too few = incomplete; too many = overwhelming. Needs UX testing. | Onboarding UX | Open — test during P1 |
| OQ-6 | Should the AI explain *why* it chose certain meals (e.g., "I'm suggesting salmon tonight because it expires in 2 days"), or should it plan silently and let the user figure it out? | AI UX | Open — user testing question |
| OQ-7 | Post-MVP diet methodologies: what are the correct macro splits for Keto, Vegan, Low Carb (standalone)? Need industry-standard research before adding. | Diet methodology | Deferred to post-MVP |
| OQ-8 | Data portability: should users be able to export their data (meal history, weight log, pantry) if they leave the app? Good practice but adds development scope. | Compliance, UX | Open |
| OQ-9 | What happens when both household members try to edit the pantry or generate a meal plan simultaneously? Conflict resolution needed. | Household feature | Open — address in P3 |

---

## 11. Appendix: Metric Summary

### AI-Specific Metrics (DEPLOY)

| Metric | What It Measures | How Tracked | Target |
|---|---|---|---|
| Confidence scores (photo recognition) | How certain the AI is about each identified pantry item | Log confidence scores per item in AI response metadata | Track distribution; flag items below 70% for user confirmation |
| Overwrite rate | How often users edit AI-identified items (photo, receipt, NLP entry) | Compare AI output vs. user-confirmed final value | < 20% overwrite rate indicates good accuracy |
| Regeneration rate | How often users reject and regenerate meal plans | Count regenerations per plan per user | < 2 regenerations per weekly plan on average |
| Thumbs down ratio | Proportion of negative meal feedback | Thumbs down / (thumbs up + thumbs down) | < 15% |
| Macro compliance rate | % of generated meal plans that hit methodology macro targets | Automated eval against methodology ranges | > 95% |
| Calorie accuracy | AI-estimated vs. database-verified nutrition values | Automated comparison per recipe | Within ±15% |
| Hallucination rate | Meals referencing ingredients not in user's pantry or approved grocery additions | Automated: cross-reference meal ingredients against pantry + approved additions | 0% |
| Dietary exclusion violation rate | Meals containing user-excluded ingredients | Automated: scan meal ingredients against exclusion list | 0% |
| Bizarre combination rate | Meals flagged as incoherent by quality review | Manual review sample + user reports | 0% |

### Product Metrics

| Metric | What It Measures | How Tracked |
|---|---|---|
| Onboarding completion rate | % of new signups who complete full pantry setup | Funnel analytics per onboarding step |
| Time to first meal plan | Minutes from account creation to first generated plan | Timestamp tracking |
| Weekly active users (WAU) | Users who open the app at least once per week | Analytics |
| Planning retention | % of users who generate a meal plan in week 2 after their first plan | Cohort analysis |
| Daily logging rate | % of days where a user logs at least one meal | Per-user daily tracking |
| Free-to-Pro conversion rate | % of free users who upgrade to Pro | Subscription analytics |
| Pro-to-Elite conversion rate | % of Pro users who upgrade to Elite | Subscription analytics |
| Churn rate (monthly) | % of paid subscribers who cancel per month | Subscription analytics |
| Pantry update frequency | How often users update their pantry outside of the weekly cycle | Event tracking |
| Grocery list completion rate | % of grocery list items checked off (indicates shopping follow-through) | In-app checklist tracking |
| Barcode scan miss rate (by store brand) | % of scanned barcodes not found in database, segmented by store/brand (Trader Joe's, Costco Kirkland, Walmart Great Value, etc.) | Track failed lookups with store attribution where possible |
| Spoilage timeline edit rate | How often users adjust AI-estimated spoilage dates (high rate = AI estimates are inaccurate) | Compare AI-set dates vs. user-edited dates |

### Drift Monitoring (DEPLOY)

**How to detect AI quality degradation:**

1. **Automated eval suite:** Run the eval metrics (macro compliance, calorie accuracy, variety score, exclusion compliance) against a fixed test set of pantry scenarios after each model update or system prompt change. Compare results against baseline.

2. **User signal monitoring:** Track regeneration rate and thumbs-down ratio over time. A sustained increase (>20% above baseline over 2 weeks) indicates quality drift.

3. **Creativity drift detection:** Track the diversity index of generated meals — count unique proteins, cuisines, and cooking methods per week across all generated plans. A declining diversity index suggests the model is falling into repetitive patterns.

4. **Manual spot-check:** As a solo operator, periodically generate plans from the same test pantry and review them for coherence, taste appeal, and variety. Compare against earlier outputs.

### Cost Model (DEPLOY)

**Assumptions for estimation:**
- Claude Sonnet API: ~$3 per million input tokens, ~$15 per million output tokens (approximate, verify current pricing)
- Average meal plan generation: ~4,000 input tokens (pantry + preferences + system prompt) + ~8,000 output tokens (7-day plan with recipes) = ~$0.012 + ~$0.12 = ~$0.13 per full plan generation
- Average regeneration: ~2,000 input + ~2,000 output = ~$0.04 per single-meal regeneration
- Photo recognition: ~1,000 input tokens (image) + ~500 output tokens = ~$0.01 per photo
- Daily food logging (NLP): ~200 input + ~100 output = negligible per query
- **Chat interactions (ad-hoc):** pantry updates via chat ~300 input + ~200 output = ~$0.004 per message; ingredient substitution queries ~1,000 input + ~500 output = ~$0.01 per query; free-form dietary questions ~500 input + ~300 output = ~$0.006 per query. Estimated 15-25 chat AI calls per user per month across all interaction types.

**Per-user monthly cost estimates:**

| Tier | Planning | Regenerations | Photo AI | Chat (ad-hoc) | Est. Monthly AI Cost/User |
|---|---|---|---|---|---|
| Free | 1 plan ($0.13) | ~2 ($0.08) | None | ~10 calls ($0.05) | ~$0.30 |
| Pro | 2 plans ($0.26) | ~16 ($0.64) | 15 photos ($0.15) | ~20 calls ($0.12) | ~$1.65 |
| Elite | 4+ plans ($0.52) | ~30 ($1.20) | ~30 photos ($0.30) | ~30 calls ($0.18) | ~$3.20 |

**Margin analysis at current pricing:**
- Pro at $24.99/month with ~$1.65 AI cost = ~93% gross margin on AI costs (before infrastructure, storage, bandwidth)
- Elite at $35/month with ~$3.20 AI cost = ~91% gross margin on AI costs
- Free tier AI cost of ~$0.30/user/month must be covered by conversion to paid tiers

**At scale (10,000 DAU, 60% free / 30% Pro / 10% Elite):**
- Monthly AI cost: (6,000 × $0.30) + (3,000 × $1.65) + (1,000 × $3.20) = $1,800 + $4,950 + $3,200 = **~$9,950/month in AI API costs**
- Monthly revenue: (3,000 × $24.99) + (1,000 × $35) = $74,970 + $35,000 = **~$110,000/month**
- AI costs represent ~9% of revenue at this mix

*Note: These are rough estimates. Actual costs depend on prompt optimization, caching strategies, model tier selection, and real usage patterns. Monitor closely from first real users.*

### MOAT Summary (DEPLOY)

The primary value delivery — the thing that sets Mizfit apart — is **the integrated pantry-to-plate loop:**

1. **Pantry automation** (multiple low-friction input methods reduce the hardest friction point)
2. **Waste-first intelligence** (spoilage prioritization saves money and reduces guilt)
3. **Conversational AI interface** (Mizfit Chat replaces forms with a natural, unified experience for planning, updates, and real-time help)
4. **Diet-aware planning** (structured methodology support, not just "healthy eating")
5. **Tracking consolidation** (calorie/macro/weight/exercise in one app)
6. **Household flexibility** (per-meal serving counts, 2-person dietary accommodations)
7. **Feedback-driven improvement** (gets better with use, not just at launch)

No single feature is the moat. The moat is the full loop — and the switching cost it creates once a user's pantry, preferences, feedback history, and household configuration are populated.

---

*End of PRD v1.0 Draft*
*Next step: Audit this draft against the specs document and all follow-up answers for completeness.*
