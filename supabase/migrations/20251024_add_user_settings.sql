-- Create user_settings table to persist user preferences/settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Helpful index for partial queries by settings keys
create index if not exists user_settings_gin_idx on public.user_settings using gin (settings);

-- Row Level Security
alter table public.user_settings enable row level security;

do $$ begin
  create policy "Users can select their own settings"
    on public.user_settings for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can upsert their own settings"
    on public.user_settings for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update their own settings"
    on public.user_settings for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;












