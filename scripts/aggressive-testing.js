#!/usr/bin/env node
/**
 * Aggressive testing script
 * Add lots of data, verify display, then delete and verify removal
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

const testEntries = [
  // Workouts
  {
    domain: 'fitness',
    title: 'Morning Run',
    description: 'Test workout - 5K run',
    metadata: {
      type: 'activity',
      itemType: 'workout',
      activityType: 'Running',
      duration: 35,
      calories: 320,
      distance: 5,
      date: new Date().toISOString().split('T')[0]
    },
    user_id: USER_ID
  },
  {
    domain: 'fitness',
    title: 'Weight Training',
    description: 'Test workout - Upper body',
    metadata: {
      type: 'activity',
      itemType: 'workout',
      activityType: 'Strength',
      duration: 45,
      calories: 280,
      date: new Date().toISOString().split('T')[0]
    },
    user_id: USER_ID
  },
  // Relationships
  {
    domain: 'relationships',
    title: 'Sarah Johnson',
    description: 'Test contact - Best friend',
    metadata: {
      type: 'contact',
      relationship: 'Friend',
      email: 'sarah@example.com',
      phone: '555-0199',
      birthday: '1988-06-15'
    },
    user_id: USER_ID
  },
  {
    domain: 'relationships',
    title: 'Mike Davis',
    description: 'Test contact - Colleague',
    metadata: {
      type: 'contact',
      relationship: 'Colleague',
      email: 'mike@example.com',
      phone: '555-0200',
      birthday: '1985-03-22'
    },
    user_id: USER_ID
  },
  // Pets with proper type
  {
    domain: 'pets',
    title: 'Buddy',
    description: 'Test pet - Labrador',
    metadata: {
      type: 'pet',
      species: 'Dog',
      breed: 'Labrador Retriever',
      age: 5,
      weight: 75,
      color: 'Yellow'
    },
    user_id: USER_ID
  },
  {
    domain: 'pets',
    title: 'Luna',
    description: 'Test pet - Siamese cat',
    metadata: {
      type: 'pet',
      species: 'Cat',
      breed: 'Siamese',
      age: 3,
      weight: 10,
      color: 'Cream'
    },
    user_id: USER_ID
  },
  // Insurance
  {
    domain: 'insurance',
    title: 'Auto Insurance Policy',
    description: 'Test policy - State Farm',
    metadata: {
      type: 'policy',
      policyType: 'Auto',
      provider: 'State Farm',
      policyNumber: 'AUTO-789456',
      premium: 180,
      coverage: 250000,
      startDate: '2025-01-01',
      endDate: '2025-12-31'
    },
    user_id: USER_ID
  },
  // Health
  {
    domain: 'health',
    title: 'Blood Pressure Reading',
    description: 'Test vital - Morning reading',
    metadata: {
      type: 'vital',
      vitalType: 'blood_pressure',
      systolic: 118,
      diastolic: 78,
      pulse: 72,
      date: new Date().toISOString().split('T')[0],
      time: '08:30'
    },
    user_id: USER_ID
  },
  {
    domain: 'health',
    title: 'Weight Measurement',
    description: 'Test vital - Weekly weigh-in',
    metadata: {
      type: 'vital',
      vitalType: 'weight',
      value: 175,
      unit: 'lbs',
      date: new Date().toISOString().split('T')[0]
    },
    user_id: USER_ID
  }
]

async function getDomainCounts() {
  const domains = ['fitness', 'relationships', 'pets', 'insurance', 'health', 'vehicles']
  const counts = {}
  
  for (const domain of domains) {
    const { count } = await supabase
      .from('domain_entries')
      .select('id', { count: 'exact', head: true })
      .eq('domain', domain)
      .eq('user_id', USER_ID)
    
    counts[domain] = count || 0
  }
  
  return counts
}

async function addAllTestData() {
  console.log('\n📝 Adding test data...\n')
  const added = []
  
  for (const entry of testEntries) {
    const { data, error } = await supabase
      .from('domain_entries')
      .insert(entry)
      .select()
      .single()
    
    if (error) {
      console.log(`❌ ${entry.domain}: ${entry.title} - ${error.message}`)
    } else {
      console.log(`✅ ${entry.domain.padEnd(15)}: ${entry.title}`)
      added.push(data)
    }
  }
  
  return added
}

async function deleteAllTestData(entries) {
  console.log('\n🗑️  Deleting test data...\n')
  let successCount = 0
  let failCount = 0
  
  for (const entry of entries) {
    const { error } = await supabase
      .from('domain_entries')
      .delete()
      .eq('id', entry.id)
    
    if (error) {
      console.log(`❌ ${entry.domain}: ${entry.title} - ${error.message}`)
      failCount++
    } else {
      // Verify actually deleted
      const { data: check } = await supabase
        .from('domain_entries')
        .select('id')
        .eq('id', entry.id)
        .maybeSingle()
      
      if (check) {
        console.log(`❌ ${entry.domain}: ${entry.title} - STILL EXISTS!`)
        failCount++
      } else {
        console.log(`✅ ${entry.domain.padEnd(15)}: ${entry.title}`)
        successCount++
      }
    }
  }
  
  return { successCount, failCount }
}

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗')
  console.log('║   Aggressive Testing: Add → Verify → Delete          ║')
  console.log('╚═══════════════════════════════════════════════════════╝')
  
  // Get initial counts
  console.log('\n📊 Domain Counts BEFORE:')
  const beforeCounts = await getDomainCounts()
  Object.entries(beforeCounts).forEach(([domain, count]) => {
    console.log(`   ${domain.padEnd(15)}: ${count}`)
  })
  
  // Add data
  console.log('\n' + '═'.repeat(55))
  console.log('  PHASE 1: Adding Test Data')
  console.log('═'.repeat(55))
  
  const added = await addAllTestData()
  
  // Get counts after adding
  console.log('\n📊 Domain Counts AFTER ADDING:')
  const afterAddCounts = await getDomainCounts()
  Object.entries(afterAddCounts).forEach(([domain, count]) => {
    const before = beforeCounts[domain] || 0
    const diff = count - before
    const arrow = diff > 0 ? `(+${diff})` : ''
    console.log(`   ${domain.padEnd(15)}: ${count} ${arrow}`)
  })
  
  console.log('\n💡 NOW: Check your app!')
  console.log('   1. Command Center: http://localhost:3000')
  console.log('   2. Check if counts increased')
  console.log('   3. Navigate to domain pages to see entries')
  console.log('\n⏸️  Press Ctrl+C if you want to stop before deletion')
  console.log('   Otherwise, deletion will start in 5 seconds...\n')
  
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  // Delete data
  console.log('═'.repeat(55))
  console.log('  PHASE 2: Deleting Test Data')
  console.log('═'.repeat(55))
  
  const { successCount, failCount } = await deleteAllTestData(added)
  
  // Get counts after deleting
  console.log('\n📊 Domain Counts AFTER DELETING:')
  const afterDeleteCounts = await getDomainCounts()
  Object.entries(afterDeleteCounts).forEach(([domain, count]) => {
    const before = beforeCounts[domain] || 0
    const afterAdd = afterAddCounts[domain] || 0
    const diff = count - afterAdd
    const arrow = diff < 0 ? `(${diff})` : diff > 0 ? `(+${diff})` : ''
    console.log(`   ${domain.padEnd(15)}: ${count} ${arrow}`)
  })
  
  // Summary
  console.log('\n' + '═'.repeat(55))
  console.log('  Test Summary')
  console.log('═'.repeat(55))
  
  console.log(`\n✅ Successfully deleted: ${successCount}/${added.length}`)
  if (failCount > 0) {
    console.log(`❌ Failed to delete: ${failCount}/${added.length}`)
    console.log('\n🔴 DELETE FAILURES DETECTED!')
    console.log('   This confirms the RLS policy issue.')
    console.log('   Run: supabase/migrations/fix-delete-rls-policy.sql')
  } else {
    console.log('\n🎉 All deletions successful!')
    console.log('   DELETE operations are working correctly.')
  }
  
  console.log('\n💡 NOW: Refresh your app and verify:')
  console.log('   1. Command center counts should be back to original')
  console.log('   2. Domain pages should not show test entries')
  console.log('   3. Data should persist correctly\n')
}

main().then(() => process.exit(0)).catch(err => {
  console.error('💥 Error:', err)
  process.exit(1)
})






