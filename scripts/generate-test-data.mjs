/**
 * Automated Test Data Generator for LifeHub (ES Module version)
 * Generates realistic sample data for all domains to populate dashboards
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function loadEnv() {
  try {
    const envPath = join(__dirname, '../.env.local')
    const envFile = readFileSync(envPath, 'utf8')
    const lines = envFile.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '')
          process.env[key.trim()] = value.trim()
        }
      }
    }
  } catch (e) {
    console.warn('⚠️  Could not load .env.local, using environment variables')
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test user ID - will be fetched from Supabase or use provided one
let TEST_USER_ID = process.env.TEST_USER_ID
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'e2e@test.com'
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test1234!'

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
}

const stats = []

/**
 * Get or create test user
 */
async function getTestUserId() {
  if (TEST_USER_ID) {
    if (isUuid(TEST_USER_ID)) {
      console.log(`📝 Using provided TEST_USER_ID: ${TEST_USER_ID}`)
      return TEST_USER_ID
    } else {
      console.warn(`⚠️  Ignoring invalid TEST_USER_ID (not a UUID): ${TEST_USER_ID}`)
    }
  }

  // Try to find or create a dedicated E2E user
  try {
    // Search for existing test user by email
    const { data: list, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    const existing = list.users.find(u => u.email === TEST_USER_EMAIL)
    if (existing) {
      TEST_USER_ID = existing.id
      console.log(`📝 Using existing E2E user: ${TEST_USER_EMAIL} (${TEST_USER_ID})`)
      return TEST_USER_ID
    }

    // Create test user
    console.log(`👤 Creating E2E user: ${TEST_USER_EMAIL}`)
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
      email_confirm: true
    })
    if (createError || !created?.user) {
      throw createError || new Error('Failed to create E2E user')
    }
    TEST_USER_ID = created.user.id
    console.log(`🆕 Created E2E user: ${TEST_USER_EMAIL} (${TEST_USER_ID})`)
    return TEST_USER_ID
  } catch (e) {
    console.error('❌ Failed to fetch users:', e.message)
    console.error('Set TEST_USER_ID environment variable with a valid UUID')
    process.exit(1)
  }
}

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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      console.error(`  ❌ Failed to create ${entry.title}:`, e.message)
      errors++
    }
  }

  stats.push({ domain, created, errors })
  console.log(`  ✅ Created ${created} pet entries`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Test Data Generation...')
  console.log('=' .repeat(50))

  try {
    // Get test user ID first
    await getTestUserId()
    console.log('=' .repeat(50))
    
    await generateFinancialData()
    await generateHealthData()
    await generateVehicleData()
    await generatePetData()

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
      process.exit(0)
    } else {
      console.log(`\n⚠️  Generated with ${totalErrors} errors`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

// Run
main()

