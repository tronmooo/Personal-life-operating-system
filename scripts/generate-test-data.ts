/**
 * Automated Test Data Generator for LifeHub
 * Generates realistic sample data for all domains to populate dashboards
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test user ID (replace with actual user ID or create test user)
const TEST_USER_ID = process.env.TEST_USER_ID || 'test-user-id'

interface TestDataStats {
  domain: string
  created: number
  errors: number
}

const stats: TestDataStats[] = []

/**
 * Generate Financial Domain Data
 */
async function generateFinancialData() {
  console.log('\n💰 Generating Financial Data...')
  const domain = 'financial'
  let created = 0
  let errors = 0

  const financialEntries = [
    {
      title: 'Salary - Tech Corp',
      description: 'Monthly salary payment',
      metadata: {
        type: 'income',
        amount: 8500,
        category: 'salary',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Grocery Shopping - Whole Foods',
      description: 'Weekly groceries',
      metadata: {
        type: 'expense',
        amount: 156.78,
        category: 'groceries',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Gas Station - Shell',
      description: 'Fuel for vehicle',
      metadata: {
        type: 'expense',
        amount: 52.30,
        category: 'transportation',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Freelance Project Payment',
      description: 'Website development project',
      metadata: {
        type: 'income',
        amount: 2500,
        category: 'freelance',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Netflix Subscription',
      description: 'Monthly streaming service',
      metadata: {
        type: 'expense',
        amount: 15.99,
        category: 'entertainment',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        recurring: true
      }
    },
    {
      title: 'Electric Bill - PG&E',
      description: 'Monthly electricity',
      metadata: {
        type: 'expense',
        amount: 145.67,
        category: 'utilities',
        date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Investment Dividend',
      description: 'Quarterly dividend payment',
      metadata: {
        type: 'income',
        amount: 450,
        category: 'investment',
        date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    {
      title: 'Restaurant - Italian Bistro',
      description: 'Dinner with friends',
      metadata: {
        type: 'expense',
        amount: 89.45,
        category: 'dining',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of financialEntries) {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .insert({
          user_id: TEST_USER_ID,
          domain,
          ...entry
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create ${entry.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} financial entries`)
}

/**
 * Generate Health Domain Data
 */
async function generateHealthData() {
  console.log('\n🏥 Generating Health Data...')
  const domain = 'health'
  let created = 0
  let errors = 0

  const healthEntries = [
    {
      title: 'Morning Weight Check',
      description: 'Daily weight measurement',
      metadata: {
        type: 'vitals',
        weight: 175,
        unit: 'lbs',
        date: new Date().toISOString()
      }
    },
    {
      title: 'Blood Pressure Reading',
      description: 'Morning BP check',
      metadata: {
        type: 'vitals',
        systolic: 120,
        diastolic: 80,
        heartRate: 72,
        date: new Date().toISOString()
      }
    },
    {
      title: 'Daily Steps',
      description: 'Step count from fitness tracker',
      metadata: {
        type: 'fitness',
        steps: 8542,
        distance: 4.2,
        unit: 'miles',
        date: new Date().toISOString()
      }
    },
    {
      title: 'Vitamin D3 - 2000 IU',
      description: 'Daily supplement',
      metadata: {
        type: 'medication',
        dosage: '2000 IU',
        frequency: 'daily',
        prescriber: 'Dr. Smith'
      }
    },
    {
      title: 'Annual Physical Exam',
      description: 'Yearly checkup with primary care',
      metadata: {
        type: 'appointment',
        provider: 'Dr. Sarah Johnson',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'City Medical Center'
      }
    },
    {
      title: 'Morning Run',
      description: '5K morning jog',
      metadata: {
        type: 'workout',
        activity: 'running',
        duration: 35,
        distance: 5,
        calories: 420,
        date: new Date().toISOString()
      }
    },
    {
      title: 'Blood Test Results',
      description: 'Quarterly lab work',
      metadata: {
        type: 'lab',
        cholesterol: 180,
        glucose: 95,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of healthEntries) {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .insert({
          user_id: TEST_USER_ID,
          domain,
          ...entry
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create ${entry.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} health entries`)
}

/**
 * Generate Vehicle Domain Data
 */
async function generateVehicleData() {
  console.log('\n🚗 Generating Vehicle Data...')
  const domain = 'vehicles'
  let created = 0
  let errors = 0

  const vehicleEntries = [
    {
      title: '2020 Toyota Camry',
      description: 'Primary family vehicle',
      metadata: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        vin: '4T1BF1FK5CU123456',
        mileage: 35420,
        licensePlate: 'ABC1234',
        color: 'Silver',
        purchaseDate: '2020-03-15',
        purchasePrice: 28500
      }
    },
    {
      title: 'Oil Change - Toyota Service',
      description: 'Regular maintenance',
      metadata: {
        type: 'maintenance',
        vehicle: '2020 Toyota Camry',
        service: 'Oil Change',
        cost: 45.99,
        mileage: 35000,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        nextDue: 38000
      }
    },
    {
      title: 'Tire Rotation',
      description: 'Rotate and balance tires',
      metadata: {
        type: 'maintenance',
        vehicle: '2020 Toyota Camry',
        service: 'Tire Rotation',
        cost: 35,
        mileage: 35420,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of vehicleEntries) {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .insert({
          user_id: TEST_USER_ID,
          domain,
          ...entry
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create ${entry.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} vehicle entries`)
}

/**
 * Generate Pet Domain Data
 */
async function generatePetData() {
  console.log('\n🐾 Generating Pet Data...')
  const domain = 'pets'
  let created = 0
  let errors = 0

  const petEntries = [
    {
      title: 'Max - Golden Retriever',
      description: 'Family dog',
      metadata: {
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 65,
        birthDate: '2021-05-15',
        microchipNumber: '123456789012345'
      }
    },
    {
      title: 'Rabies Vaccination',
      description: 'Annual rabies shot for Max',
      metadata: {
        type: 'vaccination',
        pet: 'Max',
        vaccine: 'Rabies',
        date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        nextDue: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000).toISOString(),
        veterinarian: 'Dr. Emily Brown',
        clinic: 'Happy Paws Veterinary'
      }
    },
    {
      title: 'Monthly Pet Food',
      description: 'Premium dog food purchase',
      metadata: {
        type: 'expense',
        pet: 'Max',
        category: 'food',
        amount: 68.99,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]

  for (const entry of petEntries) {
    try {
      const { error } = await supabase
        .from('domain_entries')
        .insert({
          user_id: TEST_USER_ID,
          domain,
          ...entry
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create ${entry.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} pet entries`)
}

/**
 * Generate Tasks
 */
async function generateTasks() {
  console.log('\n✅ Generating Tasks...')
  let created = 0
  let errors = 0

  const tasks = [
    {
      title: 'Review Q4 financial reports',
      description: 'Analyze spending patterns and budget',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'finance'
    },
    {
      title: 'Schedule annual checkup',
      description: 'Book appointment with Dr. Johnson',
      completed: false,
      priority: 'medium',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'health'
    },
    {
      title: 'Renew vehicle registration',
      description: 'DMV registration renewal',
      completed: false,
      priority: 'high',
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'vehicles'
    },
    {
      title: 'Buy groceries',
      description: 'Weekly grocery shopping',
      completed: true,
      priority: 'medium',
      due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'personal'
    }
  ]

  for (const task of tasks) {
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          user_id: TEST_USER_ID,
          ...task
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create task ${task.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain: 'tasks', created, errors })
  console.log(`  ✅ Created ${created} tasks`)
}

/**
 * Generate Habits
 */
async function generateHabits() {
  console.log('\n🎯 Generating Habits...')
  let created = 0
  let errors = 0

  const habits = [
    {
      name: 'Morning Meditation',
      description: '10 minutes of mindfulness',
      icon: '🧘',
      frequency: 'daily',
      streak: 12,
      last_completed_at: new Date().toISOString()
    },
    {
      name: 'Drink 8 glasses of water',
      description: 'Stay hydrated throughout the day',
      icon: '💧',
      frequency: 'daily',
      streak: 7,
      last_completed_at: new Date().toISOString()
    },
    {
      name: 'Exercise',
      description: '30 minutes of physical activity',
      icon: '💪',
      frequency: 'daily',
      streak: 5,
      last_completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      name: 'Read for 30 minutes',
      description: 'Daily reading habit',
      icon: '📚',
      frequency: 'daily',
      streak: 3,
      last_completed_at: new Date().toISOString()
    }
  ]

  for (const habit of habits) {
    try {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: TEST_USER_ID,
          ...habit
        })
      
      if (error) throw error
      created++
    } catch (e: any) {
      console.error(`  ❌ Failed to create habit ${habit.name}:`, e.message)
      errors++
    }
  }

  stats.push({ domain: 'habits', created, errors })
  console.log(`  ✅ Created ${created} habits`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Test Data Generation...')
  console.log(`📝 Test User ID: ${TEST_USER_ID}`)
  console.log('=' .repeat(50))

  try {
    await generateFinancialData()
    await generateHealthData()
    await generateVehicleData()
    await generatePetData()
    await generateTasks()
    await generateHabits()

    console.log('\n' + '='.repeat(50))
    console.log('📊 Generation Summary:')
    console.log('='.repeat(50))
    
    let totalCreated = 0
    let totalErrors = 0
    
    for (const stat of stats) {
      console.log(`  ${stat.domain.padEnd(15)} ✅ ${stat.created}  ❌ ${stat.errors}`)
      totalCreated += stat.created
      totalErrors += stat.errors
    }
    
    console.log('='.repeat(50))
    console.log(`  TOTAL:          ✅ ${totalCreated}  ❌ ${totalErrors}`)
    console.log('='.repeat(50))
    
    if (totalErrors === 0) {
      console.log('\n🎉 All test data generated successfully!')
    } else {
      console.log(`\n⚠️  Generated with ${totalErrors} errors`)
    }
    
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run if executed directly
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { main as generateTestData }

