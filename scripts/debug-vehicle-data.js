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
  console.log('\n🔍 Debugging Vehicle Data\n')
  
  // Get all vehicle domain entries
  const { data: all, error } = await supabase
    .from('domain_entries')
    .select('id, title, domain, metadata')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`📊 Found ${all.length} vehicle-related entries:\n`)
  
  all.forEach((entry, idx) => {
    const meta = entry.metadata || {}
    const type = meta.type || meta.itemType || 'unknown'
    console.log(`${idx + 1}. ${entry.title}`)
    console.log(`   ID: ${entry.id}`)
    console.log(`   Type: ${type}`)
    if (meta.vehicleId) {
      console.log(`   Vehicle ID: ${meta.vehicleId}`)
    }
    if (meta.amount) {
      console.log(`   Amount: $${meta.amount}`)
    }
    if (meta.cost) {
      console.log(`   Cost: $${meta.cost}`)
    }
    console.log()
  })
  
  // Find actual vehicles (not costs/warranties)
  const vehicles = all.filter(e => {
    const meta = e.metadata || {}
    const type = (meta.type || meta.itemType || '').toLowerCase()
    return type === 'vehicle' || type === '' || !type
  })
  
  console.log(`\n🚗 Actual vehicles (${vehicles.length}):`)
  vehicles.forEach(v => {
    console.log(`   - ${v.title} (ID: ${v.id.substring(0, 8)}...)`)
  })
  
  // Find costs
  const costs = all.filter(e => {
    const meta = e.metadata || {}
    const type = (meta.type || '').toLowerCase()
    return type === 'cost'
  })
  
  console.log(`\n💰 Costs (${costs.length}):`)
  costs.forEach(c => {
    const meta = c.metadata || {}
    console.log(`   - ${c.title} ($${meta.amount || 0})`)
    console.log(`     Vehicle ID: ${meta.vehicleId || 'NONE'}`)
  })
  
  // Find warranties
  const warranties = all.filter(e => {
    const meta = e.metadata || {}
    const type = (meta.type || '').toLowerCase()
    return type === 'warranty'
  })
  
  console.log(`\n🛡️  Warranties (${warranties.length}):`)
  warranties.forEach(w => {
    const meta = w.metadata || {}
    console.log(`   - ${w.title}`)
    console.log(`     Vehicle ID: ${meta.vehicleId || 'NONE'}`)
    console.log(`     Cost: $${meta.cost || 0}`)
  })
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






