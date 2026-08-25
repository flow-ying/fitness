create table if not exists public.workout_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_type text not null check (exercise_type in ('squat', 'pushup', 'curl')),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0),
  total_reps integer not null check (total_reps >= 0),
  correct_reps integer not null check (correct_reps >= 0 and correct_reps <= total_reps),
  form_score numeric(5, 2) not null check (form_score >= 0 and form_score <= 100),
  issue_counts jsonb not null default '{}'::jsonb,
  average_fps numeric(6, 2) not null check (average_fps >= 0),
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create index if not exists workout_results_user_created_idx
  on public.workout_results (user_id, created_at desc);

alter table public.workout_results enable row level security;

create policy "Users can read their own workout results"
  on public.workout_results for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own workout results"
  on public.workout_results for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own workout results"
  on public.workout_results for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own workout results"
  on public.workout_results for delete
  to authenticated
  using ((select auth.uid()) = user_id);
