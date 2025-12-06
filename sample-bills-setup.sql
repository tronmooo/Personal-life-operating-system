-- ========================================
-- COMPREHENSIVE BILLS & SUBSCRIPTIONS SETUP
-- Run this in your Supabase SQL Editor
-- Replace 'YOUR_USER_ID' with your actual user_id
-- ========================================

-- Get your user_id first:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- ========================================
-- 1. UTILITIES (Monthly Bills)
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Electric Bill', 150.00, '2025-11-20', 'Utilities', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Water Bill', 45.00, '2025-11-22', 'Utilities', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Gas Bill', 80.00, '2025-11-25', 'Utilities', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Internet - Comcast', 79.99, '2025-11-15', 'Utilities', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Cell Phone - Verizon', 65.00, '2025-11-18', 'Utilities', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Trash & Recycling', 35.00, '2025-11-28', 'Utilities', 'pending', true, NOW());

-- ========================================
-- 2. HOUSING (Rent/Mortgage & Related)
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Rent / Mortgage', 1500.00, '2025-12-01', 'Housing', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'HOA Fees', 200.00, '2025-11-30', 'Housing', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Property Tax (Monthly)', 350.00, '2025-12-15', 'Housing', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Home Security - ADT', 49.99, '2025-11-25', 'Housing', 'pending', true, NOW());

-- ========================================
-- 3. INSURANCE (All Policies)
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Car Insurance', 180.00, '2025-12-05', 'Insurance', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Health Insurance Premium', 300.00, '2025-12-01', 'Insurance', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Home/Renters Insurance', 120.00, '2025-12-10', 'Insurance', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Life Insurance', 50.00, '2025-12-03', 'Insurance', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Dental Insurance', 35.00, '2025-12-01', 'Insurance', 'pending', true, NOW());

-- ========================================
-- 4. STREAMING SUBSCRIPTIONS
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Netflix Premium', 15.99, '2025-11-20', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Spotify Premium', 9.99, '2025-11-22', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Disney+', 7.99, '2025-11-25', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Hulu', 14.99, '2025-11-28', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'HBO Max', 15.99, '2025-12-02', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Apple TV+', 6.99, '2025-11-30', 'Entertainment', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'YouTube Premium', 11.99, '2025-12-05', 'Entertainment', 'pending', true, NOW());

-- ========================================
-- 5. CLOUD & SOFTWARE SUBSCRIPTIONS
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Amazon Prime', 14.99, '2025-11-28', 'Shopping', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'iCloud Storage 200GB', 2.99, '2025-11-30', 'Technology', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Google One 100GB', 1.99, '2025-12-01', 'Technology', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Dropbox Plus', 11.99, '2025-12-05', 'Technology', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Adobe Creative Cloud', 54.99, '2025-12-01', 'Software', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Microsoft 365', 6.99, '2025-11-25', 'Software', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Grammarly Premium', 12.00, '2025-12-08', 'Software', 'pending', true, NOW());

-- ========================================
-- 6. FITNESS & HEALTH
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Gym Membership', 45.00, '2025-11-20', 'Health', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Yoga Studio', 35.00, '2025-11-25', 'Health', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Meal Prep Service', 89.99, '2025-11-23', 'Health', 'pending', true, NOW());

-- ========================================
-- 7. CREDIT CARDS & LOANS
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Visa Credit Card Payment', 500.00, '2025-11-25', 'Financial', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Mastercard Payment', 300.00, '2025-12-03', 'Financial', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'American Express', 250.00, '2025-12-08', 'Financial', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Car Loan Payment', 350.00, '2025-12-01', 'Auto', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Student Loan', 200.00, '2025-12-10', 'Education', 'pending', true, NOW());

-- ========================================
-- 8. PROFESSIONAL & EDUCATION
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'LinkedIn Premium', 29.99, '2025-11-20', 'Professional', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Coursera Plus', 59.00, '2025-12-01', 'Education', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Audible Membership', 14.95, '2025-11-22', 'Entertainment', 'pending', true, NOW());

-- ========================================
-- 9. MISCELLANEOUS
-- ========================================
INSERT INTO bills (user_id, title, amount, due_date, category, status, recurring, created_at) VALUES
  ('YOUR_USER_ID', 'Pet Insurance', 45.00, '2025-11-30', 'Pets', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Charity Donation', 50.00, '2025-12-01', 'Charity', 'pending', true, NOW()),
  ('YOUR_USER_ID', 'Storage Unit', 85.00, '2025-12-05', 'Other', 'pending', true, NOW());

-- ========================================
-- SUMMARY OF BILLS ADDED
-- ========================================
-- Run this to verify:
-- SELECT category, COUNT(*) as count, SUM(amount) as total 
-- FROM bills 
-- WHERE user_id = 'YOUR_USER_ID'
-- GROUP BY category 
-- ORDER BY total DESC;

-- ========================================
-- EXPECTED TOTALS (Approximate):
-- ========================================
-- Utilities: ~$455
-- Housing: ~$2,100
-- Insurance: ~$685
-- Entertainment/Streaming: ~$84
-- Technology/Software: ~$91
-- Health/Fitness: ~$170
-- Financial (Credit Cards/Loans): ~$1,600
-- Professional/Education: ~$104
-- Miscellaneous: ~$180
-- ========================================
-- TOTAL MONTHLY: ~$5,469
-- ========================================



