import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnosisFinanceData() {
  console.log('🔍 Diagnosing financial data structure...\n')

  const { data, error } = await supabase
    .from('domain_entries')
    .select('id, title, metadata, created_at')
    .eq('domain', 'financial')
    .eq('user_id', '713c0e33-31aa-4bb8-bf27-476b5eba942e')
    .limit(10)

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`✅ Found ${data?.length || 0} financial entries\n`)

  data?.forEach((entry, index) => {
    console.log(`Entry ${index + 1}:`)
    console.log(`  ID: ${entry.id}`)
    console.log(`  Title: ${entry.title}`)
    console.log(`  Metadata:`, JSON.stringify(entry.metadata, null, 2))
    console.log(`  Created: ${entry.created_at}`)
    console.log('---\n')
  })

  // Group by metadata.type and metadata.itemType
  const types = data?.reduce((acc: any, entry) => {
    const type = entry.metadata?.type || 'unknown'
    const itemType = entry.metadata?.itemType || 'unknown'
    const key = `${type}/${itemType}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log('\n📊 Breakdown by type/itemType:')
  Object.entries(types || {}).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`)
  })
}

diagnosisFinanceData()
