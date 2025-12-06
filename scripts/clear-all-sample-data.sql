-- ============================================================================
-- CLEAR ALL SAMPLE/MOCK DATA FROM DATABASE
-- ============================================================================
-- This will delete ALL data for your user account, giving you a fresh start
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- SAFETY CHECK: First, let's see what will be deleted
-- Uncomment the SELECT statements below to preview before deleting

-- Preview counts per domain:
-- SELECT domain, COUNT(*) as count 
-- FROM domain_entries 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
-- GROUP BY domain 
-- ORDER BY domain;

-- Preview total entries:
-- SELECT COUNT(*) as total_entries
-- FROM domain_entries 
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- ============================================================================
-- DELETE ALL DOMAIN ENTRIES (Financial, Health, Vehicles, Home, etc.)
-- ============================================================================
DELETE FROM domain_entries 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- ============================================================================
-- DELETE OTHER DATA TABLES
-- ============================================================================

-- Tasks
DELETE FROM tasks 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Habits
DELETE FROM habits 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Events/Calendar
DELETE FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Notifications
DELETE FROM notifications 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Dashboard Layouts
DELETE FROM dashboard_layouts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Call History (Voice AI)
DELETE FROM call_history 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Travel tables
DELETE FROM travel_bookings 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM travel_itineraries 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Relationship tables
DELETE FROM relationships_contacts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM relationships_events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Plaid/Banking
DELETE FROM plaid_accounts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM plaid_transactions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Appliances
DELETE FROM appliances 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM warranties 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM maintenance_logs 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Finance tables
DELETE FROM finance_accounts 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

DELETE FROM finance_transactions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- Documents
DELETE FROM documents 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- AI Insights
DELETE FROM insights 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- ============================================================================
-- VERIFICATION - Check that everything is deleted
-- ============================================================================
SELECT 'domain_entries' as table_name, COUNT(*) as remaining_count
FROM domain_entries 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
UNION ALL
SELECT 'tasks', COUNT(*)
FROM tasks 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
UNION ALL
SELECT 'habits', COUNT(*)
FROM habits 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
UNION ALL
SELECT 'events', COUNT(*)
FROM events 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com')
UNION ALL
SELECT 'notifications', COUNT(*)
FROM notifications 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@aol.com');

-- ============================================================================
-- SUCCESS! All sample/mock data has been deleted.
-- Refresh your app and you should see "No data" everywhere.
-- ============================================================================

