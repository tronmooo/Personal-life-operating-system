# Supabase Table & RLS Audit — 2025-11-09

## Summary
- Reviewed every SQL migration under `supabase/migrations` to catalogue current tables and row-level security (RLS) coverage.
- Confirmed that all user-scoped tables enable RLS and include policies restricting access to `auth.uid()` unless explicitly intended for public/service-role consumption.
- Logged follow-up checks for tables referenced in policy migrations without accompanying `CREATE TABLE` statements.

## Methodology
1. Enumerated schema changes with `rg "create table" supabase/migrations` to capture all table definitions.
2. Inspected companion statements in each migration to verify `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and the associated `CREATE POLICY` clauses.
3. Reviewed storage bucket policies (`20251029130000_create_documents_storage_bucket.sql`) and RLS remediation migrations (`20251026_add_rls_policies.sql`, `20251028_critical_rls_fix.sql`, `99999_fix_delete_now.sql`, `fix-delete-rls-policy.sql`).
4. Cross-referenced migrations that adjust existing tables (indexes, triggers, columns) to ensure they do not disable or bypass RLS.

## Table Inventory & RLS Posture

### Core Operational Tables (`001_create_all_tables.sql`)
- `domains` — RLS enabled; select/insert/update/delete limited to `auth.uid() = user_id`.
- `tasks` — RLS enabled with user_id-locked CRUD policies.
- `habits` — RLS enabled; CRUD restricted to owner via `auth.uid()`.
- `bills` — RLS enabled; CRUD enforced on `user_id`.
- `events` — RLS enabled; CRUD enforced on `user_id`.
- `goals` — RLS enabled; CRUD enforced on `user_id`.
- `properties` — RLS enabled; CRUD enforced on `user_id`.
- `vehicles` — RLS enabled; CRUD enforced on `user_id`.
- `monthly_budgets` — RLS enabled; CRUD enforced on `user_id`.

### Domain Data & Layout
- `domain_entries` (`20250215_domain_entries.sql`, `20251026_add_rls_policies.sql`, `20251028_critical_rls_fix.sql`, `99999_fix_delete_now.sql`, `fix-delete-rls-policy.sql`) — RLS enabled with full CRUD policies + delete remediation.
- `domain_entries_view` — View depends on RLS of `domain_entries`.
- `dashboard_layouts` (`20250117_dashboard_layouts.sql`, `20251026_add_rls_policies.sql`) — RLS enabled; CRUD constrained to `user_id`.
- `dashboard_aggregates` (`20251025_dashboard_aggregates.sql`) — RLS enabled; policies enforce owner access.
- `notifications` and `notification_settings` (`20250117_notifications.sql`, `20251026_add_rls_policies.sql`) — RLS enabled with user-specific CRUD policies.
- `user_settings` (created in `create-missing-tables.sql`, reinforced in `20251024_add_user_settings.sql`, policies in `20251026_add_rls_policies.sql`) — RLS enabled; CRUD tied to `user_id`.
- `user_preferences` (`20250124_create_call_history_table.sql`) — RLS enabled; CRUD tied to `user_id`.

### Finance & Banking
- `linked_accounts`, `transactions`, `plaid_items`, `transaction_sync_log`, `net_worth_snapshots` (`20250121_plaid_banking.sql`, policies reinforced in `20251026_add_rls_policies.sql`) — RLS enabled with `auth.uid() = user_id` policies across CRUD; sync log and net worth snapshots scoped to owner.
- `budgets` (`20240118000000_create_ai_tools_tables.sql`) — RLS enabled; CRUD restricted to owner.

### Health, Insurance, Pets
- `health_metrics` (`20251029_create_missing_domain_tables.sql`, `20251025_domain_extras.sql`) — RLS enabled; CRUD restricted to owner with trigger upkeep.
- `moods` (`20251025_domain_extras.sql`) — RLS enabled with owner-only policies.
- `health_connections`, `health_sync_log` (`20251021_health_sync.sql`) — RLS enabled; CRUD tied to owner.
- `insurance_policies`, `insurance_claims` (`20251029_create_missing_domain_tables.sql`, `20251025_domain_extras.sql`) — RLS enabled; CRUD restricted to owner.
- `pets` (`20251029_create_missing_domain_tables.sql`) — RLS enabled; CRUD restricted to owner with refreshed policies.

### Travel Domain
- `travel_trips`, `travel_bookings`, `travel_itinerary_days`, `travel_documents`, `travel_saved_destinations` (`20250217_travel_tables.sql`, policies reinforced in `20251026_add_rls_policies.sql`, `20251025_domain_extras.sql`) — RLS enabled; CRUD limited to `auth.uid() = user_id`.

### Appliances Domain
- `appliances`, `appliance_maintenance`, `appliance_costs`, `appliance_warranties` (`20251027_create_appliances_tables.sql`, `20251029120000_add_document_url_to_warranties.sql`) — RLS enabled; CRUD restricted to device owner; warranties table updated with document link retains RLS.

### Relationships Domain
- `relationships`, `relationship_reminders` (`20250123_relationships_tables.sql`) — RLS enabled; CRUD tied to `"userId"`.
- `relationship_events`, `relationship_notes` (policies added in `20251026_add_rls_policies.sql`) — **RLS policies exist but no `CREATE TABLE` located in migrations; flagged for confirmation**.

### Voice AI & Activity Logs
- `call_history`, `user_locations` (`20250124_create_call_history_table.sql`, `20251026_add_rls_policies.sql`) — RLS enabled; CRUD limited to owner.
- `calendar_sync_log` (`20250116_calendar_sync_log.sql`) — RLS enabled; CRUD limited to owner.
- `therapy_conversations`, `therapy_messages`, `therapy_preferences` (`20251031_therapy_chat.sql`) — RLS enabled; policies ensure owner-only visibility and mutation.
- `order_history` (`20251105_create_orders_table.sql`) — RLS enabled; select policy ensures linkage to owned `orders`.

### Commerce & External Data
- `businesses`, `price_quotes` (`20251105_create_businesses_table.sql`) — `businesses` allows public select, service-role write; `price_quotes` locked to owning `user_id`.
- `orders` (`20251105_create_orders_table.sql`) — RLS enabled; CRUD restricted to owner; delete policy limited to safe statuses.

### Documents & Storage
- `documents` (`20250116_documents_table.sql`, RLS reinforcement in `20251026_add_rls_policies.sql`, enhancements `20250202_documents_enhanced.sql`) — RLS enabled; CRUD restricted to owner.
- Storage bucket `documents` (`20251029130000_create_documents_storage_bucket.sql`) — Storage policies ensure users can read/write/delete within own prefix; public read policy explicitly defined.
- `scanned_documents`, `saved_forms`, `tax_documents`, `receipts`, `invoices`, `financial_reports`, `scheduled_events`, `travel_plans`, `meal_plans`, `email_drafts`, `checklists` (`20240118000000_create_ai_tools_tables.sql`) — RLS enabled; CRUD restricted to owner.
- `travel_documents` policies overlap with travel domain (see above).

### Insights & Analytics
- `insights` (initially in `create-missing-tables.sql`, expanded in `20251021_insights.sql`) — RLS enabled; policies enforce owner CRUD.
- `dashboard_aggregates` (see Domain Data section) — owner-only access.

### Property & Vehicle History
- `property_value_history`, `vehicle_value_history`, `vehicle_recalls` (`20251021_property_vehicle_values.sql`) — RLS enabled; policies restrict to owner.

### Miscellaneous & Legacy Support
- `tax_documents`, `receipts`, `invoices`, etc. (AI tools migration) — RLS enabled as noted above.
- `events` triggers and updated_at helpers covered by initial schema; subsequent migrations (`20251023_fix_updated_at_function.sql`, `20251102_fix_expiring_documents_function.sql`) maintain RLS.
- `create-missing-tables.sql` includes migration verification queries ensuring policies exist post-deployment.

## RLS Remediation & Verification Scripts
- `20251028_critical_rls_fix.sql`, `99999_fix_delete_now.sql`, and `fix-delete-rls-policy.sql` provide guardrails against missing policies on `domain_entries`.
- `20251026_add_rls_policies.sql` standardizes policies across user-facing tables, ensuring `ENABLE ROW LEVEL SECURITY` precedes policy definitions.
- Commented verification queries (`pg_tables`, `pg_policies` checks) are available in multiple migrations for post-apply validation.

## Outstanding Items
- Tables `relationship_events` and `relationship_notes` are referenced in RLS policy migration (`20251026_add_rls_policies.sql`) but lack corresponding `CREATE TABLE` statements in the repository; verify whether they exist in a remote migration or require creation.
- Confirm whether any legacy tables referenced in application code (e.g., upcoming `routines`, `nutrition_logs`, `goals` enhancements) still need schema migrations; they remain unchecked in `plan.md` Phase 9.
- Future migrations must continue the established pattern: enable RLS immediately and pair every new table with full CRUD policies before shipping.

## Next Steps
- Address outstanding table creation gaps (relationship event/note tracking) or remove unused policies.
- Proceed to Phase 0 follow-up tasks (mapping localStorage keys, verifying `idb-cache.ts`) using this audit as the authoritative table inventory.
- When running against a live Supabase project, execute the included verification queries to confirm deployment state matches migration intent.














