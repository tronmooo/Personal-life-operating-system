#!/usr/bin/env node
/**
 * Script to identify and clean up duplicate vehicle entries in domain_entries table
 * 
 * Run with: node scripts/cleanup-duplicates.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function findDuplicates() {
  console.log('🔍 Searching for duplicate vehicles...\n')
  
  const { data: vehicles, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('domain', 'vehicles')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('❌ Error fetching vehicles:', error)
    return
  }
  
  console.log(`📊 Total vehicles found: ${vehicles?.length || 0}\n`)
  
  // Group by title to find duplicates
  const grouped = new Map()
  
  vehicles?.forEach((vehicle) => {
    const title = vehicle.title || 'Untitled'
    if (!grouped.has(title)) {
      grouped.set(title, [])
    }
    grouped.get(title).push(vehicle)
  })
  
  // Find entries with duplicates
  const duplicates = Array.from(grouped.entries())
    .filter(([_, entries]) => entries.length > 1)
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }
  
  console.log(`⚠️  Found ${duplicates.length} duplicate groups:\n`)
  
  for (const [title, entries] of duplicates) {
    console.log(`📌 "${title}" - ${entries.length} copies:`)
    entries.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. ID: ${entry.id}, Created: ${new Date(entry.created_at).toLocaleString()}`)
    })
    console.log()
  }
  
  return duplicates
}

async function cleanupDuplicates(dryRun = true) {
  const duplicates = await findDuplicates()
  
  if (!duplicates || duplicates.length === 0) {
    return
  }
  
  console.log(dryRun ? '\n🧪 DRY RUN MODE - No deletions will occur\n' : '\n🗑️  DELETION MODE - Removing duplicates...\n')
  
  let totalToDelete = 0
  const idsToDelete = []
  
  for (const [title, entries] of duplicates) {
    // Keep the first entry (oldest), delete the rest
    const [keep, ...toDelete] = entries
    totalToDelete += toDelete.length
    
    console.log(`📌 "${title}":`)
    console.log(`   ✅ Keeping: ${keep.id} (created ${new Date(keep.created_at).toLocaleDateString()})`)
    
    toDelete.forEach((entry) => {
      console.log(`   ❌ ${dryRun ? 'Would delete' : 'Deleting'}: ${entry.id}`)
      idsToDelete.push(entry.id)
    })
    console.log()
  }
  
  if (!dryRun && idsToDelete.length > 0) {
    console.log(`\n🗑️  Deleting ${idsToDelete.length} duplicate entries...`)
    
    const { error } = await supabase
      .from('domain_entries')
      .delete()
      .in('id', idsToDelete)
    
    if (error) {
      console.error('❌ Error deleting duplicates:', error)
      return
    }
    
    console.log(`✅ Successfully deleted ${idsToDelete.length} duplicate entries!`)
  } else {
    console.log(`\n📊 Summary: Would delete ${totalToDelete} duplicate entries`)
    console.log('💡 Run with --execute flag to perform actual deletion')
  }
}

// Main execution
const args = process.argv.slice(2)
const execute = args.includes('--execute')

cleanupDuplicates(!execute)
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })






