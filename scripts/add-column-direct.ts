/**
 * Script to add document_url column using direct SQL execution
 * Run with: npx tsx scripts/add-column-direct.ts
 */

async function addColumns() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY')
    console.error('\nPlease set these in your .env.local file')
    process.exit(1)
  }

  console.log('🔧 Adding document_url columns directly...\n')

  const queries = [
    'ALTER TABLE appliance_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;',
    'ALTER TABLE vehicle_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;'
  ]

  for (const query of queries) {
    console.log(`📝 Executing: ${query}`)
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ query })
      })

      if (response.ok) {
        console.log('✅ Success\n')
      } else {
        const errorText = await response.text()
        console.log(`❌ Response: ${response.status} - ${errorText}\n`)
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}\n`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 MANUAL STEPS REQUIRED:')
  console.log('='.repeat(60))
  console.log('\nSince automated migration isn\'t working, please:')
  console.log('\n1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
  console.log('2. Click on "SQL Editor" in the left sidebar')
  console.log('3. Click "New Query"')
  console.log('4. Paste and run this SQL:\n')
  console.log('─'.repeat(60))
  console.log(`
-- Add document_url to warranty tables
ALTER TABLE appliance_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

ALTER TABLE vehicle_warranties 
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('appliance_warranties', 'vehicle_warranties')
  AND column_name = 'document_url';
  `)
  console.log('─'.repeat(60))
  console.log('\n5. Click "Run" (or press Cmd/Ctrl + Enter)')
  console.log('6. You should see the query succeed')
  console.log('7. Then try uploading the warranty again!\n')
}

addColumns()


