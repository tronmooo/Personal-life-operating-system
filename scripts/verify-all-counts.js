#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '3d67799c-7367-41a8-b4da-a7598c02f346'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function main() {
  console.log('\n📊 Verifying All Domain Counts\n')
  
  const { data: all, error } = await supabase
    .from('domain_entries')
    .select('domain')
    .eq('user_id', USER_ID)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  const counts = {}
  all.forEach(entry => {
    counts[entry.domain] = (counts[entry.domain] || 0) + 1
  })
  
  console.log('Database Counts:')
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([domain, count]) => {
    console.log(`  ${domain.padEnd(20)}: ${count}`)
  })
  
  console.log(`\n  ${'TOTAL'.padEnd(20)}: ${all.length}`)
  
  console.log('\n' + '='.repeat(50))
  console.log('UI Showing (from console log):')
  console.log('  health              : 64')
  console.log('  fitness             : 5')
  console.log('  pets                : 26')
  console.log('  vehicles            : 18')
  console.log('\nℹ️  Any discrepancies indicate stale test data in the database!')
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






