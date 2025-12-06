import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseHealthData() {
  console.log('🔍 Diagnosing health data...\n')

  const { data, error } = await supabase
    .from('domain_entries')
    .select('*')
    .eq('domain', 'health')
    .eq('user_id', '713c0e33-31aa-4bb8-bf27-476b5eba942e')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${data?.length || 0} health entries\n`)

  data?.forEach((entry, index) => {
    console.log(`Entry ${index + 1}:`)
    console.log(`  ID: ${entry.id}`)
    console.log(`  Title: ${entry.title}`)
    console.log(`  Description: ${entry.description}`)
    console.log(`  Metadata:`, JSON.stringify(entry.metadata, null, 2))
    console.log(`  Created: ${entry.created_at}`)
    console.log('---\n')
  })

  // Group by type
  const types = data?.reduce((acc: any, entry) => {
    const meta = entry.metadata?.metadata || entry.metadata
    const type = meta?.type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  console.log('\n📊 Breakdown by type:')
  Object.entries(types || {}).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`)
  })

  // Check all domains
  console.log('\n\n📊 Checking ALL domains...\n')
  const { data: allDomains, error: allError } = await supabase
    .from('domain_entries')
    .select('domain')
    .eq('user_id', '713c0e33-31aa-4bb8-bf27-476b5eba942e')

  if (!allError && allDomains) {
    const domainCounts = allDomains.reduce((acc: any, entry) => {
      acc[entry.domain] = (acc[entry.domain] || 0) + 1
      return acc
    }, {})

    console.log('Domain counts:')
    Object.entries(domainCounts).sort((a: any, b: any) => b[1] - a[1]).forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`)
    })
  }
}

diagnoseHealthData()
