#!/usr/bin/env node
/**
 * Comprehensive CRUD test across all requested domains
 * Tests: Vehicles (costs, warranties), Pets, Relationships, Workout
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '3d67799c-7367-41a8-b4da-a7598c02f346' // teat@aol.com

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const testData = {
  vehicleCost: {
    domain: 'vehicles',
    title: 'Test Fuel Cost',
    description: 'CRUD Test - Fuel expense',
    metadata: {
      type: 'cost',
      costType: 'fuel',
      amount: 50.00,
      date: new Date().toISOString().split('T')[0],
      vehicleId: null // Will set this dynamically
    },
    user_id: USER_ID
  },
  vehicleWarranty: {
    domain: 'vehicles',
    title: 'Test Warranty',
    description: 'CRUD Test - Extended warranty',
    metadata: {
      type: 'warranty',
      provider: 'Test Provider',
      coverage: 'Bumper to bumper',
      startDate: '2025-01-01',
      endDate: '2028-01-01',
      cost: 2000,
      vehicleId: null // Will set this dynamically
    },
    user_id: USER_ID
  },
  pet: {
    domain: 'pets',
    title: 'Test Pet - Fluffy',
    description: 'CRUD Test - Test pet entry',
    metadata: {
      type: 'pet',
      species: 'Dog',
      breed: 'Golden Retriever',
      age: 3,
      weight: 65
    },
    user_id: USER_ID
  },
  relationship: {
    domain: 'relationships',
    title: 'Test Contact',
    description: 'CRUD Test - Test relationship',
    metadata: {
      type: 'contact',
      email: 'test@example.com',
      phone: '555-0123',
      relationship: 'Friend',
      birthday: '1990-05-15'
    },
    user_id: USER_ID
  },
  workout: {
    domain: 'fitness',
    title: 'Test Workout',
    description: 'CRUD Test - Morning run',
    metadata: {
      type: 'activity',
      itemType: 'workout',
      activityType: 'Running',
      duration: 30,
      calories: 250,
      distance: 3.5,
      date: new Date().toISOString().split('T')[0]
    },
    user_id: USER_ID
  }
}

async function getFirstVehicle() {
  const { data, error } = await supabase
    .from('domain_entries')
    .select('id, title, metadata')
    .eq('domain', 'vehicles')
    .eq('user_id', USER_ID)
    .limit(1)
    .single()
  
  if (error || !data) {
    console.log('⚠️  No vehicles found, will test without vehicle association')
    return null
  }
  
  const meta = data.metadata || {}
  const type = (meta.type || meta.itemType || '').toLowerCase()
  
  if (type === 'vehicle' || type === '') {
    return data
  }
  
  return null
}

async function testCreate(itemName, itemData) {
  console.log(`\n📝 CREATE Test: ${itemName}`)
  console.log(`   Adding ${itemData.title}...`)
  
  const { data, error } = await supabase
    .from('domain_entries')
    .insert(itemData)
    .select()
    .single()
  
  if (error) {
    console.error(`   ❌ CREATE failed: ${error.message}`)
    return null
  }
  
  console.log(`   ✅ Created successfully (ID: ${data.id.substring(0, 8)}...)`)
  return data
}

async function testRead(itemName, itemId, domain) {
  console.log(`\n📖 READ Test: ${itemName}`)
  
  const { data, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('id', itemId)
    .single()
  
  if (error || !data) {
    console.error(`   ❌ READ failed: ${error?.message || 'Not found'}`)
    return false
  }
  
  console.log(`   ✅ Read successfully: ${data.title}`)
  return true
}

async function testUpdate(itemName, itemId) {
  console.log(`\n✏️  UPDATE Test: ${itemName}`)
  
  const updates = {
    description: `${itemName} - UPDATED by CRUD test`,
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('domain_entries')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()
  
  if (error) {
    console.error(`   ❌ UPDATE failed: ${error.message}`)
    return false
  }
  
  console.log(`   ✅ Updated successfully`)
  return true
}

async function testDelete(itemName, itemId) {
  console.log(`\n🗑️  DELETE Test: ${itemName}`)
  
  const { error } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', itemId)
  
  if (error) {
    console.error(`   ❌ DELETE failed: ${error.message}`)
    console.log(`   ⚠️  This is likely the RLS policy issue!`)
    return false
  }
  
  // Verify deletion
  const { data: check } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('id', itemId)
    .maybeSingle()
  
  if (check) {
    console.error(`   ❌ DELETE FAILED: Record still exists!`)
    console.log(`   🔴 RLS DELETE policy is blocking deletion`)
    return false
  }
  
  console.log(`   ✅ Deleted successfully and verified`)
  return true
}

async function countDomainEntries(domain) {
  const { data, error, count } = await supabase
    .from('domain_entries')
    .select('id', { count: 'exact', head: false })
    .eq('domain', domain)
    .eq('user_id', USER_ID)
  
  if (error) return 0
  return count || data?.length || 0
}

async function runComprehensiveTest() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   Comprehensive CRUD Test Suite                       ║')
  console.log('║   Testing: Vehicles, Pets, Relationships, Workout     ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  
  const results = {
    vehicleCost: { create: false, read: false, update: false, delete: false },
    vehicleWarranty: { create: false, read: false, update: false, delete: false },
    pet: { create: false, read: false, update: false, delete: false },
    relationship: { create: false, read: false, update: false, delete: false },
    workout: { create: false, read: false, update: false, delete: false }
  }
  
  // Get a vehicle to associate costs/warranties with
  console.log('🔍 Finding a vehicle to associate costs/warranties...')
  const vehicle = await getFirstVehicle()
  if (vehicle) {
    console.log(`✅ Using vehicle: ${vehicle.title} (${vehicle.id.substring(0, 8)}...)`)
    testData.vehicleCost.metadata.vehicleId = vehicle.id
    testData.vehicleWarranty.metadata.vehicleId = vehicle.id
  }
  
  // Show initial counts
  console.log('\n📊 Initial Domain Counts:')
  console.log(`   Vehicles: ${await countDomainEntries('vehicles')}`)
  console.log(`   Pets: ${await countDomainEntries('pets')}`)
  console.log(`   Relationships: ${await countDomainEntries('relationships')}`)
  console.log(`   Fitness: ${await countDomainEntries('fitness')}`)
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Testing Vehicle Cost')
  console.log('═'.repeat(55))
  
  const vehicleCost = await testCreate('Vehicle Cost', testData.vehicleCost)
  if (vehicleCost) {
    results.vehicleCost.create = true
    results.vehicleCost.read = await testRead('Vehicle Cost', vehicleCost.id, 'vehicles')
    results.vehicleCost.update = await testUpdate('Vehicle Cost', vehicleCost.id)
    results.vehicleCost.delete = await testDelete('Vehicle Cost', vehicleCost.id)
  }
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Testing Vehicle Warranty')
  console.log('═'.repeat(55))
  
  const vehicleWarranty = await testCreate('Vehicle Warranty', testData.vehicleWarranty)
  if (vehicleWarranty) {
    results.vehicleWarranty.create = true
    results.vehicleWarranty.read = await testRead('Vehicle Warranty', vehicleWarranty.id, 'vehicles')
    results.vehicleWarranty.update = await testUpdate('Vehicle Warranty', vehicleWarranty.id)
    results.vehicleWarranty.delete = await testDelete('Vehicle Warranty', vehicleWarranty.id)
  }
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Testing Pet')
  console.log('═'.repeat(55))
  
  const pet = await testCreate('Pet', testData.pet)
  if (pet) {
    results.pet.create = true
    results.pet.read = await testRead('Pet', pet.id, 'pets')
    results.pet.update = await testUpdate('Pet', pet.id)
    results.pet.delete = await testDelete('Pet', pet.id)
  }
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Testing Relationship')
  console.log('═'.repeat(55))
  
  const relationship = await testCreate('Relationship', testData.relationship)
  if (relationship) {
    results.relationship.create = true
    results.relationship.read = await testRead('Relationship', relationship.id, 'relationships')
    results.relationship.update = await testUpdate('Relationship', relationship.id)
    results.relationship.delete = await testDelete('Relationship', relationship.id)
  }
  
  console.log('\n' + '═'.repeat(55))
  console.log('  Testing Workout')
  console.log('═'.repeat(55))
  
  const workout = await testCreate('Workout', testData.workout)
  if (workout) {
    results.workout.create = true
    results.workout.read = await testRead('Workout', workout.id, 'fitness')
    results.workout.update = await testUpdate('Workout', workout.id)
    results.workout.delete = await testDelete('Workout', workout.id)
  }
  
  // Final counts
  console.log('\n📊 Final Domain Counts:')
  console.log(`   Vehicles: ${await countDomainEntries('vehicles')}`)
  console.log(`   Pets: ${await countDomainEntries('pets')}`)
  console.log(`   Relationships: ${await countDomainEntries('relationships')}`)
  console.log(`   Fitness: ${await countDomainEntries('fitness')}`)
  
  // Summary
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   Test Results Summary                                ║')
  console.log('╚═══════════════════════════════════════════════════════╝\n')
  
  const domains = ['vehicleCost', 'vehicleWarranty', 'pet', 'relationship', 'workout']
  const operations = ['create', 'read', 'update', 'delete']
  
  domains.forEach(domain => {
    const displayName = domain.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    console.log(`${displayName}:`)
    operations.forEach(op => {
      const status = results[domain][op] ? '✅' : '❌'
      console.log(`   ${op.toUpperCase().padEnd(8)}: ${status}`)
    })
    console.log()
  })
  
  // Check if DELETE failed across the board
  const allDeletesFailed = domains.every(d => !results[d].delete)
  if (allDeletesFailed) {
    console.log('🔴 CRITICAL: All DELETE operations failed!')
    console.log('   This confirms the RLS policy issue.')
    console.log('   Run the SQL migrations to fix this:\n')
    console.log('   1. Open: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql')
    console.log('   2. Run: supabase/migrations/fix-delete-rls-policy.sql\n')
  }
  
  const allOperationsWork = domains.every(d => 
    operations.every(op => results[d][op])
  )
  
  if (allOperationsWork) {
    console.log('🎉 SUCCESS: All CRUD operations work correctly!')
    console.log('   Your app is fully functional!')
  }
}

runComprehensiveTest().then(() => process.exit(0)).catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})

