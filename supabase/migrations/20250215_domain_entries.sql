-- Domain entries table to normalize per-domain data previously stored in JSON blobs
create extension if not exists "uuid-ossp";

create table if not exists domain_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table domain_entries enable row level security;

create policy if not exists "domain_entries_select_own" on domain_entries
  for select using (auth.uid() = user_id);

create policy if not exists "domain_entries_insert_own" on domain_entries
  for insert with check (auth.uid() = user_id);

create policy if not exists "domain_entries_update_own" on domain_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy if not exists "domain_entries_delete_own" on domain_entries
  for delete using (auth.uid() = user_id);

create index if not exists idx_domain_entries_user_domain_created_at
  on domain_entries(user_id, domain, created_at desc);

create or replace function set_domain_entries_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_domain_entries_updated_at
  before update on domain_entries
  for each row execute function set_domain_entries_updated_at();

create or replace view domain_entries_view as
select
  id,
  user_id,
  domain,
  title,
  description,
  metadata,
  created_at,
  updated_at
from domain_entries;
