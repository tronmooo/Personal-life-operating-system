/**
 * Create subscription tables step by step
 * Run with: node scripts/create-tables-stepbystep.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, serviceRoleKey)

console.log('🚀 Creating subscription tables programmatically...\n')
console.log('⚠️  NOTE: This uses the Supabase Data API which may have limitations.')
console.log('   For best results, apply the migration via Supabase Studio SQL Editor.\n')

async function executeRawSQL(sql) {
  // Use PostgREST's RPC functionality
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  })

  const result = await response.json()
  return { data: result, error: response.ok ? null : result }
}

console.log('📝 Instructions to apply migration manually:\n')
console.log('1. Open Supabase Studio:')
console.log('   https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc\n')

console.log('2. Click "SQL Editor" in the left sidebar\n')

console.log('3. Click "New Query" button\n')

console.log('4. Copy the ENTIRE contents of this file:')
console.log('   supabase/migrations/20251211_subscriptions_schema.sql\n')

console.log('5. Paste into the SQL editor\n')

console.log('6. Click "Run" or press Cmd+Enter\n')

console.log('7. Wait for success message\n')

console.log('8. Run this script to verify:')
console.log('   node scripts/apply-migration-direct.mjs\n')

console.log('=' .repeat(70))
console.log('📋 Migration SQL Preview:')
console.log('=' .repeat(70))
console.log(`
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  next_due_date DATE NOT NULL,
  ...and more fields
);

-- Plus indexes, RLS policies, views, and functions
`)
console.log('=' .repeat(70))
console.log('\n💡 TIP: The full SQL is in supabase/migrations/20251211_subscriptions_schema.sql\n')

console.log('🔒 Authentication Note:')
console.log('   Row Level Security (RLS) is enabled on these tables.')
console.log('   You must be logged in to your app to insert/read subscription data.\n')

console.log('🧪 After applying the migration:')
console.log('   1. Start dev server: npm run dev')
console.log('   2. Log in to your app')
console.log('   3. Visit: http://localhost:3000/domains/digital')
console.log('   4. Test adding a subscription!\n')


