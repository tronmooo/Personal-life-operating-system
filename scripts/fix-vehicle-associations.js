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
  console.log('\n🔧 Fixing Vehicle Associations\n')
  
  // Find the 2021 hond crv
  const { data: vehicles } = await supabase
    .from('domain_entries')
    .select('id, title, metadata')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
    .ilike('title', '%2021%hond%crv%')
  
  if (!vehicles || vehicles.length === 0) {
    console.log('❌ Could not find "2021 hond crv" vehicle')
    console.log('   Let me search for all vehicles with "hond" in the title:\n')
    
    const { data: hondas } = await supabase
      .from('domain_entries')
      .select('id, title')
      .eq('domain', 'vehicles')
      .eq('user_id', USER_ID)
      .ilike('title', '%hond%')
    
    if (hondas && hondas.length > 0) {
      console.log('Found Honda vehicles:')
      hondas.forEach(v => console.log(`   - ${v.title} (${v.id.substring(0, 8)}...)`))
    }
    return
  }
  
  const targetVehicle = vehicles[0]
  console.log(`✅ Found vehicle: ${targetVehicle.title}`)
  console.log(`   ID: ${targetVehicle.id}\n`)
  
  // Find our test cost and warranty
  const { data: cost } = await supabase
    .from('domain_entries')
    .select('id, title')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
    .eq('title', 'Fuel - Shell Station')
    .single()
  
  const { data: warranty } = await supabase
    .from('domain_entries')
    .select('id, title')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
    .eq('title', 'Extended Warranty - Honda Care')
    .single()
  
  if (cost) {
    console.log(`📝 Updating cost: ${cost.title}`)
    const { error } = await supabase
      .from('domain_entries')
      .update({
        metadata: {
          type: 'cost',
          costType: 'fuel',
          amount: 65.50,
          date: new Date().toISOString().split('T')[0],
          mileage: 63500,
          vehicleId: targetVehicle.id
        }
      })
      .eq('id', cost.id)
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Updated to point to ${targetVehicle.title}`)
    }
  }
  
  if (warranty) {
    console.log(`\n📝 Updating warranty: ${warranty.title}`)
    const { error } = await supabase
      .from('domain_entries')
      .update({
        metadata: {
          type: 'warranty',
          provider: 'Honda Financial Services',
          coverage: 'Powertrain + Roadside Assistance',
          startDate: '2025-01-01',
          endDate: '2030-01-01',
          cost: 2500,
          deductible: 100,
          vehicleId: targetVehicle.id
        }
      })
      .eq('id', warranty.id)
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Updated to point to ${targetVehicle.title}`)
    }
  }
  
  console.log('\n✅ Done! Refresh the vehicles page to see the costs and warranties.\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})






