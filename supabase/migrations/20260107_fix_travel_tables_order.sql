-- Fix travel tables migration ordering issue
-- The travel_bookings, travel_itinerary_days, travel_documents tables depend on travel_trips
-- but travel_trips was created in a later migration (20251025_domain_extras.sql)
-- This migration ensures all travel tables exist in the correct order

-- First, ensure travel_trips exists (from 20251025_domain_extras.sql)
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

-- Enable RLS on travel_trips if not already enabled
alter table travel_trips enable row level security;

-- Create RLS policies for travel_trips (use DO block to handle "already exists" gracefully)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_trips' AND policyname = 'select own trips') THEN
    CREATE POLICY "select own trips" ON travel_trips FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_trips' AND policyname = 'ins own trips') THEN
    CREATE POLICY "ins own trips" ON travel_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_trips' AND policyname = 'upd own trips') THEN
    CREATE POLICY "upd own trips" ON travel_trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_trips' AND policyname = 'del own trips') THEN
    CREATE POLICY "del own trips" ON travel_trips FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

create index if not exists idx_trips_user_dates on travel_trips(user_id, start_date, end_date);

-- Now create travel_bookings (depends on travel_trips)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_bookings' AND policyname = 'travel_bookings_select_own') THEN
    CREATE POLICY "travel_bookings_select_own" ON travel_bookings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_bookings' AND policyname = 'travel_bookings_insert_own') THEN
    CREATE POLICY "travel_bookings_insert_own" ON travel_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_bookings' AND policyname = 'travel_bookings_update_own') THEN
    CREATE POLICY "travel_bookings_update_own" ON travel_bookings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_bookings' AND policyname = 'travel_bookings_delete_own') THEN
    CREATE POLICY "travel_bookings_delete_own" ON travel_bookings FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

create index if not exists idx_travel_bookings_user_date on travel_bookings (user_id, start_date, end_date);

-- Create updated_at trigger for travel_bookings
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

-- Now create travel_itinerary_days (depends on travel_trips)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_itinerary_days' AND policyname = 'travel_itinerary_days_select_own') THEN
    CREATE POLICY "travel_itinerary_days_select_own" ON travel_itinerary_days FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_itinerary_days' AND policyname = 'travel_itinerary_days_insert_own') THEN
    CREATE POLICY "travel_itinerary_days_insert_own" ON travel_itinerary_days FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_itinerary_days' AND policyname = 'travel_itinerary_days_update_own') THEN
    CREATE POLICY "travel_itinerary_days_update_own" ON travel_itinerary_days FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_itinerary_days' AND policyname = 'travel_itinerary_days_delete_own') THEN
    CREATE POLICY "travel_itinerary_days_delete_own" ON travel_itinerary_days FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

create index if not exists idx_travel_itinerary_days_trip on travel_itinerary_days (trip_id, day_number);

-- Create updated_at trigger for travel_itinerary_days
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

-- Now create travel_documents (depends on travel_trips)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_documents' AND policyname = 'travel_documents_select_own') THEN
    CREATE POLICY "travel_documents_select_own" ON travel_documents FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_documents' AND policyname = 'travel_documents_insert_own') THEN
    CREATE POLICY "travel_documents_insert_own" ON travel_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_documents' AND policyname = 'travel_documents_update_own') THEN
    CREATE POLICY "travel_documents_update_own" ON travel_documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_documents' AND policyname = 'travel_documents_delete_own') THEN
    CREATE POLICY "travel_documents_delete_own" ON travel_documents FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

create index if not exists idx_travel_documents_user_created on travel_documents (user_id, created_at desc);

-- Create updated_at trigger for travel_documents
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

-- Create travel_saved_destinations (no FK dependency)
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_saved_destinations' AND policyname = 'travel_saved_destinations_select_own') THEN
    CREATE POLICY "travel_saved_destinations_select_own" ON travel_saved_destinations FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_saved_destinations' AND policyname = 'travel_saved_destinations_insert_own') THEN
    CREATE POLICY "travel_saved_destinations_insert_own" ON travel_saved_destinations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_saved_destinations' AND policyname = 'travel_saved_destinations_update_own') THEN
    CREATE POLICY "travel_saved_destinations_update_own" ON travel_saved_destinations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'travel_saved_destinations' AND policyname = 'travel_saved_destinations_delete_own') THEN
    CREATE POLICY "travel_saved_destinations_delete_own" ON travel_saved_destinations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

create index if not exists idx_travel_saved_destinations_user_created on travel_saved_destinations (user_id, created_at desc);

