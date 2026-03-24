-- FrenchTCF Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User progress per module
create table if not exists user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id text not null,
  completed integer default 0,
  last_idx integer default 0,
  exercise_order jsonb default '[]',
  xp integer default 0,
  streak integer default 0,
  last_day text default '',
  total_xp integer default 0,
  updated_at timestamp with time zone default now(),
  unique(user_id, module_id)
);

-- User errors for review
create table if not exists user_errors (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id text not null,
  question text not null,
  correct_answer text not null,
  explanation text default '',
  mastered boolean default false,
  count integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Global user stats
create table if not exists user_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  total_xp integer default 0,
  streak integer default 0,
  last_day text default '',
  updated_at timestamp with time zone default now()
);

-- Row Level Security
alter table user_progress enable row level security;
alter table user_errors enable row level security;
alter table user_stats enable row level security;

-- Policies: users can only see/edit their own data
create policy "Users can view own progress" on user_progress
  for select using (auth.uid() = user_id);

create policy "Users can insert own progress" on user_progress
  for insert with check (auth.uid() = user_id);

create policy "Users can update own progress" on user_progress
  for update using (auth.uid() = user_id);

create policy "Users can view own errors" on user_errors
  for select using (auth.uid() = user_id);

create policy "Users can insert own errors" on user_errors
  for insert with check (auth.uid() = user_id);

create policy "Users can update own errors" on user_errors
  for update using (auth.uid() = user_id);

create policy "Users can delete own errors" on user_errors
  for delete using (auth.uid() = user_id);

create policy "Users can view own stats" on user_stats
  for select using (auth.uid() = user_id);

create policy "Users can insert own stats" on user_stats
  for insert with check (auth.uid() = user_id);

create policy "Users can update own stats" on user_stats
  for update using (auth.uid() = user_id);

-- Function to auto-create stats row on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_stats (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
