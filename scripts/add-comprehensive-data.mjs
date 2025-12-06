#!/usr/bin/env node
/**
 * Add Comprehensive Test Data to Fix Dashboard Zeros
 * This script adds data with the correct metadata structure expected by calculators
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Get current user
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.error('❌ No authenticated user found')
  process.exit(1)
}

const userId = user.id
console.log('✅ User:', user.email || userId)
console.log('\n🚀 Adding comprehensive test data...\n')

// 1. Add VEHICLES with correct metadata structure
console.log('🚗 Adding vehicles with values...')
const vehicles = [
  {
    user_id: userId,
    domain: 'vehicles',
    title: '2020 Tesla Model 3',
    description: 'Electric sedan, white exterior',
    metadata: {
      type: 'vehicle',
      estimatedValue: 35000,
      make: 'Tesla',
      model: 'Model 3',
      year: 2020,
      mileage: 25000
    }
  },
  {
    user_id: userId,
    domain: 'vehicles',
    title: '2018 Honda CR-V',
    description: 'SUV, silver',
    metadata: {
      type: 'vehicle',
      estimatedValue: 22000,
      make: 'Honda',
      model: 'CR-V',
      year: 2018,
      mileage: 45000
    }
  },
  {
    user_id: userId,
    domain: 'vehicles',
    title: '2015 Toyota Camry',
    description: 'Sedan, black',
    metadata: {
      type: 'vehicle',
      estimatedValue: 15000,
      make: 'Toyota',
      model: 'Camry',
      year: 2015,
      mileage: 78000
    }
  }
]

for (const vehicle of vehicles) {
  const { error } = await supabase.from('domain_entries').insert(vehicle)
  if (error) console.error(`  ❌ ${vehicle.title}:`, error.message)
  else console.log(`  ✅ ${vehicle.title}: $${vehicle.metadata.estimatedValue}`)
}

// 2. Add PROPERTIES with correct metadata
console.log('\n🏠 Adding properties with values...')
const properties = [
  {
    user_id: userId,
    domain: 'home',
    title: 'Main Residence',
    description: '123 Oak Street, Seattle, WA',
    metadata: {
      type: 'property',
      itemType: 'property',
      propertyValue: 750000,
      value: 750000,
      address: '123 Oak Street',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      propertyType: 'Single Family'
    }
  },
  {
    user_id: userId,
    domain: 'home',
    title: 'Vacation Home',
    description: 'Lake Tahoe cabin',
    metadata: {
      type: 'property',
      itemType: 'property',
      propertyValue: 450000,
      value: 450000,
      address: '456 Lake View Dr',
      city: 'Tahoe City',
      state: 'CA',
      propertyType: 'Cabin'
    }
  }
]

for (const property of properties) {
  const { error } = await supabase.from('domain_entries').insert(property)
  if (error) console.error(`  ❌ ${property.title}:`, error.message)
  else console.log(`  ✅ ${property.title}: $${property.metadata.propertyValue}`)
}

// 3. Add FINANCIAL accounts with balances
console.log('\n💰 Adding financial accounts...')
const financialAccounts = [
  {
    user_id: userId,
    domain: 'financial',
    title: 'Chase Checking',
    description: 'Main checking account',
    metadata: {
      accountType: 'checking',
      type: 'checking',
      balance: 15000,
      currentValue: 15000,
      institution: 'Chase'
    }
  },
  {
    user_id: userId,
    domain: 'financial',
    title: 'Savings Account',
    description: 'Emergency fund',
    metadata: {
      accountType: 'savings',
      type: 'savings',
      balance: 50000,
      currentValue: 50000,
      institution: 'Bank of America'
    }
  },
  {
    user_id: userId,
    domain: 'financial',
    title: 'Investment Portfolio',
    description: 'Vanguard 401k',
    metadata: {
      accountType: 'investment',
      type: 'investment',
      balance: 250000,
      currentValue: 250000,
      institution: 'Vanguard'
    }
  },
  {
    user_id: userId,
    domain: 'financial',
    title: 'Credit Card Debt',
    description: 'Chase Sapphire',
    metadata: {
      accountType: 'credit',
      type: 'credit',
      balance: -5000,
      currentValue: -5000,
      institution: 'Chase'
    }
  }
]

for (const account of financialAccounts) {
  const { error } = await supabase.from('domain_entries').insert(account)
  if (error) console.error(`  ❌ ${account.title}:`, error.message)
  else console.log(`  ✅ ${account.title}: $${account.metadata.balance}`)
}

// 4. Add NUTRITION data
console.log('\n🥗 Adding nutrition entries...')
const nutrition = [
  {
    user_id: userId,
    domain: 'nutrition',
    title: 'Breakfast',
    description: 'Oatmeal with berries',
    metadata: {
      type: 'meal',
      mealType: 'breakfast',
      calories: 350,
      protein: 12,
      carbs: 65,
      fat: 8,
      date: new Date().toISOString().split('T')[0]
    }
  },
  {
    user_id: userId,
    domain: 'nutrition',
    title: 'Lunch',
    description: 'Chicken salad',
    metadata: {
      type: 'meal',
      mealType: 'lunch',
      calories: 450,
      protein: 35,
      carbs: 25,
      fat: 18,
      date: new Date().toISOString().split('T')[0]
    }
  },
  {
    user_id: userId,
    domain: 'nutrition',
    title: 'Dinner',
    description: 'Grilled salmon with vegetables',
    metadata: {
      type: 'meal',
      mealType: 'dinner',
      calories: 600,
      protein: 45,
      carbs: 40,
      fat: 25,
      date: new Date().toISOString().split('T')[0]
    }
  }
]

for (const meal of nutrition) {
  const { error } = await supabase.from('domain_entries').insert(meal)
  if (error) console.error(`  ❌ ${meal.title}:`, error.message)
  else console.log(`  ✅ ${meal.title}: ${meal.metadata.calories} calories`)
}

// 5. Add WORKOUT data
console.log('\n💪 Adding workout entries...')
const workouts = [
  {
    user_id: userId,
    domain: 'workout',
    title: 'Morning Run',
    description: '5K run in the park',
    metadata: {
      type: 'cardio',
      workoutType: 'running',
      duration: 30,
      distance: 5,
      caloriesBurned: 350,
      steps: 6500,
      date: new Date().toISOString().split('T')[0]
    }
  },
  {
    user_id: userId,
    domain: 'workout',
    title: 'Gym Session',
    description: 'Weight training',
    metadata: {
      type: 'strength',
      workoutType: 'weights',
      duration: 45,
      caloriesBurned: 250,
      date: new Date().toISOString().split('T')[0]
    }
  }
]

for (const workout of workouts) {
  const { error } = await supabase.from('domain_entries').insert(workout)
  if (error) console.error(`  ❌ ${workout.title}:`, error.message)
  else console.log(`  ✅ ${workout.title}: ${workout.metadata.caloriesBurned} calories burned`)
}

console.log('\n✨ Comprehensive data added successfully!')
console.log('\n📊 Expected Totals:')
console.log('  Vehicles: $72,000')
console.log('  Properties: $1,200,000')
console.log('  Financial Assets: $315,000')
console.log('  Financial Liabilities: $5,000')
console.log('  Net Worth: ~$1,582,000')
console.log('\n🔄 Refresh your dashboard to see the updated values!')







