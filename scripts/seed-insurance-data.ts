#!/usr/bin/env ts-node

/**
 * Insurance Domain Data Seeding Script
 * Creates realistic test data for insurance_policies and insurance_claims tables
 * Includes various policy types and claims with different statuses
 * 
 * Usage: npx ts-node scripts/seed-insurance-data.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

interface InsurancePolicy {
  user_id: string
  provider: string
  policy_number: string
  type: string
  premium: number
  starts_on: string
  ends_on: string
  coverage: Record<string, any>
  metadata: Record<string, any>
}

interface InsuranceClaim {
  user_id: string
  policy_id: string
  status: string
  amount: number
  filed_on: string
  resolved_on?: string
  details: Record<string, any>
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.log('⚠️  No authenticated user found.')
    console.log('💡 TIP: Log in to the app first, then run this script.')
    return null
  }
  
  return user
}

function generateInsurancePolicies(userId: string): InsurancePolicy[] {
  const now = new Date()
  const oneYearAgo = new Date(now)
  oneYearAgo.setFullYear(now.getFullYear() - 1)
  const oneYearFromNow = new Date(now)
  oneYearFromNow.setFullYear(now.getFullYear() + 1)
  const sixMonthsFromNow = new Date(now)
  sixMonthsFromNow.setMonth(now.getMonth() + 6)

  const policies: InsurancePolicy[] = [
    // Health Insurance
    {
      user_id: userId,
      provider: 'Blue Cross Blue Shield',
      policy_number: 'BCBS-2024-789456',
      type: 'health',
      premium: 450,
      starts_on: oneYearAgo.toISOString().split('T')[0],
      ends_on: oneYearFromNow.toISOString().split('T')[0],
      coverage: {
        deductible: 2000,
        outOfPocketMax: 6000,
        copayPrimaryCare: 25,
        copaySpecialist: 50,
        coinsurance: 20
      },
      metadata: {
        planType: 'PPO',
        networkTier: 'Gold',
        dependents: 2
      }
    },
    
    // Auto Insurance
    {
      user_id: userId,
      provider: 'State Farm',
      policy_number: 'SF-AUTO-654321',
      type: 'auto',
      premium: 175,
      starts_on: oneYearAgo.toISOString().split('T')[0],
      ends_on: sixMonthsFromNow.toISOString().split('T')[0],
      coverage: {
        liability: 300000,
        collision: 50000,
        comprehensive: 50000,
        uninsuredMotorist: 100000
      },
      metadata: {
        vehicles: [
          { year: 2020, make: 'Honda', model: 'Accord' },
          { year: 2018, make: 'Toyota', model: 'Camry' }
        ],
        deductible: 500
      }
    },

    // Home Insurance
    {
      user_id: userId,
      provider: 'Allstate',
      policy_number: 'ALST-HOME-987654',
      type: 'home',
      premium: 1200,
      starts_on: oneYearAgo.toISOString().split('T')[0],
      ends_on: oneYearFromNow.toISOString().split('T')[0],
      coverage: {
        dwelling: 350000,
        personalProperty: 175000,
        liability: 500000,
        medicalPayments: 5000
      },
      metadata: {
        propertyType: 'Single Family',
        yearBuilt: 1998,
        squareFeet: 2400,
        deductible: 1000
      }
    },

    // Life Insurance
    {
      user_id: userId,
      provider: 'New York Life',
      policy_number: 'NYL-LIFE-456789',
      type: 'life',
      premium: 85,
      starts_on: oneYearAgo.toISOString().split('T')[0],
      ends_on: oneYearFromNow.toISOString().split('T')[0],
      coverage: {
        deathBenefit: 500000,
        cashValue: 15000
      },
      metadata: {
        policyType: 'Whole Life',
        beneficiaries: ['Spouse', 'Children']
      }
    },

    // Dental Insurance
    {
      user_id: userId,
      provider: 'Delta Dental',
      policy_number: 'DD-2024-123789',
      type: 'dental',
      premium: 45,
      starts_on: oneYearAgo.toISOString().split('T')[0],
      ends_on: oneYearFromNow.toISOString().split('T')[0],
      coverage: {
        annualMaximum: 2000,
        preventiveCoverage: 100,
        basicCoverage: 80,
        majorCoverage: 50
      },
      metadata: {
        dependents: 2,
        orthodonticsCovered: true
      }
    }
  ]

  return policies
}

function generateInsuranceClaims(userId: string, policyIds: string[]): InsuranceClaim[] {
  const now = new Date()
  
  const claims: InsuranceClaim[] = [
    // Health claim - approved
    {
      user_id: userId,
      policy_id: policyIds[0], // Health policy
      status: 'paid',
      amount: 3500,
      filed_on: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString().split('T')[0],
      resolved_on: new Date(now.getFullYear(), now.getMonth() - 1, 20).toISOString().split('T')[0],
      details: {
        claimType: 'medical',
        procedure: 'Outpatient surgery',
        provider: 'City Hospital',
        approved: true,
        paidAmount: 2800 // After deductible and coinsurance
      }
    },

    // Auto claim - in process
    {
      user_id: userId,
      policy_id: policyIds[1], // Auto policy
      status: 'pending',
      amount: 2200,
      filed_on: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 15).toISOString().split('T')[0],
      details: {
        claimType: 'collision',
        incidentDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 16).toISOString().split('T')[0],
        description: 'Rear-ended at stoplight',
        estimatedRepair: 2200,
        deductible: 500
      }
    },

    // Home claim - approved
    {
      user_id: userId,
      policy_id: policyIds[2], // Home policy
      status: 'approved',
      amount: 5800,
      filed_on: new Date(now.getFullYear(), now.getMonth() - 3, 5).toISOString().split('T')[0],
      resolved_on: new Date(now.getFullYear(), now.getMonth() - 2, 10).toISOString().split('T')[0],
      details: {
        claimType: 'property_damage',
        cause: 'Water damage from burst pipe',
        affectedArea: 'Kitchen and dining room',
        approved: true,
        paidAmount: 4800 // After deductible
      }
    },

    // Dental claim - paid
    {
      user_id: userId,
      policy_id: policyIds[4], // Dental policy
      status: 'paid',
      amount: 1200,
      filed_on: new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString().split('T')[0],
      resolved_on: new Date(now.getFullYear(), now.getMonth() - 1, 25).toISOString().split('T')[0],
      details: {
        claimType: 'dental',
        procedure: 'Root canal and crown',
        provider: 'SmileCare Dentistry',
        approved: true,
        paidAmount: 960 // 80% coverage for basic procedure
      }
    }
  ]

  return claims
}

async function seedInsuranceData() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         INSURANCE DATA SEEDING - TEST DATA CREATION          ║')
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

  // Check if tables exist
  console.log('🔍 Verifying insurance tables exist...')
  const { error: policiesError } = await supabase
    .from('insurance_policies')
    .select('id', { count: 'exact', head: true })

  const { error: claimsError } = await supabase
    .from('insurance_claims')
    .select('id', { count: 'exact', head: true })

  if (policiesError || claimsError) {
    console.log(`❌ Table check failed`)
    if (policiesError) console.log(`   insurance_policies: ${policiesError.message}`)
    if (claimsError) console.log(`   insurance_claims: ${claimsError.message}`)
    console.log('\n📋 ACTION REQUIRED:')
    console.log('   The insurance tables do not exist yet.')
    console.log('   Please apply the SQL migration first:')
    console.log('   1. Open: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    console.log('   2. Go to: SQL Editor')
    console.log('   3. Paste: Contents of APPLY_THIS_SQL_NOW.sql')
    console.log('   4. Click: Run\n')
    process.exit(1)
  }

  console.log('✅ Tables exist!\n')

  // Generate policies
  console.log('📝 Generating 5 realistic insurance policies...')
  const policies = generateInsurancePolicies(user.id)
  console.log(`   - Health Insurance (BCBS)`)
  console.log(`   - Auto Insurance (State Farm)`)
  console.log(`   - Home Insurance (Allstate)`)
  console.log(`   - Life Insurance (New York Life)`)
  console.log(`   - Dental Insurance (Delta Dental)\n`)

  // Insert policies
  console.log('💾 Inserting policies...')
  const { data: insertedPolicies, error: policyError } = await supabase
    .from('insurance_policies')
    .insert(policies)
    .select()

  if (policyError) {
    console.error(`❌ Policy insert failed: ${policyError.message}`)
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedPolicies?.length || 0} policies!\n`)

  // Generate claims
  const policyIds = insertedPolicies?.map(p => p.id) || []
  console.log('📝 Generating 4 insurance claims...')
  const claims = generateInsuranceClaims(user.id, policyIds)
  console.log(`   - Health claim (paid)`)
  console.log(`   - Auto claim (pending)`)
  console.log(`   - Home claim (approved)`)
  console.log(`   - Dental claim (paid)\n`)

  // Insert claims
  console.log('💾 Inserting claims...')
  const { data: insertedClaims, error: claimError } = await supabase
    .from('insurance_claims')
    .insert(claims)
    .select()

  if (claimError) {
    console.error(`❌ Claim insert failed: ${claimError.message}`)
    process.exit(1)
  }

  console.log(`✅ Inserted ${insertedClaims?.length || 0} claims!\n`)

  // Verify
  const { count: policyCount } = await supabase
    .from('insurance_policies')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: claimCount } = await supabase
    .from('insurance_claims')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  console.log('═'.repeat(65))
  console.log(`\n📊 SUMMARY:`)
  console.log(`   User: ${user.email}`)
  console.log(`   Total Policies: ${policyCount || 0}`)
  console.log(`   Total Claims: ${claimCount || 0}`)
  console.log(`   ✅ Data seeding complete!\n`)
  console.log('🎉 SUCCESS!')
  console.log('   You can now test the insurance domain:')
  console.log('   - Navigate to: http://localhost:3000/domains/insurance')
  console.log('   - View your policies and claims')
  console.log('   - Add more via the UI\n')

  process.exit(0)
}

// Run seeding
seedInsuranceData().catch(error => {
  console.error('\n❌ Fatal error during seeding:', error.message)
  process.exit(1)
})

