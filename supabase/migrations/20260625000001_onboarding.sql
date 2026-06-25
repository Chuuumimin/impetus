-- Run this in Supabase SQL Editor to add onboarding columns
alter table public.users
  add column if not exists age integer,
  add column if not exists occupation text default '',
  add column if not exists income bigint default 0,
  add column if not exists short_goals jsonb default '[]',
  add column if not exists long_goals jsonb default '[]',
  add column if not exists skills jsonb default '[]',
  add column if not exists habits jsonb default '[]',
  add column if not exists onboarding_complete boolean default false,
  add column if not exists life_profile jsonb,
  add column if not exists roadmap jsonb;
