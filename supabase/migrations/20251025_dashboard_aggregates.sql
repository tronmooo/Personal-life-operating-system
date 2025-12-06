-- Dashboard aggregates per user (daily snapshot)
create table if not exists dashboard_aggregates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null default (current_date),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, snapshot_date)
);

alter table dashboard_aggregates enable row level security;

create policy if not exists "agg_select_own" on dashboard_aggregates
  for select using (auth.uid() = user_id);

create policy if not exists "agg_insert_own" on dashboard_aggregates
  for insert with check (auth.uid() = user_id);

create policy if not exists "agg_update_own" on dashboard_aggregates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "agg_delete_own" on dashboard_aggregates
  for delete using (auth.uid() = user_id);

create index if not exists idx_dashboard_aggregates_user_date
  on dashboard_aggregates (user_id, snapshot_date desc);

create or replace function set_dashboard_aggregates_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

create trigger trg_dashboard_aggregates_updated_at
  before update on dashboard_aggregates
  for each row execute function set_dashboard_aggregates_updated_at();








