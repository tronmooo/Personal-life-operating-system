-- Travel domain normalized tables
create extension if not exists "uuid-ossp";

-- Saved destinations curated by the user
create table if not exists travel_saved_destinations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text,
  highlight text,
  duration text,
  estimated_cost text,
  highlights jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table travel_saved_destinations enable row level security;

create policy if not exists "travel_saved_destinations_select_own"
  on travel_saved_destinations
  for select using (auth.uid() = user_id);

create policy if not exists "travel_saved_destinations_insert_own"
  on travel_saved_destinations
  for insert with check (auth.uid() = user_id);

create policy if not exists "travel_saved_destinations_update_own"
  on travel_saved_destinations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "travel_saved_destinations_delete_own"
  on travel_saved_destinations
  for delete using (auth.uid() = user_id);

create index if not exists idx_travel_saved_destinations_user_created
  on travel_saved_destinations (user_id, created_at desc);

-- Trip itinerary days (one row per day)
create table if not exists travel_itinerary_days (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references travel_trips(id) on delete cascade,
  day_number int not null,
  title text,
  activities jsonb not null default '[]'::jsonb,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table travel_itinerary_days enable row level security;

create policy if not exists "travel_itinerary_days_select_own"
  on travel_itinerary_days
  for select using (auth.uid() = user_id);

create policy if not exists "travel_itinerary_days_insert_own"
  on travel_itinerary_days
  for insert with check (auth.uid() = user_id);

create policy if not exists "travel_itinerary_days_update_own"
  on travel_itinerary_days
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "travel_itinerary_days_delete_own"
  on travel_itinerary_days
  for delete using (auth.uid() = user_id);

create index if not exists idx_travel_itinerary_days_trip
  on travel_itinerary_days (trip_id, day_number);

create or replace function set_travel_itinerary_days_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_travel_itinerary_days_updated_at on travel_itinerary_days;

create trigger trg_travel_itinerary_days_updated_at
  before update on travel_itinerary_days
  for each row execute procedure set_travel_itinerary_days_updated_at();

-- Travel bookings (flights, hotels, etc.)
create table if not exists travel_bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references travel_trips(id) on delete set null,
  booking_type text not null,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  price text,
  status text,
  confirmation_number text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table travel_bookings enable row level security;

create policy if not exists "travel_bookings_select_own"
  on travel_bookings
  for select using (auth.uid() = user_id);

create policy if not exists "travel_bookings_insert_own"
  on travel_bookings
  for insert with check (auth.uid() = user_id);

create policy if not exists "travel_bookings_update_own"
  on travel_bookings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "travel_bookings_delete_own"
  on travel_bookings
  for delete using (auth.uid() = user_id);

create index if not exists idx_travel_bookings_user_date
  on travel_bookings (user_id, start_date, end_date);

create or replace function set_travel_bookings_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_travel_bookings_updated_at on travel_bookings;

create trigger trg_travel_bookings_updated_at
  before update on travel_bookings
  for each row execute procedure set_travel_bookings_updated_at();

-- Travel documents (passes, visas, insurance, etc.)
create table if not exists travel_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references travel_trips(id) on delete set null,
  document_type text not null,
  name text not null,
  destination text,
  reference_number text,
  issue_date date,
  expiry_date date,
  file_url text,
  file_name text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table travel_documents enable row level security;

create policy if not exists "travel_documents_select_own"
  on travel_documents
  for select using (auth.uid() = user_id);

create policy if not exists "travel_documents_insert_own"
  on travel_documents
  for insert with check (auth.uid() = user_id);

create policy if not exists "travel_documents_update_own"
  on travel_documents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "travel_documents_delete_own"
  on travel_documents
  for delete using (auth.uid() = user_id);

create index if not exists idx_travel_documents_user_created
  on travel_documents (user_id, created_at desc);

create or replace function set_travel_documents_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_travel_documents_updated_at on travel_documents;

create trigger trg_travel_documents_updated_at
  before update on travel_documents
  for each row execute procedure set_travel_documents_updated_at();
