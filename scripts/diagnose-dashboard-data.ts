#!/usr/bin/env ts-node
/**
 * Diagnostic script to check dashboard data wiring
 *
 * Run with: npx ts-node scripts/diagnose-dashboard-data.ts
 * Or: npm run diagnose:dashboard
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface DomainStats {
  domain: string
  total: number
  withMetadata: number
  sampleMetadataKeys: string[]
  sampleTitles: string[]
}

async function diagnoseDashboardData() {
  console.log('🔍 Diagnosing Dashboard Data Wiring\n')
  console.log('=' .repeat(60))

  // Check authentication
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) {
    console.log('⚠️  Not authenticated - data will be limited')
    console.log('   Sign in to see user-specific data\n')
  } else {
    console.log(`✅ Authenticated as: ${session.user.email}\n`)
  }

  // Query all domain entries
  const { data: entries, error, count } = await supabase
    .from('domain_entries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error querying domain_entries:', error.message)
    return
  }

  if (!entries || entries.length === 0) {
    console.log('📭 No entries found in domain_entries table')
    console.log('\n💡 Your dashboard is empty because there\'s no data!')
    console.log('   Add some data to domains to see it on the dashboard.\n')
    return
  }

  console.log(`📊 Total Entries: ${count}`)
  console.log(`=' .repeat(60)}\n`)

  // Group by domain
  const domainGroups = entries.reduce((acc, entry) => {
    const domain = entry.domain || 'unknown'
    if (!acc[domain]) {
      acc[domain] = []
    }
    acc[domain].push(entry)
    return acc
  }, {} as Record<string, any[]>)

  // Analyze each domain
  const stats: DomainStats[] = []

  for (const [domain, domainEntries] of Object.entries(domainGroups)) {
    const entries = domainEntries as any[]
    const withMetadata = entries.filter((e: any) => e.metadata && Object.keys(e.metadata).length > 0).length
    const allMetadataKeys = new Set<string>()
    const sampleTitles: string[] = []

    entries.slice(0, 3).forEach((entry: any) => {
      if (entry.title) sampleTitles.push(entry.title)
      if (entry.metadata) {
        Object.keys(entry.metadata).forEach(key => allMetadataKeys.add(key))
      }
    })

    stats.push({
      domain,
      total: entries.length,
      withMetadata,
      sampleMetadataKeys: Array.from(allMetadataKeys).slice(0, 5),
      sampleTitles: sampleTitles.slice(0, 2)
    })
  }

  // Sort by total entries
  stats.sort((a, b) => b.total - a.total)

  // Display results
  console.log('📦 Domain Breakdown:\n')
  stats.forEach(stat => {
    console.log(`  ${stat.domain.toUpperCase()}`)
    console.log(`    • Total entries: ${stat.total}`)
    console.log(`    • With metadata: ${stat.withMetadata}`)
    if (stat.sampleTitles.length > 0) {
      console.log(`    • Sample titles: ${stat.sampleTitles.join(', ')}`)
    }
    if (stat.sampleMetadataKeys.length > 0) {
      console.log(`    • Metadata keys: ${stat.sampleMetadataKeys.join(', ')}`)
    }
    console.log()
  })

  // Check for specific dashboard requirements
  console.log('=' .repeat(60))
  console.log('🔧 Dashboard Card Requirements Check:\n')

  // Financial - Monthly Expenses
  const financialEntries = (domainGroups['financial'] || []) as any[]
  const expenseEntries = financialEntries.filter((e: any) =>
    e.metadata?.logType === 'expense' ||
    e.metadata?.type === 'expense' ||
    e.metadata?.itemType === 'expense'
  )
  console.log(`💰 FINANCIAL (Monthly Expenses)`)
  console.log(`    • Total entries: ${financialEntries.length}`)
  console.log(`    • Expense entries: ${expenseEntries.length}`)
  console.log(`    • Required: metadata.logType/type='expense', metadata.amount, metadata.category`)
  if (expenseEntries.length > 0) {
    const sample = expenseEntries[0]
    console.log(`    • Sample: ${JSON.stringify({
      amount: sample.metadata?.amount,
      category: sample.metadata?.category,
      logType: sample.metadata?.logType
    })}`)
  }
  console.log()

  // Health
  const healthEntries = (domainGroups['health'] || []) as any[]
  console.log(`❤️  HEALTH`)
  console.log(`    • Total entries: ${healthEntries.length}`)
  console.log(`    • Required: metadata.glucose, metadata.weight, metadata.heartRate, metadata.bloodPressure`)
  if (healthEntries.length > 0) {
    const sample = healthEntries[0]
    console.log(`    • Sample: ${JSON.stringify({
      glucose: sample.metadata?.glucose,
      weight: sample.metadata?.weight,
      heartRate: sample.metadata?.heartRate
    })}`)
  }
  console.log()

  // Vehicles
  const vehicleEntries = (domainGroups['vehicles'] || []) as any[]
  const actualVehicles = vehicleEntries.filter((v: any) => v.metadata?.type === 'vehicle')
  console.log(`🚗 VEHICLES`)
  console.log(`    • Total entries: ${vehicleEntries.length}`)
  console.log(`    • Actual vehicles: ${actualVehicles.length} (filtered by metadata.type='vehicle')`)
  console.log(`    • Required: metadata.type='vehicle', metadata.value, metadata.mileage`)
  if (actualVehicles.length > 0) {
    const sample = actualVehicles[0]
    console.log(`    • Sample: ${JSON.stringify({
      type: sample.metadata?.type,
      value: sample.metadata?.value,
      mileage: sample.metadata?.mileage
    })}`)
  }
  console.log()

  // Home
  const homeEntries = (domainGroups['home'] || []) as any[]
  const properties = homeEntries.filter((h: any) => h.metadata?.type === 'property')
  console.log(`🏠 HOME`)
  console.log(`    • Total entries: ${homeEntries.length}`)
  console.log(`    • Properties: ${properties.length} (filtered by metadata.type='property')`)
  console.log(`    • Required: metadata.type='property', metadata.value`)
  if (properties.length > 0) {
    const sample = properties[0]
    console.log(`    • Sample: ${JSON.stringify({
      type: sample.metadata?.type,
      value: sample.metadata?.value
    })}`)
  }
  console.log()

  // Insurance
  const insuranceEntries = (domainGroups['insurance'] || []) as any[]
  console.log(`🛡️  INSURANCE`)
  console.log(`    • Total entries: ${insuranceEntries.length}`)
  console.log(`    • Required: metadata.type (health/auto/home/life), metadata.premium`)
  if (insuranceEntries.length > 0) {
    const sample = insuranceEntries[0]
    console.log(`    • Sample: ${JSON.stringify({
      type: sample.metadata?.type,
      premium: sample.metadata?.premium
    })}`)
  }
  console.log()

  // Recommendations
  console.log('=' .repeat(60))
  console.log('💡 Recommendations:\n')

  if (financialEntries.length > 0 && expenseEntries.length === 0) {
    console.log('⚠️  Financial entries exist but none are marked as expenses')
    console.log('   Add metadata.logType="expense" to expense entries')
  }

  if (vehicleEntries.length > 0 && actualVehicles.length === 0) {
    console.log('⚠️  Vehicle entries exist but none have metadata.type="vehicle"')
    console.log('   Add metadata.type="vehicle" to vehicle entries')
  }

  if (homeEntries.length > 0 && properties.length === 0) {
    console.log('⚠️  Home entries exist but none have metadata.type="property"')
    console.log('   Add metadata.type="property" to property entries')
  }

  const domainsWithoutData = ['health', 'vehicles', 'home', 'insurance', 'pets', 'nutrition', 'fitness']
    .filter(domain => !domainGroups[domain] || domainGroups[domain].length === 0)

  if (domainsWithoutData.length > 0) {
    console.log(`\n📭 Empty domains: ${domainsWithoutData.join(', ')}`)
    console.log('   Navigate to /domains/<domain> to add data')
  }

  console.log('\n✅ Diagnosis complete!')
}

diagnoseDashboardData().catch(console.error)
