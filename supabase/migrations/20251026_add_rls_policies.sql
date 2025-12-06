-- Row Level Security (RLS) Policies for LifeHub
-- Created: 2025-10-26
-- Priority: CRITICAL - Must be applied before production deployment

-- ============================================================================
-- 1. DOMAIN_ENTRIES - Core data table
-- ============================================================================

ALTER TABLE domain_entries ENABLE ROW LEVEL SECURITY;

-- Users can view only their own domain entries
CREATE POLICY "Users can view own domain_entries"
  ON domain_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own domain entries
CREATE POLICY "Users can insert own domain_entries"
  ON domain_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own domain entries
CREATE POLICY "Users can update own domain_entries"
  ON domain_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own domain entries
CREATE POLICY "Users can delete own domain_entries"
  ON domain_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. NOTIFICATIONS - User notifications
-- ============================================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. NOTIFICATION_SETTINGS - User preferences for notifications
-- ============================================================================

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification_settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification_settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification_settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification_settings"
  ON notification_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. DASHBOARD_LAYOUTS - User dashboard configurations
-- ============================================================================

ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dashboard_layouts"
  ON dashboard_layouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboard_layouts"
  ON dashboard_layouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboard_layouts"
  ON dashboard_layouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dashboard_layouts"
  ON dashboard_layouts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. USER_SETTINGS - User preferences
-- ============================================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_settings"
  ON user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. LINKED_ACCOUNTS - Plaid banking connections (CRITICAL - Financial Data)
-- ============================================================================

ALTER TABLE linked_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linked_accounts"
  ON linked_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own linked_accounts"
  ON linked_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own linked_accounts"
  ON linked_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own linked_accounts"
  ON linked_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. TRANSACTIONS - Financial transactions (CRITICAL - Financial Data)
-- ============================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 8. PLAID_ITEMS - Plaid item metadata
-- ============================================================================

ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plaid_items"
  ON plaid_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid_items"
  ON plaid_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid_items"
  ON plaid_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid_items"
  ON plaid_items FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. CALL_HISTORY - Voice AI call logs
-- ============================================================================

ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call_history"
  ON call_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own call_history"
  ON call_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own call_history"
  ON call_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own call_history"
  ON call_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. USER_LOCATIONS - Location tracking (Privacy sensitive)
-- ============================================================================

ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own user_locations"
  ON user_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_locations"
  ON user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_locations"
  ON user_locations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_locations"
  ON user_locations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 11. DOCUMENTS - Uploaded documents
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 12. TRAVEL TABLES - Travel planning data
-- ============================================================================

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_saved_destinations ENABLE ROW LEVEL SECURITY;

-- Travel Trips
CREATE POLICY "Users can view own travel_trips"
  ON travel_trips FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel_trips"
  ON travel_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel_trips"
  ON travel_trips FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel_trips"
  ON travel_trips FOR DELETE
  USING (auth.uid() = user_id);

-- Travel Bookings
CREATE POLICY "Users can view own travel_bookings"
  ON travel_bookings FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel_bookings"
  ON travel_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel_bookings"
  ON travel_bookings FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel_bookings"
  ON travel_bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Travel Itinerary Days
CREATE POLICY "Users can view own travel_itinerary_days"
  ON travel_itinerary_days FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel_itinerary_days"
  ON travel_itinerary_days FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel_itinerary_days"
  ON travel_itinerary_days FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel_itinerary_days"
  ON travel_itinerary_days FOR DELETE
  USING (auth.uid() = user_id);

-- Travel Documents
CREATE POLICY "Users can view own travel_documents"
  ON travel_documents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel_documents"
  ON travel_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel_documents"
  ON travel_documents FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel_documents"
  ON travel_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Travel Saved Destinations
CREATE POLICY "Users can view own travel_saved_destinations"
  ON travel_saved_destinations FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own travel_saved_destinations"
  ON travel_saved_destinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own travel_saved_destinations"
  ON travel_saved_destinations FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own travel_saved_destinations"
  ON travel_saved_destinations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 13. RELATIONSHIPS TABLES - Relationship tracking
-- ============================================================================

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_notes ENABLE ROW LEVEL SECURITY;

-- Relationships
CREATE POLICY "Users can view own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relationships"
  ON relationships FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relationships"
  ON relationships FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own relationships"
  ON relationships FOR DELETE
  USING (auth.uid() = user_id);

-- Relationship Events
CREATE POLICY "Users can view own relationship_events"
  ON relationship_events FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relationship_events"
  ON relationship_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relationship_events"
  ON relationship_events FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own relationship_events"
  ON relationship_events FOR DELETE
  USING (auth.uid() = user_id);

-- Relationship Notes
CREATE POLICY "Users can view own relationship_notes"
  ON relationship_notes FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relationship_notes"
  ON relationship_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relationship_notes"
  ON relationship_notes FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own relationship_notes"
  ON relationship_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these after applying the migration to verify RLS is working:

/*
-- 1. Check that RLS is enabled on all tables:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- 2. List all policies:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Test as authenticated user (should only see own data):
SELECT COUNT(*) FROM domain_entries;  -- Should only show current user's entries

-- 4. Test insert (should only allow if user_id matches):
INSERT INTO domain_entries (user_id, domain, title, metadata)
VALUES (auth.uid(), 'test', 'Test Entry', '{}');  -- Should succeed

-- 5. Test cross-user access (should fail):
SELECT * FROM domain_entries WHERE user_id != auth.uid();  -- Should return empty
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. These policies ensure users can ONLY access their own data
-- 2. Service role key bypasses RLS (for admin operations)
-- 3. Anon key respects RLS (for client-side operations)
-- 4. CRITICAL: Test thoroughly before deploying to production
-- 5. If adding new tables, always add RLS policies immediately
