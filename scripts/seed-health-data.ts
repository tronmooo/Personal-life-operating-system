#!/usr/bin/env ts-node

/**
 * Health Domain Data Seeding Script
 * Creates realistic test data for health_metrics table
 * Includes vitals, measurements, and various metric types
 * 
 * Usage: npx ts-node scripts/seed-health-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface HealthMetric {
  user_id: string
  metric_type: string
  recorded_at: string
  value: number
  secondary_value?: number
  unit: string
  metadata: Record<string, any>
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.log('⚠️  No authenticated user found.')
    console.log('💡 TIP: Log in to the app first, then run this script.')
    console.log('   Or provide a user_id manually in the script.')
    return null
  }
  
  return user
}

function generateHealthMetrics(userId: string, count: number = 20): HealthMetric[] {
  const metrics: HealthMetric[] = []
  const now = new Date()

  // Blood Pressure readings (last 10 days)
  for (let i = 0; i < 10; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'blood_pressure',
      recorded_at: date.toISOString(),
      value: 120 + Math.floor(Math.random() * 20), // Systolic
      secondary_value: 80 + Math.floor(Math.random() * 15), // Diastolic
      unit: 'mmHg',
      metadata: {
        timeOfDay: i % 2 === 0 ? 'morning' : 'evening',
        notes: i === 0 ? 'Feeling good today' : undefined
      }
    })
  }

  // Weight measurements (weekly for 2 months)
  for (let i = 0; i < 8; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (i * 7))
    
    metrics.push({
      user_id: userId,
      metric_type: 'weight',
      recorded_at: date.toISOString(),
      value: 170 - (i * 0.5), // Slight weight loss trend
      unit: 'lbs',
      metadata: {
        beforeBreakfast: true,
        goal: 165
      }
    })
  }

  // Heart Rate (last 5 days)
  for (let i = 0; i < 5; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'heart_rate',
      recorded_at: date.toISOString(),
      value: 70 + Math.floor(Math.random() * 15),
      unit: 'bpm',
      metadata: {
        activity: i % 2 === 0 ? 'resting' : 'post_workout'
      }
    })
  }

  // Blood Glucose (diabetic monitoring - last 7 days)
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'blood_glucose',
      recorded_at: date.toISOString(),
      value: 95 + Math.floor(Math.random() * 20),
      unit: 'mg/dL',
      metadata: {
        mealRelation: i % 3 === 0 ? 'fasting' : i % 3 === 1 ? 'after_meal' : 'before_meal'
      }
    })
  }

  // Temperature (recent illness tracking)
  for (let i = 0; i < 3; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'temperature',
      recorded_at: date.toISOString(),
      value: 98.6 + (Math.random() * 2 - 1),
      unit: '°F',
      metadata: {
        symptoms: i === 0 ? 'slight headache' : undefined
      }
    })
  }

  // Steps (daily activity)
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'steps',
      recorded_at: date.toISOString(),
      value: 8000 + Math.floor(Math.random() * 4000),
      unit: 'steps',
      metadata: {
        goal: 10000,
        distance_miles: (8000 + Math.random() * 4000) / 2000
      }
    })
  }

  // Sleep (nightly)
  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    metrics.push({
      user_id: userId,
      metric_type: 'sleep',
      recorded_at: date.toISOString(),
      value: 6.5 + Math.random() * 2,
      unit: 'hours',
      metadata: {
        quality: i % 2 === 0 ? 'good' : 'fair',
        interruptions: Math.floor(Math.random() * 3)
      }
    })
  }

  return metrics
}

async function seedHealthData() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           HEALTH DATA SEEDING - TEST DATA CREATION           ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Get current user
  console.log('🔍 Checking for authenticated user...')
  const user = await getCurrentUser()
  
  if (!user) {
    console.log('\n❌ Cannot seed data without a user.')
    console.log('📋 MANUAL STEPS:')
    console.log('   1. Open your app: http://localhost:3000')
    console.log('   2. Log in with: test@aol.com / password')
    console.log('   3. Re-run this script\n')
    process.exit(1)
  }

  console.log(`✅ Found user: ${user.email} (${user.id})\n`)

  // Check if table exists
  console.log('🔍 Verifying health_metrics table exists...')
  const { error: tableError } = await supabase
    .from('health_metrics')
    .select('id', { count: 'exact', head: true })

  if (tableError) {
    console.log(`❌ Table check failed: ${tableError.message}`)
    console.log('\n📋 ACTION REQUIRED:')
    console.log('   The health_metrics table does not exist yet.')
    console.log('   Please apply the SQL migration first:')
    console.log('   1. Open: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    console.log('   2. Go to: SQL Editor')
    console.log('   3. Paste: Contents of APPLY_THIS_SQL_NOW.sql')
    console.log('   4. Click: Run\n')
    process.exit(1)
  }

  console.log('✅ Table exists!\n')

  // Generate test data
  console.log('📝 Generating 52 realistic health metrics...')
  const metrics = generateHealthMetrics(user.id, 52)
  console.log(`   - 10 Blood Pressure readings`)
  console.log(`   - 8 Weight measurements`)
  console.log(`   - 5 Heart Rate readings`)
  console.log(`   - 7 Blood Glucose readings`)
  console.log(`   - 3 Temperature readings`)
  console.log(`   - 7 Daily Steps`)
  console.log(`   - 7 Sleep records\n`)

  // Insert data
  console.log('💾 Inserting data into health_metrics table...')
  const { data, error } = await supabase
    .from('health_metrics')
    .insert(metrics)
    .select()

  if (error) {
    console.error(`❌ Insert failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`✅ Successfully inserted ${data?.length || 0} health metrics!\n`)

  // Verify
  const { count } = await supabase
    .from('health_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  console.log('═'.repeat(65))
  console.log(`\n📊 SUMMARY:`)
  console.log(`   User: ${user.email}`)
  console.log(`   Total Health Metrics: ${count || 0}`)
  console.log(`   ✅ Data seeding complete!\n`)
  console.log('🎉 SUCCESS!')
  console.log('   You can now test the health domain:')
  console.log('   - Navigate to: http://localhost:3000/domains/health')
  console.log('   - View your health metrics')
  console.log('   - Add more metrics via the UI\n')

  process.exit(0)
}

// Run seeding
seedHealthData().catch(error => {
  console.error('\n❌ Fatal error during seeding:', error.message)
  process.exit(1)
})

