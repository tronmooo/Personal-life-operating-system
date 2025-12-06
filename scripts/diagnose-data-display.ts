import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseDataDisplay() {
  console.log('🔍 Diagnosing Data Display Issues\n')

  // 1. Get all domain entries and check for metadata nesting issues
  const { data: entries, error } = await supabase
    .from('domain_entries')
    .select('id, domain, title, metadata, user_id')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('❌ Error fetching domain entries:', error)
    return
  }

  console.log(`📊 Found ${entries?.length || 0} domain entries\n`)

  // Group by domain
  const byDomain: Record<string, any[]> = {}
  const nestedMetadataIssues: any[] = []
  const userIds = new Set<string>()

  entries?.forEach(entry => {
    if (!byDomain[entry.domain]) {
      byDomain[entry.domain] = []
    }
    byDomain[entry.domain].push(entry)
    userIds.add(entry.user_id)

    // Check for nested metadata issue
    if (entry.metadata && typeof entry.metadata === 'object') {
      const meta = entry.metadata as any
      if (meta.metadata && typeof meta.metadata === 'object') {
        nestedMetadataIssues.push({
          id: entry.id,
          domain: entry.domain,
          title: entry.title,
          hasNestedMetadata: true
        })
      }
    }
  })

  console.log('👥 Unique user IDs in data:', Array.from(userIds).length)
  console.log('   User IDs:', Array.from(userIds).slice(0, 3).join(', '))
  console.log()

  console.log('📦 Domain Distribution:')
  Object.keys(byDomain).sort().forEach(domain => {
    console.log(`   ${domain}: ${byDomain[domain].length} items`)
  })
  console.log()

  if (nestedMetadataIssues.length > 0) {
    console.log('⚠️  NESTED METADATA ISSUES FOUND!')
    console.log(`   ${nestedMetadataIssues.length} entries have metadata.metadata nesting\n`)
    console.log('   Examples:')
    nestedMetadataIssues.slice(0, 5).forEach(issue => {
      console.log(`   - ${issue.domain}: ${issue.title} (${issue.id})`)
    })
    console.log()
  } else {
    console.log('✅ No nested metadata issues found\n')
  }

  // 2. Check a few sample entries for each domain
  console.log('🔎 Sample Data Structure:\n')
  for (const domain of Object.keys(byDomain).sort().slice(0, 3)) {
    const sample = byDomain[domain][0]
    console.log(`   ${domain.toUpperCase()}:`)
    console.log(`   - Title: ${sample.title}`)
    console.log(`   - Metadata keys: ${Object.keys(sample.metadata || {}).join(', ')}`)

    if (sample.metadata?.metadata) {
      console.log(`   - ⚠️  HAS NESTED metadata.metadata!`)
      console.log(`   - Inner metadata keys: ${Object.keys(sample.metadata.metadata || {}).join(', ')}`)
    }
    console.log()
  }

  // 3. Check for empty or null metadata
  const emptyMetadata = entries?.filter(e => !e.metadata || Object.keys(e.metadata).length === 0) || []
  console.log(`📊 Empty metadata: ${emptyMetadata.length} entries`)
  if (emptyMetadata.length > 0) {
    console.log('   Domains affected:', [...new Set(emptyMetadata.map(e => e.domain))].join(', '))
  }
  console.log()

  // 4. Check for user authentication issues
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    console.log('✅ Authenticated as:', session.user.email || session.user.id)

    const userEntries = entries?.filter(e => e.user_id === session.user.id) || []
    console.log(`   Your entries: ${userEntries.length}`)
    console.log(`   Other users' entries: ${(entries?.length || 0) - userEntries.length}`)
  } else {
    console.log('⚠️  Not authenticated - using service role key')
  }
  console.log()

  console.log('✅ Diagnosis complete!')
}

diagnoseDataDisplay().catch(console.error)
