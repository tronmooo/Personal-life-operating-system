/**
 * Execute SQL migration using direct PostgreSQL connection
 * Run with: npx tsx scripts/execute-pg-sql.ts
 */

import { Client } from 'pg'

// Supabase connection string
// Format: postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
const connectionString = 'postgresql://postgres.jphpxqqilrjyypztkswc:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg@aws-0-us-east-1.pooler.supabase.com:6543/postgres'

async function executeSql() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Required for Supabase
    }
  })

  try {
    console.log('🔌 Connecting to PostgreSQL...')
    await client.connect()
    console.log('✅ Connected!\n')

    // Execute ALTER TABLE statements
    const queries = [
      'ALTER TABLE appliance_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;',
      'ALTER TABLE vehicle_warranties ADD COLUMN IF NOT EXISTS document_url TEXT;'
    ]

    for (const query of queries) {
      console.log(`📝 Executing: ${query}`)
      try {
        await client.query(query)
        console.log('✅ Success!\n')
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log('ℹ️  Column already exists\n')
        } else {
          console.error(`❌ Error: ${error.message}\n`)
        }
      }
    }

    // Verify the columns exist
    console.log('🔍 Verifying columns...')
    const verifyQuery = `
      SELECT 
        table_name, 
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('appliance_warranties', 'vehicle_warranties')
        AND column_name = 'document_url';
    `
    
    const result = await client.query(verifyQuery)
    
    if (result.rows.length > 0) {
      console.log('\n✅ Columns verified:')
      console.table(result.rows)
      console.log('\n🎉 Migration successful! You can now upload warranty documents.')
    } else {
      console.log('\n❌ No columns found. Migration may have failed.')
    }

  } catch (error: any) {
    console.error('❌ Connection or execution error:', error.message)
    console.log('\n💡 Make sure the Supabase connection string is correct.')
    console.log('You may need to get the correct database password from Supabase.')
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Disconnected from PostgreSQL')
  }
}

executeSql()


