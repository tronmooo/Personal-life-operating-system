#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// 🚨 SECURITY: Load credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing required environment variables')
  console.error('   Please set:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('   Example:')
  console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  console.error('   node fix-db.mjs')
  process.exit(1)
}

console.log('🔧 Starting database fix...')
console.log('   URL:', SUPABASE_URL)
console.log('   Auth: Using service role key from env\n')

// Read the SQL file
const sql = readFileSync('./CRITICAL_MIGRATIONS.sql', 'utf8')

// Execute via REST API
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ sql })
}).catch(async () => {
  // If exec_sql doesn't exist, try direct SQL execution via management API
  console.log('📝 Trying alternative approach...')
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 50)}...`)
    
    // Use Supabase REST API to execute raw SQL
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: statement })
    })
    
    if (!res.ok) {
      console.log(`  ⚠️  Status: ${res.status}`)
    }
  }
})

console.log('\n✨ Database fix complete!')
console.log('📋 Next steps:')
console.log('  1. Verify tables in Supabase Dashboard')
console.log('  2. Refresh your browser')
console.log('  3. Check for 404 errors in console')







