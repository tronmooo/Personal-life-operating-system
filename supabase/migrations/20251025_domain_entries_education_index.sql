-- Optimize queries for education entries in domain_entries
create index if not exists idx_domain_entries_education_created_at
  on domain_entries (created_at desc)
  where domain = 'education';

-- Optional: speed up metadata lookups (uncomment if needed)
-- create index if not exists idx_domain_entries_education_metadata
--   on domain_entries using gin (metadata)
--   where domain = 'education';








