-- COMEBACK App — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → project → SQL Editor)

create table if not exists day_logs (
  date        date primary key,
  workout_completed boolean default false,
  workout_day text    default '',
  steps       integer default 0,
  xp_earned   integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists meals (
  id          text primary key,
  day_date    date not null references day_logs(date) on delete cascade,
  name        text not null,
  calories    integer not null default 0,
  protein     integer default 0,
  carbs       integer default 0,
  fat         integer default 0,
  meal_type   text not null default 'snack',
  logged_time text,
  created_at  timestamptz default now()
);

create table if not exists water_entries (
  id          text primary key,
  day_date    date not null references day_logs(date) on delete cascade,
  ml          integer not null,
  logged_time text,
  created_at  timestamptz default now()
);

create table if not exists workout_sets (
  day_date    date not null references day_logs(date) on delete cascade,
  exercise_id text not null,
  set_index   integer not null,
  reps        integer not null default 0,
  weight      numeric not null default 0,
  created_at  timestamptz default now(),
  primary key (day_date, exercise_id, set_index)
);

create table if not exists user_stats (
  id               integer primary key default 1,
  xp               integer default 0,
  level            integer default 1,
  weight           numeric default 72,
  body_fat         numeric default 22,
  streak_workout   integer default 0,
  streak_hydration integer default 0,
  streak_protein   integer default 0,
  streak_steps     integer default 0,
  badges           jsonb default '[]',
  updated_at       timestamptz default now()
);

-- Single user — seed the stats row
insert into user_stats (id) values (1) on conflict (id) do nothing;

-- Disable RLS (personal app, single user — no need for row-level security)
alter table day_logs      disable row level security;
alter table meals         disable row level security;
alter table water_entries disable row level security;
alter table workout_sets  disable row level security;
alter table user_stats    disable row level security;
