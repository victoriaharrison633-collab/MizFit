-- 0001_enums.sql — the eight enums from SPEC.md § 4.1.
-- Values are byte-for-byte from that table. Adding a value later is an ALTER
-- TYPE in a new migration; this file is never edited once applied (Rule 3).

create type public.workspace_role as enum ('owner', 'member');

create type public.profile_sex as enum ('male', 'female', 'prefer_not_to_say');

create type public.activity_level as enum (
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active'
);

create type public.diet_methodology as enum (
  'carb_cycling',
  'high_protein',
  'vegetarian',
  'pescatarian'
);

create type public.plan_tier as enum ('free', 'pro', 'elite');

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');

create type public.meal_plan_status as enum ('generating', 'ready', 'failed');

create type public.day_macro_type as enum ('high', 'mid', 'low', 'fixed');
