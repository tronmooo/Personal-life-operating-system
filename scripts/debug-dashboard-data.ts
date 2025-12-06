#!/usr/bin/env ts-node

/**
 * Dashboard Data Debugging Script
 * Checks what data the dashboard actually has access to
 * Helps diagnose why dashboard shows zeros despite data existing
 * 
 * Usage: npx ts-node scripts/debug-dashboard-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease set these in your .env.local file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugDashboardData() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║         DASHBOARD DATA DEBUGGING - What Does It See?         ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.log('❌ Not authenticated')
    console.log('Please log in to the app first\n')
    process.exit(1)
  }

  console.log(`✅ User: ${user.email} (${user.id})\n`)

  // Load data the same way DataProvider does
  console.log('📊 Loading domain_entries (same as DataProvider)...\n')

  const { data: entries, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.log(`❌ Error loading data: ${error.message}`)
    process.exit(1)
  }

  // Group by domain (same as DataProvider)
  const domainsObj = (entries || []).reduce<Record<string, any[]>>((acc, entry) => {
    if (!acc[entry.domain]) {
      acc[entry.domain] = []
    }
    acc[entry.domain].push(entry)
    return acc
  }, {})

  console.log('📈 DOMAIN DATA SUMMARY')
  console.log('═'.repeat(65))
  console.log('')

  const domains = [
    'financial', 'health', 'insurance', 'home', 'vehicles', 'appliances',
    'pets', 'relationships', 'digital', 'mindfulness', 'fitness', 'nutrition',
    'legal', 'miscellaneous'
  ]

  let totalItems = 0

  console.log('| Domain | Item Count | Sample Data |')
  console.log('|--------|------------|-------------|')

  for (const domain of domains) {
    const items = domainsObj[domain] || []
    totalItems += items.length

    let sampleData = '(no data)'
    if (items.length > 0) {
      const sample = items[0]
      sampleData = `${sample.title?.substring(0, 30) || 'Untitled'}`
    }

    const icon = items.length > 0 ? '✅' : '⚠️ '
    console.log(`| ${icon} ${domain.padEnd(14)} | ${items.length.toString().padStart(10)} | ${sampleData} |`)
  }

  console.log('')
  console.log('─'.repeat(65))
  console.log(`Total items across all domains: ${totalItems}`)
  console.log('─'.repeat(65))

  // Check financial metrics specifically
  console.log('\n💰 FINANCIAL DOMAIN DEEP DIVE')
  console.log('═'.repeat(65))

  const financialItems = domainsObj['financial'] || []
  console.log(`\nTotal financial items: ${financialItems.length}\n`)

  if (financialItems.length > 0) {
    console.log('Sample items:')
    financialItems.slice(0, 3).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`)
      console.log(`   ID: ${item.id}`)
      console.log(`   Domain: ${item.domain}`)
      console.log(`   Metadata keys: ${Object.keys(item.metadata || {}).join(', ')}`)
      if (item.metadata?.amount) console.log(`   Amount: $${item.metadata.amount}`)
      if (item.metadata?.type) console.log(`   Type: ${item.metadata.type}`)
      if (item.metadata?.category) console.log(`   Category: ${item.metadata.category}`)
    })

    // Calculate what dashboard should show
    console.log('\n📊 EXPECTED DASHBOARD CALCULATIONS:')
    
    const parseAmount = (meta: any) => {
      const raw = meta?.amount ?? meta?.value ?? meta?.balance ?? meta?.currentBalance ?? 0
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw))
      return Number.isFinite(parsed) ? parsed : 0
    }

    let totalIncome = 0
    let totalExpenses = 0
    let totalBills = 0

    financialItems.forEach(item => {
      const meta = item.metadata || {}
      const amount = parseAmount(meta)
      const type = (meta.type || meta.logType || '').toLowerCase()

      if (type.includes('income') || type.includes('salary') || type.includes('earning')) {
        totalIncome += amount
      } else if (type.includes('expense') || type.includes('spending')) {
        totalExpenses += amount
      } else if (type.includes('bill')) {
        totalBills += amount
      }
    })

    console.log(`   Total Income: $${totalIncome.toFixed(2)}`)
    console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`)
    console.log(`   Total Bills: $${totalBills.toFixed(2)}`)
    console.log(`   Net: $${(totalIncome - totalExpenses).toFixed(2)}`)
  } else {
    console.log('⚠️  No financial data found')
  }

  // Check for timing/caching issues
  console.log('\n\n🔍 POTENTIAL ISSUES TO CHECK:')
  console.log('═'.repeat(65))
  
  if (totalItems === 0) {
    console.log('❌ CRITICAL: No data found in domain_entries table')
    console.log('   Possible causes:')
    console.log('   1. Data not yet added')
    console.log('   2. Wrong user_id')
    console.log('   3. RLS policies preventing access')
  } else {
    console.log('✅ Data exists in database')
    console.log('')
    console.log('If dashboard shows zeros, check:')
    console.log('1. Browser console for data loading logs')
    console.log('2. React DevTools to inspect useData() hook state')
    console.log('3. Network tab to see if API calls are succeeding')
    console.log('4. Whether dashboard is checking data before it loads')
  }

  console.log('\n\n📋 RECOMMENDED ACTIONS:')
  console.log('═'.repeat(65))
  
  if (totalItems > 0) {
    console.log('1. Open browser console (Cmd+Opt+J)')
    console.log('2. Navigate to dashboard (http://localhost:3000)')
    console.log('3. Look for these console logs:')
    console.log('   - "📡 Loading domain data from Supabase..."')
    console.log('   - "✅ Loaded from Supabase domain_entries"')
    console.log('   - "📊 Command Center Data:"')
    console.log('4. Compare logged counts with this script\'s output')
    console.log('5. If counts don\'t match, there\'s a data loading bug')
  }

  console.log('')
}

debugDashboardData().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

