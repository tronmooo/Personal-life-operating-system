/**
 * Execute migration via Supabase REST API
 * Run with: node scripts/execute-migration-api.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PROJECT_REF = 'jphpxqqilrjyypztkswc'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`

async function executeSQLQuery(query) {
  // Use the Supabase Management API
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY
    },
    body: JSON.stringify({ query })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function applyMigration() {
  console.log('🚀 Applying Digital Life Subscriptions Migration...\n')

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20251211_subscriptions_schema.sql')
    const sqlContent = readFileSync(migrationPath, 'utf8')

    console.log('📖 Executing SQL migration...')
    console.log(`   File: ${migrationPath}`)
    console.log(`   Size: ${sqlContent.length} characters\n`)

    // Execute the full migration at once
    console.log('⚙️  Running migration...')
    const result = await executeSQLQuery(sqlContent)
    
    console.log('✅ Migration executed successfully!\n')
    console.log('Result:', JSON.stringify(result, null, 2))

    // Verify tables exist
    console.log('\n🔍 Verifying tables...')
    
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscriptions', 'subscription_charges')
      ORDER BY table_name;
    `
    
    const tables = await executeSQLQuery(verifyQuery)
    console.log('✅ Tables found:', tables)

    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📍 Next steps:')
    console.log('1. Run: npm run dev')
    console.log('2. Visit: http://localhost:3000/domains/digital')
    console.log('3. Add subscriptions and test!\n')

  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    console.error('\n📝 Please apply manually using Supabase Studio:')
    console.log('1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    console.log('2. Click "SQL Editor"')
    console.log('3. Click "New Query"')
    console.log('4. Copy contents of: supabase/migrations/20251211_subscriptions_schema.sql')
    console.log('5. Paste and click "Run"\n')
    process.exit(1)
  }
}

applyMigration()


