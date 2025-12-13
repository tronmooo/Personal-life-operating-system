#!/usr/bin/env node
/**
 * Run the service_providers migration directly via postgres
 */

import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Supabase connection details
const DATABASE_URL = 'postgresql://postgres.jphpxqqilrjyypztkswc:jBBfVuLcjRLQsWzT@aws-0-us-west-1.pooler.supabase.com:5432/postgres'

const { Pool } = pg

async function runMigration() {
  console.log('🚀 Running service_providers migration...\n')

  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // Test connection
    const testResult = await pool.query('SELECT NOW()')
    console.log('✅ Connected to database at:', testResult.rows[0].now)

    // Check if table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'service_providers'
      )
    `)

    if (checkResult.rows[0].exists) {
      console.log('ℹ️  Table service_providers already exists')
      
      // Show counts
      const counts = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM service_providers) as providers,
          (SELECT COUNT(*) FROM service_payments) as payments,
          (SELECT COUNT(*) FROM service_documents) as documents
      `)
      console.log(`   Providers: ${counts.rows[0].providers}`)
      console.log(`   Payments: ${counts.rows[0].payments}`)
      console.log(`   Documents: ${counts.rows[0].documents}`)
      return true
    }

    console.log('📋 Creating tables...')

    // Read migration file
    const migrationPath = join(__dirname, '../supabase/migrations/20251211_service_providers_schema.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    // Split by statement and execute
    // We need to be careful with dollar-quoted strings
    const statements = splitSQLStatements(migrationSQL)
    
    let successCount = 0
    let errorCount = 0
    
    for (const stmt of statements) {
      const trimmed = stmt.trim()
      if (!trimmed || trimmed.startsWith('--')) continue
      
      try {
        await pool.query(trimmed)
        successCount++
        process.stdout.write('.')
      } catch (err) {
        // Some errors are expected (like "already exists")
        if (!err.message.includes('already exists')) {
          console.log(`\n⚠️  Warning: ${err.message.slice(0, 100)}`)
          errorCount++
        }
      }
    }

    console.log(`\n\n✅ Migration complete! ${successCount} statements executed.`)
    if (errorCount > 0) {
      console.log(`   (${errorCount} warnings)`)
    }

    return true

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    // If connection fails, provide manual instructions
    if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('\n📋 Please run the migration manually in Supabase Dashboard:')
      console.log('   1. Go to: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new')
      console.log('   2. Copy and paste the contents of:')
      console.log('      supabase/migrations/20251211_service_providers_schema.sql')
      console.log('   3. Click "Run"')
    }
    
    return false
  } finally {
    await pool.end()
  }
}

// Simple SQL statement splitter that handles dollar-quoted strings
function splitSQLStatements(sql) {
  const statements = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''
  
  const lines = sql.split('\n')
  
  for (const line of lines) {
    // Check for dollar quotes
    const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/)
    if (dollarMatch) {
      if (!inDollarQuote) {
        inDollarQuote = true
        dollarTag = dollarMatch[0]
      } else if (line.includes(dollarTag)) {
        inDollarQuote = false
        dollarTag = ''
      }
    }
    
    current += line + '\n'
    
    // If we're not in a dollar quote and line ends with ;, it's end of statement
    if (!inDollarQuote && line.trim().endsWith(';')) {
      statements.push(current.trim())
      current = ''
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim())
  }
  
  return statements
}

runMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })




