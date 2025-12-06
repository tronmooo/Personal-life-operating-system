-- Indexes for frequently read domains to improve query performance
-- Safe to run multiple times (IF NOT EXISTS)

create index if not exists domain_entries_user_domain_updated_idx
  on public.domain_entries (user_id, domain, updated_at desc);

-- Partial indexes for specific domains
create index if not exists domain_entries_vehicles_idx
  on public.domain_entries (user_id, updated_at desc)
  where domain = 'vehicles';

create index if not exists domain_entries_financial_idx
  on public.domain_entries (user_id, updated_at desc)
  where domain = 'financial';

create index if not exists domain_entries_health_idx
  on public.domain_entries (user_id, updated_at desc)
  where domain = 'health';

create index if not exists domain_entries_pets_idx
  on public.domain_entries (user_id, updated_at desc)
  where domain = 'pets';






