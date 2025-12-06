import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { refreshAccessToken, getDailySteps, getDailyWeightKg, getSleepSessions, getWorkoutSessions, getHeartRateSamples, getBloodPressureSamples, getDailyActiveCalories } from '@/lib/integrations/google-fit'
import { mapSteps, mapWeight, mapSleep, mapWorkout, mapHeartRate, mapBloodPressure, mapCalories } from '@/lib/health-sync/mapper'

export async function POST(request: NextRequest) {
  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Load connection
  const { data: conn } = await supabase
    .from('health_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google_fit')
    .single()

  if (!conn) return NextResponse.json({ error: 'Not connected' }, { status: 400 })

  // Refresh token if needed (placeholder: always refresh for safety)
  const token = await refreshAccessToken(conn.refresh_token)
  await supabase.from('health_connections').update({
    access_token: token.access_token,
    expires_at: new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', conn.id)

  // Determine time window (last 24h as initial)
  const endMs = Date.now()
  const startMs = endMs - 24 * 60 * 60 * 1000

  let rows = 0

  // Steps (daily bucket)
  try {
    const steps = await getDailySteps(token.access_token, startMs, endMs)
    for (const s of steps) {
      const date = new Date(s.startTimeMillis).toISOString().slice(0, 10)
      const item = mapSteps(date, s.steps)
      await saveDomainItem(supabase, userId, 'fitness', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync steps data:', error)
    // Continue with other data types
  }

  // Weight (daily)
  try {
    const weights = await getDailyWeightKg(token.access_token, startMs, endMs)
    for (const w of weights) {
      const date = new Date(w.dateMs).toISOString().slice(0, 10)
      const item = mapWeight(date, w.kg)
      await saveDomainItem(supabase, userId, 'health', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync weight data:', error)
    // Continue with other data types
  }

  // Sleep sessions
  try {
    const sleeps = await getSleepSessions(token.access_token, startMs, endMs)
    for (const s of sleeps) {
      const item = mapSleep({
        startTimeMillis: s.startTimeMillis,
        endTimeMillis: s.endTimeMillis,
        durationMin: Math.round((Number(s.endTimeMillis) - Number(s.startTimeMillis)) / 60000),
      })
      await saveDomainItem(supabase, userId, 'health', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync sleep data:', error)
    // Continue with other data types
  }

  // Workouts (non-sleep sessions)
  try {
    const workouts = await getWorkoutSessions(token.access_token, startMs, endMs)
    for (const w of workouts) {
      const item = mapWorkout({
        id: w.id,
        name: w.name,
        activityType: w.activityType,
        startTimeMillis: w.startTimeMillis,
        endTimeMillis: w.endTimeMillis,
      })
      await saveDomainItem(supabase, userId, 'fitness', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync workout data:', error)
    // Continue with other data types
  }

  // Heart rate samples
  try {
    const hrSamples = await getHeartRateSamples(token.access_token, startMs, endMs)
    for (const hr of hrSamples) {
      const item = mapHeartRate(hr.timestampMs, hr.bpm)
      await saveDomainItem(supabase, userId, 'health', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync heart rate data:', error)
    // Continue with other data types
  }

  // Blood pressure samples
  try {
    const bpSamples = await getBloodPressureSamples(token.access_token, startMs, endMs)
    for (const bp of bpSamples) {
      const item = mapBloodPressure(bp.timestampMs, bp.systolic, bp.diastolic)
      await saveDomainItem(supabase, userId, 'health', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync blood pressure data:', error)
    // Continue with other data types
  }

  // Active calories (daily)
  try {
    const calories = await getDailyActiveCalories(token.access_token, startMs, endMs)
    for (const c of calories) {
      const date = new Date(c.dateMs).toISOString().slice(0, 10)
      const item = mapCalories(date, c.calories)
      await saveDomainItem(supabase, userId, 'fitness', item)
      rows++
    }
  } catch (error) {
    console.error('Failed to sync calories data:', error)
    // Continue with other data types
  }

  await supabase.from('health_sync_log').insert({ user_id: userId, provider: 'google_fit', status: 'success', rows_ingested: rows, time_window_start: new Date(startMs).toISOString(), time_window_end: new Date(endMs).toISOString() })

  return NextResponse.json({ ok: true })
}

async function saveDomainItem(supabase: any, userId: string, domain: string, item: any) {
  // Load existing domain data
  const { data: domainRow } = await supabase
    .from('domains')
    .select('*')
    .eq('user_id', userId)
    .eq('domain_name', domain)
    .single()

  const existing = (domainRow?.data as any[]) || []
  const exists = existing.some((x: any) => x.id === item.id)
  if (exists) return
  const updated = [...existing, item]
  if (domainRow) {
    await supabase.from('domains').update({ data: updated, updated_at: new Date().toISOString() }).eq('id', domainRow.id)
  } else {
    await supabase.from('domains').insert({ user_id: userId, domain_name: domain, data: updated })
  }
}


