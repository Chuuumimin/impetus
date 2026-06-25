-- ============================================================
-- Impetus — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Users table
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  email text not null default '',
  plan text not null default 'free',
  avatar text not null default '',
  join_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null default '',
  description text not null default '',
  status text not null default 'todo',
  priority text not null default 'medium',
  category text not null default '',
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Simulation history table
create table if not exists public.simulation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  goal text not null default '',
  result text not null default '',
  task_snapshot jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  role text not null,
  content text not null default '',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.simulation_history enable row level security;
alter table public.chat_messages enable row level security;

-- RLS Policies (service role di Edge Function bypass ini otomatis)
create policy "users_own" on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "tasks_own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "simulations_own" on public.simulation_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_user_created_idx on public.tasks(user_id, created_at);
create index if not exists simulations_user_id_idx on public.simulation_history(user_id);
create index if not exists simulations_user_created_idx on public.simulation_history(user_id, created_at);
create index if not exists chat_user_created_idx on public.chat_messages(user_id, created_at);
