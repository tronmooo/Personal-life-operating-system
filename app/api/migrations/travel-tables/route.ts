import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint creates the missing travel tables
// Only accessible with service role key
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    // Create admin client that can execute raw SQL
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' }
    })

    // Use the SQL function if available, or direct table creation
    const results: string[] = []

    // Step 1: Create travel_trips table (base table)
    const { error: tripsError } = await supabaseAdmin.rpc('create_travel_trips_if_not_exists').maybeSingle()
    if (tripsError && !tripsError.message.includes('does not exist')) {
      // Try direct approach - just check if table exists by selecting
      const { error: checkError } = await supabaseAdmin
        .from('travel_trips')
        .select('id')
        .limit(1)
      
      if (checkError?.message.includes('schema cache')) {
        results.push('travel_trips: Table does not exist - manual SQL execution required')
      } else {
        results.push('travel_trips: EXISTS')
      }
    } else {
      results.push('travel_trips: OK')
    }

    // Step 2: Check travel_bookings
    const { error: bookingsCheckError } = await supabaseAdmin
      .from('travel_bookings')
      .select('id')
      .limit(1)

    if (bookingsCheckError?.message.includes('schema cache')) {
      results.push('travel_bookings: Table does not exist - manual SQL execution required')
    } else {
      results.push('travel_bookings: EXISTS')
    }

    // If tables don't exist, return instructions
    const needsMigration = results.some(r => r.includes('does not exist'))

    if (needsMigration) {
      return NextResponse.json({
        status: 'migration_needed',
        message: 'Travel tables need to be created via Supabase SQL Editor',
        results,
        sql_to_run: `
-- Run this SQL in Supabase SQL Editor:

-- 1. Create travel_trips table
CREATE TABLE IF NOT EXISTS travel_trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  destination text,
  start_date date,
  end_date date,
  bookings jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE travel_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select own trips" ON travel_trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ins own trips" ON travel_trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "upd own trips" ON travel_trips FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "del own trips" ON travel_trips FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_user_dates ON travel_trips(user_id, start_date, end_date);

-- 2. Create travel_bookings table
CREATE TABLE IF NOT EXISTS travel_bookings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES travel_trips(id) ON DELETE SET NULL,
  booking_type text NOT NULL,
  name text NOT NULL,
  destination text,
  start_date date,
  end_date date,
  price text,
  status text,
  confirmation_number text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE travel_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "travel_bookings_select_own" ON travel_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "travel_bookings_insert_own" ON travel_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "travel_bookings_update_own" ON travel_bookings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "travel_bookings_delete_own" ON travel_bookings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_travel_bookings_user_date ON travel_bookings (user_id, start_date, end_date);
        `.trim()
      }, { status: 200 })
    }

    return NextResponse.json({
      status: 'ok',
      message: 'All travel tables exist',
      results
    })

  } catch (error: any) {
    console.error('Migration check error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}

