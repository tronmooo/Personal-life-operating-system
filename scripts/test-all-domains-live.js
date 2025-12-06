#!/usr/bin/env node
/**
 * Comprehensive live testing script
 * Tests: Insurance, Vehicles (costs, warranties), Pets (vaccines, costs)
 * Verifies data shows in: Database, Domain pages, Command center
 */

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

// Test data to add
const testData = {
  insurance: {
    domain: 'insurance',
    title: 'Test Health Insurance',
    description: 'Blue Cross PPO - Family Plan',
    metadata: {
      type: 'policy',
      policyType: 'Health',
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'HC-TEST-123456',
      premium: 450,
      coverage: 500000,
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    },
    user_id: USER_ID
  },
  vehicleCost: {
    domain: 'vehicles',
    title: 'Fuel - Shell Station',
    description: 'Weekly fuel fill-up',
    metadata: {
      type: 'cost',
      costType: 'fuel',
      amount: 65.50,
      date: new Date().toISOString().split('T')[0],
      mileage: 63500,
      vehicleId: null // Will set dynamically
    },
    user_id: USER_ID
  },
  vehicleWarranty: {
    domain: 'vehicles',
    title: 'Extended Warranty - Honda Care',
    description: '5 year / 100,000 mile powertrain warranty',
    metadata: {
      type: 'warranty',
      provider: 'Honda Financial Services',
      coverage: 'Powertrain + Roadside Assistance',
      startDate: '2025-01-01',
      endDate: '2030-01-01',
      cost: 2500,
      deductible: 100,
      vehicleId: null // Will set dynamically
    },
    user_id: USER_ID
  },
  petVaccine: {
    domain: 'pets',
    title: 'Rabies Vaccine - Max',
    description: 'Annual rabies vaccination',
    metadata: {
      type: 'vaccine',
      vaccineName: 'Rabies',
      date: new Date().toISOString().split('T')[0],
      nextDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      veterinarian: 'City Vet Clinic',
      cost: 45,
      petId: null // Will set dynamically
    },
    user_id: USER_ID
  },
  petCost: {
    domain: 'pets',
    title: 'Vet Visit - Max Checkup',
    description: 'Annual wellness exam',
    metadata: {
      type: 'cost',
      costType: 'veterinary',
      amount: 125,
      date: new Date().toISOString().split('T')[0],
      service: 'Annual Wellness Exam',
      veterinarian: 'City Vet Clinic',
      petId: null // Will set dynamically
    },
    user_id: USER_ID
  }
}

async function getFirstVehicle() {
  const { data } = await supabase
    .from('domain_entries')
    .select('id, title')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
    .limit(1)
    .single()
  
  return data
}

async function getFirstPet() {
  const { data } = await supabase
    .from('domain_entries')
    .select('id, title')
    .eq('domain', 'pets')
    .eq('user_id', USER_ID)
    .limit(1)
    .single()
  
  return data
}

async function addTestData(name, data) {
  console.log(`\n📝 Adding ${name}...`)
  
  const { data: result, error } = await supabase
    .from('domain_entries')
    .insert(data)
    .select()
    .single()
  
  if (error) {
    console.error(`   ❌ Failed: ${error.message}`)
    return null
  }
  
  console.log(`   ✅ Added: ${result.title} (ID: ${result.id.substring(0, 8)}...)`)
  return result
}

async function verifyInDatabase(name, id) {
  const { data, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !data) {
    console.log(`   ❌ NOT in database`)
    return false
  }
  
  console.log(`   ✅ In database: ${data.title}`)
  return true
}

async function getDomainCounts() {
  const domains = ['insurance', 'vehicles', 'pets', 'fitness', 'relationships']
  const counts = {}
  
  for (const domain of domains) {
    const { count, error } = await supabase
      .from('domain_entries')
      .select('id', { count: 'exact', head: true })
      .eq('domain', domain)
      .eq('user_id', USER_ID)
    
    counts[domain] = error ? 0 : (count || 0)
  }
  
  return counts
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   Live Domain Testing                                  ║')
  console.log('║   Insurance, Vehicles, Pets                            ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  
  // Get counts before
  console.log('📊 Domain Counts BEFORE:')
  const beforeCounts = await getDomainCounts()
  Object.entries(beforeCounts).forEach(([domain, count]) => {
    console.log(`   ${domain.padEnd(15)}: ${count}`)
  })
  
  // Get vehicle for association
  console.log('\n🔍 Finding vehicle for cost/warranty association...')
  const vehicle = await getFirstVehicle()
  if (vehicle) {
    console.log(`   ✅ Found: ${vehicle.title}`)
    testData.vehicleCost.metadata.vehicleId = vehicle.id
    testData.vehicleWarranty.metadata.vehicleId = vehicle.id
  }
  
  // Get pet for association
  console.log('\n🔍 Finding pet for vaccine/cost association...')
  const pet = await getFirstPet()
  if (pet) {
    console.log(`   ✅ Found: ${pet.title}`)
    testData.petVaccine.metadata.petId = pet.id
    testData.petCost.metadata.petId = pet.id
  }
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Adding Test Data')
  console.log('═'.repeat(55))
  
  const added = {}
  
  // Add Insurance
  added.insurance = await addTestData('Insurance Policy', testData.insurance)
  
  // Add Vehicle Cost
  added.vehicleCost = await addTestData('Vehicle Cost', testData.vehicleCost)
  
  // Add Vehicle Warranty
  added.vehicleWarranty = await addTestData('Vehicle Warranty', testData.vehicleWarranty)
  
  // Add Pet Vaccine
  added.petVaccine = await addTestData('Pet Vaccine', testData.petVaccine)
  
  // Add Pet Cost
  added.petCost = await addTestData('Pet Cost', testData.petCost)
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Verifying in Database')
  console.log('═'.repeat(55))
  
  for (const [name, data] of Object.entries(added)) {
    if (data) {
      console.log(`\n${name}:`)
      await verifyInDatabase(name, data.id)
    }
  }
  
  // Get counts after
  console.log('\n📊 Domain Counts AFTER:')
  const afterCounts = await getDomainCounts()
  Object.entries(afterCounts).forEach(([domain, count]) => {
    const before = beforeCounts[domain] || 0
    const diff = count - before
    const arrow = diff > 0 ? `(+${diff})` : ''
    console.log(`   ${domain.padEnd(15)}: ${count} ${arrow}`)
  })
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Summary')
  console.log('═'.repeat(55))
  
  const addedCount = Object.values(added).filter(Boolean).length
  console.log(`\n✅ Successfully added ${addedCount}/5 test entries`)
  
  console.log('\n📋 What to verify in your app:')
  console.log('\n1. Command Center (http://localhost:3000):')
  console.log('   - Insurance count should increase')
  console.log('   - Vehicles count should increase')
  console.log('   - Pets count should increase\n')
  
  console.log('2. Insurance Page (http://localhost:3000/domains/insurance):')
  console.log('   - Should see "Test Health Insurance"')
  console.log('   - Premium: $450/mo, Coverage: $500K\n')
  
  console.log('3. Vehicles Page (http://localhost:3000/domains/vehicles):')
  console.log('   - Click "Costs" tab → Should see "Fuel - Shell Station" ($65.50)')
  console.log('   - Click "Warranties" tab → Should see "Extended Warranty - Honda Care"\n')
  
  console.log('4. Pets Page (http://localhost:3000/domains/pets):')
  console.log('   - Should see vaccine records')
  console.log('   - Should see cost records')
  console.log('   - Total costs should update\n')
  
  console.log('🔄 Refresh your browser to see the new data!')
  console.log('\n💡 Note: All data persists in Supabase and will survive page refreshes\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Error:', err)
  process.exit(1)
})






