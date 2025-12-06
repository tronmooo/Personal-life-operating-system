-- Add Your Home Location to Database
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/editor

-- First, get your user_id
-- SELECT id, email FROM auth.users LIMIT 5;

-- Then insert your location (replace YOUR_USER_ID and coordinates)
INSERT INTO user_locations (
  user_id, 
  latitude, 
  longitude, 
  city, 
  state,
  address,
  is_primary
)
VALUES (
  'YOUR_USER_ID',           -- Replace with your user ID from above query
  34.0522,                  -- Replace with your latitude
  -118.2437,                -- Replace with your longitude
  'Your City',              -- Your city name
  'Your State',             -- Your state
  '123 Your Street',        -- Your address (optional)
  true                      -- Make this your primary location
)
ON CONFLICT (user_id) 
DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  address = EXCLUDED.address,
  is_primary = EXCLUDED.is_primary,
  updated_at = NOW();

-- Verify it saved
SELECT * FROM user_locations WHERE user_id = 'YOUR_USER_ID';



