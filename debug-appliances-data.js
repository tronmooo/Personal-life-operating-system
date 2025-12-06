/**
 * Debug script to check appliances data in both tables
 * Run in browser console at http://localhost:3001
 */

async function debugAppliancesData() {
  console.log('🔍 DEBUGGING APPLIANCES DATA...\n')
  
  // Get Supabase client from window
  const supabase = window.supabase || (await import('@supabase/auth-helpers-nextjs').then(m => m.createClientComponentClient()))
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('❌ Not authenticated:', userError)
    return
  }
  
  console.log(`✅ User: ${user.email} (ID: ${user.id})\n`)
  
  // Check appliances table (AutoTrack)
  console.log('📊 APPLIANCES TABLE (AutoTrack saves here):')
  console.log('─'.repeat(80))
  const { data: appliancesTable, error: appError } = await supabase
    .from('appliances')
    .select('*')
    .eq('user_id', user.id)
  
  if (appError) {
    console.error('❌ Error reading appliances table:', appError)
  } else {
    console.table(appliancesTable.map(a => ({
      ID: a.id.substring(0, 8),
      Name: a.name,
      Brand: a.brand,
      Model: a.model_number,
      'Purchase Price': `$${a.purchase_price || 0}`,
      'Purchase Date': a.purchase_date,
      Location: a.location || 'N/A'
    })))
    console.log(`\n📈 Total appliances in 'appliances' table: ${appliancesTable.length}`)
    const totalValue = appliancesTable.reduce((sum, a) => sum + (a.purchase_price || 0), 0)
    console.log(`💰 Total value from 'appliances' table: $${totalValue.toLocaleString()}\n`)
  }
  
  // Check domain_entries table (Dashboard reads from here)
  console.log('\n📊 DOMAIN_ENTRIES TABLE (Dashboard reads from here):')
  console.log('─'.repeat(80))
  const { data: domainEntries, error: domainError } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('domain', 'appliances')
  
  if (domainError) {
    console.error('❌ Error reading domain_entries:', domainError)
  } else {
    console.table(domainEntries.map(e => ({
      ID: e.id.substring(0, 15),
      Title: e.title,
      'Purchase Price': `$${e.metadata?.purchasePrice || e.metadata?.value || 0}`,
      'Warranty Expiry': e.metadata?.warrantyExpiry || 'None',
      'Maintenance Due': e.metadata?.maintenanceDue || 'None',
      Brand: e.metadata?.brand || 'N/A'
    })))
    console.log(`\n📈 Total appliances in 'domain_entries': ${domainEntries.length}`)
    const totalValue = domainEntries.reduce((sum, e) => 
      sum + (Number(e.metadata?.value || e.metadata?.purchasePrice) || 0), 0
    )
    console.log(`💰 Total value from 'domain_entries': $${totalValue.toLocaleString()}`)
    
    const withWarranty = domainEntries.filter(e => 
      e.metadata?.warrantyExpiry && new Date(e.metadata.warrantyExpiry) > new Date()
    ).length
    console.log(`🛡️ Appliances under warranty: ${withWarranty}`)
    
    const withMaint = domainEntries.filter(e => 
      e.metadata?.maintenanceDue || e.metadata?.needsMaintenance
    ).length
    console.log(`🔧 Appliances needing maintenance: ${withMaint}\n`)
  }
  
  // Compare the two
  console.log('\n🔍 SYNC STATUS:')
  console.log('─'.repeat(80))
  const appliancesCount = appliancesTable?.length || 0
  const domainCount = domainEntries?.length || 0
  
  if (appliancesCount === domainCount) {
    console.log('✅ Tables are in sync (same count)')
  } else {
    console.warn(`⚠️ MISMATCH: ${appliancesCount} in 'appliances' but ${domainCount} in 'domain_entries'`)
    console.log('\n💡 To fix: Edit each appliance in AutoTrack and click Save')
    console.log('   This will trigger the sync to domain_entries')
  }
  
  // Check DataProvider state
  console.log('\n📦 DATAPROVIDER STATE (What React sees):')
  console.log('─'.repeat(80))
  const dataProviderAppliances = window.__DATA_PROVIDER_STATE__?.appliances || []
  if (dataProviderAppliances.length > 0) {
    console.table(dataProviderAppliances.slice(0, 5).map(a => ({
      ID: a.id?.substring(0, 15) || 'N/A',
      Title: a.title || 'N/A',
      'Purchase Price': `$${a.metadata?.purchasePrice || a.metadata?.value || 0}`,
      'Has Warranty': !!a.metadata?.warrantyExpiry,
      'Has Maintenance': !!(a.metadata?.maintenanceDue || a.metadata?.needsMaintenance)
    })))
    console.log(`📊 Total in DataProvider: ${dataProviderAppliances.length}`)
  } else {
    console.warn('⚠️ DataProvider has no appliances loaded')
    console.log('💡 Try refreshing the page or check if user is authenticated')
  }
  
  console.log('\n✅ Debug complete!')
  console.log('\n📝 Next steps:')
  console.log('1. If tables are out of sync, re-save appliances in AutoTrack')
  console.log('2. If dashboard shows $0, check metadata.purchasePrice in domain_entries')
  console.log('3. If counts are wrong, verify DataProvider is loading data correctly')
}

// Export to window for easy access
window.debugAppliancesData = debugAppliancesData

console.log('🔧 Debug script loaded! Run: debugAppliancesData()')

