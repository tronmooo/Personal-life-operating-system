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
  console.log('\n🏃 Checking Fitness Data\n')
  
  const { data, error } = await supabase
    .from('domain_entries')
    .select('id, title, domain, metadata')
    .eq('domain', 'fitness')
    .eq('user_id', USER_ID)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${data.length} fitness entries:\n`)
  
  data.forEach((entry, idx) => {
    console.log(`${idx + 1}. ${entry.title}`)
    console.log(`   ID: ${entry.id.substring(0, 8)}...`)
    console.log(`   Metadata:`, JSON.stringify(entry.metadata, null, 2))
    console.log()
  })
  
  // Also check 'workout' domain (could be stored there)
  const { data: workout } = await supabase
    .from('domain_entries')
    .select('id, title, domain, metadata')
    .eq('domain', 'workout')
    .eq('user_id', USER_ID)
  
  if (workout && workout.length > 0) {
    console.log(`\n📝 Also found ${workout.length} entries in 'workout' domain:\n`)
    workout.forEach((entry, idx) => {
      console.log(`${idx + 1}. ${entry.title}`)
      console.log(`   Metadata:`, JSON.stringify(entry.metadata, null, 2))
      console.log()
    })
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






