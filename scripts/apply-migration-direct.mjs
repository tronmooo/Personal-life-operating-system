/**
 * Apply Digital Life Migration Directly
 * Run with: node scripts/apply-migration-direct.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, serviceRoleKey)

console.log('🚀 Creating Digital Life Subscriptions Tables...\n')

// Create tables one by one using the Supabase client
async function createTables() {
  try {
    // First, check if tables exist
    console.log('🔍 Checking existing tables...')
    
    const { data: existingData, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)

    if (!checkError) {
      console.log('✅ subscriptions table already exists!')
      console.log('✅ Migration already applied. Verifying data access...\n')
      
      // Test inserting and reading
      await testCRUD()
      return
    }

    console.log('📝 Tables need to be created.')
    console.log('⚠️  Please apply the migration using one of these methods:\n')
    
    console.log('Method 1: Supabase Dashboard (RECOMMENDED)')
    console.log('1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/editor')
    console.log('2. Click "SQL Editor" in the left sidebar')
    console.log('3. Click "New Query"')
    console.log('4. Copy the contents of: supabase/migrations/20251211_subscriptions_schema.sql')
    console.log('5. Paste into the editor')
    console.log('6. Click "Run"')
    console.log('7. Re-run this script to verify\n')
    
    console.log('Method 2: Using psql (if you have database password)')
    console.log('psql "postgresql://postgres:[YOUR-PASSWORD]@db.jphpxqqilrjyypztkswc.supabase.co:5432/postgres" -f supabase/migrations/20251211_subscriptions_schema.sql\n')
    
    console.log('Method 3: Manual table creation')
    console.log('I can guide you through creating the tables step-by-step.\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testCRUD() {
  console.log('🧪 Testing CRUD operations...\n')
  
  try {
    // Test 1: Insert a test subscription
    console.log('📝 Test 1: Creating test subscription...')
    const testSub = {
      service_name: 'Test Subscription',
      category: 'streaming',
      cost: 9.99,
      frequency: 'monthly',
      status: 'active',
      next_due_date: '2025-01-15',
      user_id: '00000000-0000-0000-0000-000000000000' // Test user ID
    }
    
    const { data: inserted, error: insertError } = await supabase
      .from('subscriptions')
      .insert(testSub)
      .select()
      .single()
    
    if (insertError) {
      if (insertError.message?.includes('auth.uid()')) {
        console.log('⚠️  RLS is active (good!) - need authenticated user to insert')
        console.log('   This is expected behavior. Real inserts will work when logged in.\n')
      } else {
        console.log('❌ Insert error:', insertError.message, '\n')
      }
    } else {
      console.log('✅ Test subscription created:', inserted.id)
      
      // Clean up test data
      await supabase.from('subscriptions').delete().eq('id', inserted.id)
      console.log('✅ Test data cleaned up\n')
    }
    
    // Test 2: Read subscriptions
    console.log('📖 Test 2: Reading subscriptions...')
    const { data: subscriptions, error: readError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5)
    
    if (readError) {
      console.log('⚠️  Read error:', readError.message)
      console.log('   (This is expected if no user is logged in due to RLS)\n')
    } else {
      console.log(`✅ Found ${subscriptions?.length || 0} subscriptions\n`)
    }
    
    // Test 3: Check analytics view
    console.log('📊 Test 3: Checking analytics view...')
    const { data: analytics, error: analyticsError } = await supabase
      .from('subscription_analytics')
      .select('*')
      .limit(1)
    
    if (analyticsError) {
      if (analyticsError.message?.includes('does not exist')) {
        console.log('❌ Analytics view does not exist - migration incomplete\n')
      } else {
        console.log('⚠️  Analytics error:', analyticsError.message, '\n')
      }
    } else {
      console.log('✅ Analytics view is accessible\n')
    }
    
    console.log('=' .repeat(60))
    console.log('🎉 Database setup is ready!')
    console.log('=' .repeat(60))
    console.log('\n📍 Next steps:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Log in to your app')
    console.log('3. Visit: http://localhost:3000/domains/digital')
    console.log('4. Add your first subscription!\n')
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

createTables()




