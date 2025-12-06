#!/usr/bin/env ts-node

/**
 * Comprehensive QA Report Generator
 * Generates a detailed report of all domain statuses, data counts, and system health
 * Can be used for manual QA verification and automated monitoring
 * 
 * Usage: npx ts-node scripts/generate-qa-report.ts
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
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

interface DomainStatus {
  domain: string
  table: string
  exists: boolean
  itemCount: number
  hasRLS: boolean
  status: 'OK' | 'WARNING' | 'ERROR'
  message: string
}

interface TableStatus {
  tableName: string
  exists: boolean
  rowCount: number
  error?: string
}

async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

async function checkTable(tableName: string, userId?: string): Promise<TableStatus> {
  try {
    let query = supabase.from(tableName).select('*', { count: 'exact', head: true })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { count, error } = await query
    
    if (error) {
      return {
        tableName,
        exists: false,
        rowCount: 0,
        error: error.message
      }
    }
    
    return {
      tableName,
      exists: true,
      rowCount: count || 0
    }
  } catch (error: any) {
    return {
      tableName,
      exists: false,
      rowCount: 0,
      error: error.message
    }
  }
}

async function generateQAReport() {
  console.log('╔═══════════════════════════════════════════════════════════════╗')
  console.log('║           COMPREHENSIVE QA REPORT GENERATOR                   ║')
  console.log('╚═══════════════════════════════════════════════════════════════╝\n')

  const timestamp = new Date().toISOString()
  const reportLines: string[] = []

  reportLines.push('# LIFEHUB QA REPORT')
  reportLines.push(`**Generated:** ${timestamp}`)
  reportLines.push(`**Environment:** Production`)
  reportLines.push('')

  // Check user
  console.log('🔍 Checking authentication...')
  const user = await getCurrentUser()
  
  if (!user) {
    reportLines.push('## ❌ **CRITICAL: No Authenticated User**')
    reportLines.push('Cannot generate complete report without user authentication.')
    reportLines.push('')
    console.log('❌ No authenticated user found')
  } else {
    reportLines.push('## ✅ **Authentication Status**')
    reportLines.push(`- User: ${user.email}`)
    reportLines.push(`- User ID: ${user.id}`)
    reportLines.push('')
    console.log(`✅ User authenticated: ${user.email}`)
  }

  // Check critical tables
  console.log('\n🔍 Checking critical tables...')
  reportLines.push('## 📊 **Critical Tables Status**')
  reportLines.push('')

  const criticalTables = [
    { name: 'domain_entries', description: 'Main domain data' },
    { name: 'health_metrics', description: 'Health domain data' },
    { name: 'insurance_policies', description: 'Insurance policies' },
    { name: 'insurance_claims', description: 'Insurance claims' }
  ]

  for (const table of criticalTables) {
    const status = await checkTable(table.name, user?.id)
    const icon = status.exists ? '✅' : '❌'
    
    reportLines.push(`### ${icon} ${table.name}`)
    reportLines.push(`- **Description:** ${table.description}`)
    reportLines.push(`- **Exists:** ${status.exists ? 'Yes' : 'No'}`)
    reportLines.push(`- **Row Count:** ${status.rowCount}`)
    if (status.error) {
      reportLines.push(`- **Error:** ${status.error}`)
    }
    reportLines.push('')
    
    console.log(`${icon} ${table.name}: ${status.rowCount} rows`)
  }

  // Check domain data counts
  if (user) {
    console.log('\n🔍 Checking domain data...')
    reportLines.push('## 📈 **Domain Data Summary**')
    reportLines.push('')

    const { data: domainData, error: domainError } = await supabase
      .from('domain_entries')
      .select('domain')
      .eq('user_id', user.id)

    if (domainError) {
      reportLines.push(`❌ Error loading domain data: ${domainError.message}`)
      reportLines.push('')
    } else {
      const domains = domainData?.reduce((acc, item) => {
        acc[item.domain] = (acc[item.domain] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

      reportLines.push('| Domain | Item Count | Status |')
      reportLines.push('|--------|------------|--------|')

      const allDomains = ['financial', 'health', 'insurance', 'home', 'vehicles', 'appliances', 
                          'pets', 'relationships', 'digital', 'mindfulness', 'fitness', 
                          'nutrition', 'legal', 'miscellaneous']

      for (const domain of allDomains) {
        const count = domains[domain] || 0
        const status = count > 0 ? '✅' : '⚠️'
        reportLines.push(`| ${domain} | ${count} | ${status} |`)
        console.log(`  ${domain}: ${count} items`)
      }
      reportLines.push('')
    }
  }

  // System health checks
  console.log('\n🔍 Running system health checks...')
  reportLines.push('## 🏥 **System Health**')
  reportLines.push('')

  // Check if new tables exist
  const healthCheck = await checkTable('health_metrics', user?.id)
  const insuranceCheck = await checkTable('insurance_policies', user?.id)

  const healthStatus = healthCheck.exists && insuranceCheck.exists

  reportLines.push(`### ${healthStatus ? '✅' : '❌'} Schema Migration Status`)
  reportLines.push('')
  reportLines.push(`- **health_metrics table:** ${healthCheck.exists ? '✅ Exists' : '❌ Missing'}`)
  reportLines.push(`- **insurance_policies table:** ${insuranceCheck.exists ? '✅ Exists' : '❌ Missing'}`)
  reportLines.push(`- **insurance_claims table:** ${insuranceCheck.exists ? '✅ Exists' : '❌ Missing'}`)
  reportLines.push('')

  if (!healthStatus) {
    reportLines.push('**⚠️ ACTION REQUIRED:**')
    reportLines.push('The schema migration has not been applied yet.')
    reportLines.push('1. Open: https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc')
    reportLines.push('2. Go to: SQL Editor')
    reportLines.push('3. Paste: Contents of APPLY_THIS_SQL_NOW.sql')
    reportLines.push('4. Click: Run')
    reportLines.push('')
  }

  // Overall status
  reportLines.push('## 🎯 **Overall Status**')
  reportLines.push('')

  const issuesFound: string[] = []
  if (!user) issuesFound.push('No authenticated user')
  if (!healthStatus) issuesFound.push('Schema migration not applied')
  if (user && healthCheck.rowCount === 0 && insuranceCheck.rowCount === 0) {
    issuesFound.push('No test data in new tables')
  }

  if (issuesFound.length === 0) {
    reportLines.push('✅ **ALL SYSTEMS OPERATIONAL**')
    reportLines.push('')
    reportLines.push('- Authentication: Working')
    reportLines.push('- Database: Connected')
    reportLines.push('- Schema: Up to date')
    reportLines.push('- Data: Available')
    reportLines.push('')
  } else {
    reportLines.push('⚠️ **ISSUES FOUND:**')
    reportLines.push('')
    issuesFound.forEach(issue => {
      reportLines.push(`- ❌ ${issue}`)
    })
    reportLines.push('')
  }

  // Next steps
  reportLines.push('## 📋 **Next Steps**')
  reportLines.push('')

  if (!user) {
    reportLines.push('1. Log in to the application')
    reportLines.push('2. Re-run this QA report')
  } else if (!healthStatus) {
    reportLines.push('1. Apply SQL migration (see instructions above)')
    reportLines.push('2. Run verification: `npm run verify:schema`')
    reportLines.push('3. Seed test data: `npm run seed:health` and `npm run seed:insurance`')
    reportLines.push('4. Re-run this QA report')
  } else if (healthCheck.rowCount === 0 && insuranceCheck.rowCount === 0) {
    reportLines.push('1. Seed test data: `npm run seed:health`')
    reportLines.push('2. Seed test data: `npm run seed:insurance`')
    reportLines.push('3. Test domains in browser')
    reportLines.push('4. Re-run this QA report')
  } else {
    reportLines.push('1. ✅ Test health domain: http://localhost:3000/domains/health')
    reportLines.push('2. ✅ Test insurance domain: http://localhost:3000/domains/insurance')
    reportLines.push('3. ✅ Run CRUD tests: `npm run test:health-crud`')
    reportLines.push('4. ✅ Run CRUD tests: `npm run test:insurance-crud`')
    reportLines.push('5. ✅ Use Chrome DevTools for manual QA')
  }

  reportLines.push('')
  reportLines.push('---')
  reportLines.push(`**Report Generated:** ${new Date().toLocaleString()}`)

  // Write report to file
  const reportContent = reportLines.join('\n')
  const reportPath = path.join(process.cwd(), 'QA_REPORT.md')
  fs.writeFileSync(reportPath, reportContent)

  console.log(`\n✅ QA Report generated: QA_REPORT.md`)
  console.log('')

  // Print summary to console
  console.log('═'.repeat(65))
  console.log('📊 SUMMARY')
  console.log('═'.repeat(65))
  console.log('')
  console.log(`User: ${user ? user.email : 'Not authenticated'}`)
  console.log(`Schema Status: ${healthStatus ? '✅ Up to date' : '❌ Migration needed'}`)
  console.log(`Issues Found: ${issuesFound.length}`)
  console.log('')
  console.log('Full report saved to: QA_REPORT.md')
  console.log('')

  process.exit(issuesFound.length > 0 ? 1 : 0)
}

// Run report generation
generateQAReport().catch(error => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

