import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Debug endpoint to compare subscriptions data between tables
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Query 1: subscriptions table (used by DigitalLifeCard)
    const { data: subscriptionsTable, error: subsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)

    // Query 2: domain_entries with domain='digital' (used by SubscriptionsTab, DataProvider)
    // Note: NOT filtering by person_id to see ALL digital entries
    const { data: domainEntries, error: deError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('domain', 'digital')

    // Query 3: All domain_entries to see what domains exist
    const { data: allEntries, error: allError } = await supabase
      .from('domain_entries')
      .select('id, domain, title, metadata')
      .eq('user_id', user.id)

    const domainCounts: Record<string, number> = {}
    allEntries?.forEach(e => {
      domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1
    })

    console.log('🔍 [DEBUG] Subscriptions comparison:', {
      subscriptionsTable: subscriptionsTable?.length || 0,
      domainEntriesDigital: domainEntries?.length || 0,
      allDomainEntries: allEntries?.length || 0,
      domainCounts
    })

    return NextResponse.json({
      userId: user.id,
      subscriptionsTable: {
        count: subscriptionsTable?.length || 0,
        error: subsError?.message || null,
        data: subscriptionsTable?.map(s => ({
          id: s.id,
          service_name: s.service_name,
          cost: s.cost,
          frequency: s.frequency,
          status: s.status
        }))
      },
      domainEntriesDigital: {
        count: domainEntries?.length || 0,
        error: deError?.message || null,
        data: domainEntries?.map(e => {
          // Handle nested metadata structure
          const meta = e.metadata?.metadata ?? e.metadata ?? {}
          return {
            id: e.id,
            title: e.title,
            person_id: e.person_id, // Important: check if person_id filtering is the issue
            hasNestedMetadata: !!e.metadata?.metadata, // Check if nested
            type: meta.type,
            monthlyCost: meta.monthlyCost,
            renewalDate: meta.renewalDate,
            status: meta.status,
            rawMetadataKeys: Object.keys(e.metadata || {})
          }
        })
      },
      allDomainEntriesCounts: domainCounts,
      hypothesis: {
        H4: 'DigitalLifeCard reads from `subscriptions` table',
        H5: 'SubscriptionsTab writes to `domain_entries` table',
        issue: 'Data is stored in domain_entries but dashboard cards read from subscriptions table'
      }
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

