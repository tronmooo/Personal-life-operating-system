#!/usr/bin/env node
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkVehicles() {
  const { data: vehicles, error } = await supabase
    .from('domain_entries')
    .select('id, title, domain, metadata')
    .eq('domain', 'vehicles')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  const actualVehicles = vehicles.filter(v => {
    const meta = v.metadata || {}
    const type = (meta.type || meta.itemType || '').toLowerCase()
    return type === 'vehicle' || type === ''
  })
  
  console.log(`\n📊 Total vehicle-related entries: ${vehicles.length}`)
  console.log(`🚗 Actual vehicles: ${actualVehicles.length}\n`)
  
  actualVehicles.forEach((v, idx) => {
    console.log(`${idx + 1}. ${v.title} (ID: ${v.id})`)
  })
  
  console.log('\n')
}

checkVehicles().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






