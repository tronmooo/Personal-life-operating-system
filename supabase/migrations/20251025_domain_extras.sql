-- Domain extras: health_metrics, moods, travel_trips, insurance_policies, insurance_claims
create extension if not exists "uuid-ossp";

-- Health metrics
create table if not exists health_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null,
  value numeric not null,
  unit text,
  recorded_at timestamptz not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table health_metrics enable row level security;
create policy "select own health_metrics" on health_metrics for select using (auth.uid() = user_id);
create policy "ins own health_metrics" on health_metrics for insert with check (auth.uid() = user_id);
create policy "upd own health_metrics" on health_metrics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists idx_health_metrics_user_recorded on health_metrics(user_id, recorded_at desc);

-- Moods
create table if not exists moods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null,
  score int not null check (score between 1 and 10),
  note text,
  tags jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table moods enable row level security;
create policy "select own moods" on moods for select using (auth.uid() = user_id);
create policy "ins own moods" on moods for insert with check (auth.uid() = user_id);
create policy "upd own moods" on moods for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "del own moods" on moods for delete using (auth.uid() = user_id);
create index if not exists idx_moods_user_logged on moods(user_id, logged_at desc);

-- Travel trips
create table if not exists travel_trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  destination text,
  start_date date,
  end_date date,
  bookings jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table travel_trips enable row level security;
create policy "select own trips" on travel_trips for select using (auth.uid() = user_id);
create policy "ins own trips" on travel_trips for insert with check (auth.uid() = user_id);
create policy "upd own trips" on travel_trips for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "del own trips" on travel_trips for delete using (auth.uid() = user_id);
create index if not exists idx_trips_user_dates on travel_trips(user_id, start_date, end_date);

-- Insurance policies
create table if not exists insurance_policies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  policy_number text not null,
  type text,
  premium numeric(14,2),
  starts_on date,
  ends_on date,
  coverage jsonb default '{}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, policy_number)
);
alter table insurance_policies enable row level security;
create policy "select own policies" on insurance_policies for select using (auth.uid() = user_id);
create policy "ins own policies" on insurance_policies for insert with check (auth.uid() = user_id);
create policy "upd own policies" on insurance_policies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "del own policies" on insurance_policies for delete using (auth.uid() = user_id);
create index if not exists idx_policies_user_provider on insurance_policies(user_id, provider);

-- Insurance claims
create table if not exists insurance_claims (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  policy_id uuid not null references insurance_policies(id) on delete cascade,
  status text,
  amount numeric(14,2),
  filed_on date,
  resolved_on date,
  details jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table insurance_claims enable row level security;
create policy "select own claims" on insurance_claims for select using (auth.uid() = user_id);
create policy "ins own claims" on insurance_claims for insert with check (auth.uid() = user_id);
create policy "upd own claims" on insurance_claims for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "del own claims" on insurance_claims for delete using (auth.uid() = user_id);
create index if not exists idx_claims_user_policy on insurance_claims(user_id, policy_id);









