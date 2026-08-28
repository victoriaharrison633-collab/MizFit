# MizFit
Eat what you have. Look how you want.

Mizfit is a pantry-first AI meal planning app. Instead of building meal plans from scratch, Mizfit generates your weekly plan from what's already in your kitchen — prioritizing items closest to expiry to cut food waste and grocery spend — while tailoring every plan to your chosen diet method and tracking calories, macros, and exercise toward your goals.

🏆 Built for DevFestDC Build-a-thon — this is the Phase 1 prototype submission. See #roadmap for what's planned beyond this build.

The problem

Most nutrition apps solve one half of the problem:

Calorie/macro trackers (e.g. MyFitnessPal) help you log what you ate, but don't help you decide what to cook or reduce what you waste.
Meal planners (e.g. Mealime) help you plan meals, but plan around a recipe database — not around what's actually in your pantry.

Mizfit combines both: plan from your pantry, track toward your goals, waste less food.

Key features (MVP)
Pantry-first AI meal planning — weekly plans generated from what you already have, prioritizing soon-to-expire items first
Diet methodology support — Carb Cycling, High Protein, Vegetarian, and Pescatarian, with more planned post-MVP
Calorie & macro tracking — TDEE-based budgeting that adjusts with logged exercise
Exercise logging — with Apple Health / Google Health Connect integration planned
Grocery gap lists — auto-generated from your plan minus what's already on hand
Privacy by design — pantry photo and receipt images are processed and immediately deleted, never stored
Tech stack
Layer	Technology
Frontend	Next.js 15.5.24 (App Router) + TypeScript + Tailwind CSS
Backend	Next.js 15.5.24 App Router route handlers (TypeScript)
Database	Supabase (Postgres) with Row-Level Security
AI	Anthropic Claude API
Nutrition data	USDA FoodData Central, Open Food Facts
Deployment	Vercel
Getting started
Prerequisites
Node.js 18+
A Supabase project (Postgres + RLS enabled)
An Anthropic API key
Setup
bash
# Clone the repo
git clone https://github.com/<your-username>/mizfit.git
cd mizfit

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# then fill in your Supabase and Anthropic API credentials in .env

# Run locally
npm run dev

See .env.example for the full list of required environment variables. Never commit your .env file — it's already excluded via .gitignore.

⚠️ In development, Claude API calls are gated behind an environment check and return mock data by default, to avoid burning real API credits while testing. See /config for details.

Roadmap
Phase 1 (this build): Auth, onboarding, pantry setup, AI weekly meal plan generation, day-by-day plan review, grocery gap list
Phase 2: Daily tracking, photo and barcode pantry automation
Phase 3: Exercise features, household accounts, push notifications
Phase 4: Grocery store API integrations (Kroger, Instacart), Stripe payments
Pricing (planned)
Tier	Price	Includes
Free	$0	1 full week of planning per month
Pro	~$24.99/mo	Unlimited planning + 15 pantry photo uploads/month
Elite	~$35/mo	Unlimited photo uploads + receipt scanning

Payment processing is architected but not yet live in this build.

License

[Choose a license — MIT is a common permissive default, or specify "All rights reserved — submitted for competition judging purposes only" if you'd rather not open it up yet.]

Built by Vicki Harrison for DevFestDC Build-a-thon, August 28, 2026.
