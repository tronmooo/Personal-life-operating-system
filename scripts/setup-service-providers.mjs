#!/usr/bin/env node
/**
 * Setup and seed service_providers tables
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function checkAndSetup() {
  console.log('🚀 Checking service_providers tables...\n')

  // Check if table exists by trying to select
  const { data, error } = await supabase
    .from('service_providers')
    .select('id')
    .limit(1)

  if (error && error.code === '42P01') {
    console.log('❌ Tables do not exist.')
    console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new')
    console.log('\n   Copy the contents of: supabase/migrations/20251211_service_providers_schema.sql')
    return false
  }

  if (error) {
    console.log('Error checking tables:', error.message)
    return false
  }

  console.log('✅ Tables exist!')
  
  // Check if we have any data
  const { count } = await supabase
    .from('service_providers')
    .select('*', { count: 'exact', head: true })

  console.log(`   Current providers: ${count || 0}`)

  if (count === 0) {
    console.log('\n📊 Seeding test data...')
    await seedTestData()
  }

  return true
}

async function seedTestData() {
  // Get a test user - use the first user in the system or create demo data
  const { data: users } = await supabase.auth.admin.listUsers()
  
  if (!users?.users?.length) {
    console.log('⚠️  No users found. Please sign in first to seed data.')
    return
  }

  const userId = users.users[0].id
  console.log(`   Using user: ${users.users[0].email}`)

  // Sample providers matching the screenshots
  const providers = [
    {
      user_id: userId,
      provider_name: 'State Farm',
      category: 'insurance',
      subcategory: 'Auto',
      account_number: 'SF-2847591',
      monthly_amount: 145.00,
      billing_day: 15,
      auto_pay_enabled: true,
      status: 'active'
    },
    {
      user_id: userId,
      provider_name: 'Blue Shield',
      category: 'insurance',
      subcategory: 'Health',
      monthly_amount: 450.00,
      billing_day: 1,
      auto_pay_enabled: true,
      status: 'active'
    },
    {
      user_id: userId,
      provider_name: 'Pacific Gas & Electric',
      category: 'utilities',
      subcategory: 'Electric',
      account_number: 'PGE-9928374',
      monthly_amount: 180.00,
      billing_day: 5,
      auto_pay_enabled: true,
      status: 'active'
    },
    {
      user_id: userId,
      provider_name: 'Xfinity',
      category: 'telecom',
      subcategory: 'Internet',
      account_number: 'XF-847362',
      monthly_amount: 89.99,
      billing_day: 20,
      auto_pay_enabled: false,
      status: 'active'
    },
    {
      user_id: userId,
      provider_name: 'T-Mobile',
      category: 'telecom',
      subcategory: 'Mobile',
      monthly_amount: 140.00,
      billing_day: 12,
      auto_pay_enabled: false,
      status: 'active'
    },
    {
      user_id: userId,
      provider_name: 'Netflix',
      category: 'subscriptions',
      subcategory: 'Entertainment',
      monthly_amount: 22.99,
      billing_day: 8,
      auto_pay_enabled: true,
      status: 'active'
    }
  ]

  // Insert providers
  const { data: insertedProviders, error: providerError } = await supabase
    .from('service_providers')
    .insert(providers)
    .select()

  if (providerError) {
    console.log('   Error inserting providers:', providerError.message)
    return
  }

  console.log(`   ✅ Inserted ${insertedProviders.length} providers`)

  // Create payments for each provider
  const today = new Date()
  const payments = insertedProviders.flatMap(provider => {
    const dueDate = new Date(today.getFullYear(), today.getMonth(), provider.billing_day || 15)
    if (dueDate < today) dueDate.setMonth(dueDate.getMonth() + 1)
    
    // Create one pending and one paid payment
    return [
      {
        user_id: userId,
        provider_id: provider.id,
        amount: provider.monthly_amount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending'
      },
      {
        user_id: userId,
        provider_id: provider.id,
        amount: provider.monthly_amount + (Math.random() * 20 - 10), // Slight variation
        due_date: new Date(today.getFullYear(), today.getMonth() - 1, provider.billing_day || 15).toISOString().split('T')[0],
        status: 'paid',
        paid_date: new Date(today.getFullYear(), today.getMonth() - 1, provider.billing_day || 15).toISOString().split('T')[0]
      }
    ]
  })

  const { error: paymentError } = await supabase
    .from('service_payments')
    .insert(payments)

  if (paymentError) {
    console.log('   Error inserting payments:', paymentError.message)
  } else {
    console.log(`   ✅ Inserted ${payments.length} payments`)
  }

  // Create sample documents
  const documents = [
    {
      user_id: userId,
      provider_id: insertedProviders[0].id, // State Farm
      document_name: 'Auto Insurance Policy 2024',
      document_type: 'policy',
      upload_date: '2024-06-01',
      expiry_date: '2025-06-01'
    },
    {
      user_id: userId,
      provider_id: insertedProviders[3].id, // Xfinity
      document_name: 'Internet Service Agreement',
      document_type: 'contract',
      upload_date: '2024-01-15',
      expiry_date: '2025-01-15'
    },
    {
      user_id: userId,
      provider_id: insertedProviders[2].id, // PG&E
      document_name: 'November 2024 Bill',
      document_type: 'bill',
      upload_date: '2024-11-05'
    },
    {
      user_id: userId,
      provider_id: insertedProviders[1].id, // Blue Shield
      document_name: 'Health Insurance Card',
      document_type: 'other',
      upload_date: '2024-01-01'
    }
  ]

  const { error: docError } = await supabase
    .from('service_documents')
    .insert(documents)

  if (docError) {
    console.log('   Error inserting documents:', docError.message)
  } else {
    console.log(`   ✅ Inserted ${documents.length} documents`)
  }

  console.log('\n🎉 Test data seeded successfully!')
}

checkAndSetup()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })


