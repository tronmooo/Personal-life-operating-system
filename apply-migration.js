#!/usr/bin/env node

/**
 * Apply Database Migration - Create Missing Tables
 * Uses pg library to connect directly to Supabase PostgreSQL
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase connection details
// Project: jphpxqqilrjyypztkswc
const connectionString = 'postgresql://postgres:SUPABASE_DB_PASSWORD@db.jphpxqqilrjyypztkswc.supabase.co:5432/postgres'

// For security, password should be in env, but for this one-time migration script:
// Replace SUPABASE_DB_PASSWORD with your actual database password

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║        SUPABASE SCHEMA FIX - CREATE MISSING TABLES           ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')
  
  // Check for database password in env
  const dbPassword = process.env.SUPABASE_DB_PASSWORD
  
  if (!dbPassword) {
    console.log('⚠️  Database password not found in environment.')
    console.log('\n📋 To apply this fix, you have two options:\n')
    console.log('Option 1: Use Supabase Dashboard (RECOMMENDED)')
    console.log('  1. Go to https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    console.log('  2. Navigate to SQL Editor')
    console.log('  3. Copy and paste contents of APPLY_THIS_SQL_NOW.sql')
    console.log('  4. Click "Run"\n')
    console.log('Option 2: Use this script with database password')
    console.log('  export SUPABASE_DB_PASSWORD="your-db-password"')
    console.log('  node apply-migration.js\n')
    console.log('The SQL file to apply: APPLY_THIS_SQL_NOW.sql\n')
    process.exit(1)
  }
  
  // Read SQL file
  const sqlPath = path.join(__dirname, 'APPLY_THIS_SQL_NOW.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: APPLY_THIS_SQL_NOW.sql not found!')
    process.exit(1)
  }
  
  const sql = fs.readFileSync(sqlPath, 'utf8')
  
  // Create PostgreSQL client
  const client = new Client({
    connectionString: connectionString.replace('SUPABASE_DB_PASSWORD', dbPassword),
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully!\n')
    
    console.log('🚀 Executing SQL migration...\n')
    
    // Execute the entire SQL as one transaction
    await client.query('BEGIN')
    
    try {
      await client.query(sql)
      await client.query('COMMIT')
      
      console.log('✅ SQL migration executed successfully!\n')
      
      // Verify tables were created
      console.log('🔍 Verifying tables...\n')
      
      const { rows } = await client.query(`
        SELECT table_name, 
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        AND table_name IN ('health_metrics', 'insurance_policies', 'insurance_claims')
        ORDER BY table_name
      `)
      
      if (rows.length > 0) {
        console.log('📊 Tables created:')
        rows.forEach(row => {
          console.log(`   ✅ ${row.table_name} (${row.column_count} columns)`)
        })
      } else {
        console.log('⚠️  No tables found - they may already exist')
      }
      
      console.log('\n🎉 Schema fix completed successfully!\n')
      console.log('Next steps:')
      console.log('1. Restart your Next.js dev server')
      console.log('2. Navigate to http://localhost:3000/domains/health')
      console.log('3. Try adding a health metric')
      console.log('4. Navigate to http://localhost:3000/domains/insurance')
      console.log('5. Try adding an insurance policy\n')
      
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
    
  } catch (error) {
    console.error('\n❌ Error executing migration:', error.message)
    console.error('\nFull error:', error)
    console.log('\n💡 If you see "already exists" errors, the tables may have already been created.')
    console.log('   This is OK! You can verify by checking the Supabase dashboard.\n')
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed.')
  }
}

main()

