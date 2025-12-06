import { NextResponse } from 'next/server'
import { GoogleCalendarSync } from '@/lib/integrations/google-calendar-sync'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const DOMAINS_TO_SYNC = ['health', 'vehicles', 'insurance', 'pets', 'home', 'relationships']

const looksLikePlaceholder = (value?: string) => {
  if (!value) return true
  const lower = value.toLowerCase()
  return lower.includes('your-project-id') || lower.includes('placeholder') || lower.includes('dummy')
}

let cachedSupabase: SupabaseClient<any, 'public', any> | null | undefined

const getSupabaseClient = (): SupabaseClient<any, 'public', any> | null => {
  if (cachedSupabase !== undefined) {
    return cachedSupabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKeyFallback = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const chosenKey = serviceRoleKey && !looksLikePlaceholder(serviceRoleKey) ? serviceRoleKey : anonKeyFallback

  if (!supabaseUrl || !chosenKey || looksLikePlaceholder(supabaseUrl) || looksLikePlaceholder(chosenKey)) {
    console.warn('Calendar background sync API: Supabase credentials missing or invalid.')
    cachedSupabase = null
    return null
  }

  cachedSupabase = createClient(supabaseUrl, chosenKey)
  return cachedSupabase
}

/**
 * POST /api/calendar/background-sync
 * Background job to sync all domain data to Google Calendar
 * Should be called by a cron job every 15 minutes
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and credentials for SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      )
    }

    // Verify auth token for background jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting background calendar sync...')

    // Get all users with Google OAuth connected
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('userId, access_token, refresh_token')
      .eq('provider', 'google')
      .not('access_token', 'is', null)

    if (accountsError || !accounts || accounts.length === 0) {
      console.log('No users with Google accounts found')
      return NextResponse.json({
        message: 'No users to sync',
        synced: 0,
      })
    }

    let totalSynced = 0
    const results: any[] = []

    for (const account of accounts) {
      try {
        console.log(`Syncing for user: ${account.userId}`)

        const calendarSync = new GoogleCalendarSync(
          account.access_token,
          account.refresh_token
        )

        for (const domain of DOMAINS_TO_SYNC) {
          try {
            // Fetch all records from domain
            const { data: records, error: recordsError } = await supabase
              .from(domain)
              .select('*')
              .eq('user_id', account.userId)

            if (recordsError || !records) {
              console.log(`No records found for ${domain}`)
              continue
            }

            for (const record of records) {
              // Check if already synced
              const isSynced = await GoogleCalendarSync.isSynced(
                account.userId,
                domain,
                record.id
              )

              if (isSynced) {
                continue // Skip already synced records
              }

              // Create calendar event
              const googleEventId = await calendarSync.createEventFromDomain(
                domain,
                record,
                account.userId
              )

              if (googleEventId) {
                totalSynced++
                results.push({
                  domain,
                  recordId: record.id,
                  googleEventId,
                })
              }
            }
          } catch (domainError) {
            console.error(`Error syncing ${domain}:`, domainError)
          }
        }
      } catch (userError) {
        console.error(`Error syncing user ${account.userId}:`, userError)
      }
    }

    console.log(`✅ Background sync complete. Synced ${totalSynced} events.`)

    return NextResponse.json({
      message: 'Sync complete',
      synced: totalSynced,
      results,
    })
  } catch (error: any) {
    console.error('Background sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/calendar/background-sync
 * Get sync status
 */
export async function GET() {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and credentials for SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
        { status: 503 }
      )
    }

    const { data: syncLogs, error } = await supabase
      .from('calendar_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recentSyncs = syncLogs.filter((log) => log.synced_at >= last24Hours)

    return NextResponse.json({
      totalSyncs: syncLogs.length,
      last24HoursSyncs: recentSyncs.length,
      lastSyncTime: syncLogs[0]?.synced_at || null,
      recentLogs: syncLogs.slice(0, 10),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get sync status' },
      { status: 500 }
    )
  }
}































