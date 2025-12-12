/**
 * Integration Sync API
 * Handles data sync for connected services
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConnectionData = Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyncResult = Record<string, any>
type SyncHandler = (connection: ConnectionData, supabase: SupabaseClient, userId: string) => Promise<SyncResult>

// Sync handlers for different providers
const SYNC_HANDLERS: Record<string, SyncHandler> = {
  // OpenWeather - fetch current weather
  openweather: async (connection, supabase, userId) => {
    const apiKey = connection.access_token
    if (!apiKey) throw new Error('API key not found')

    // Get user location
    const { data: location } = await supabase
      .from('user_locations')
      .select('latitude, longitude, city')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single()

    if (!location) {
      return { message: 'No location set. Add your location in settings.' }
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${apiKey}&units=imperial`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch weather data')
    }

    const weather = await response.json()
    return {
      synced: true,
      data: {
        temperature: weather.main.temp,
        feels_like: weather.main.feels_like,
        description: weather.weather[0]?.description,
        humidity: weather.main.humidity,
        city: location.city,
      }
    }
  },

  // Todoist - fetch tasks
  todoist: async (connection, supabase, userId) => {
    const apiKey = connection.access_token
    if (!apiKey) throw new Error('API key not found')

    const response = await fetch('https://api.todoist.com/rest/v2/tasks', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch Todoist tasks')
    }

    const tasks = await response.json()
    
    // Sync tasks to LifeHub
    for (const task of tasks.slice(0, 20)) { // Limit to 20 tasks
      await supabase
        .from('tasks')
        .upsert({
          user_id: userId,
          title: task.content,
          description: task.description || null,
          priority: task.priority === 4 ? 'high' : task.priority === 3 ? 'medium' : 'low',
          due_date: task.due?.date ? new Date(task.due.date).toISOString() : null,
          completed: task.is_completed,
          metadata: {
            source: 'todoist',
            todoist_id: task.id,
            project_id: task.project_id,
          },
        }, {
          onConflict: 'user_id,title',
        })
    }

    return {
      synced: true,
      tasksImported: Math.min(tasks.length, 20),
      totalTasks: tasks.length,
    }
  },

  // Spotify - fetch recently played
  spotify: async (connection, supabase, userId) => {
    const accessToken = connection.access_token
    if (!accessToken) throw new Error('Access token not found')

    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      // Token expired - need to refresh
      throw new Error('Token expired. Please reconnect Spotify.')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify data')
    }

    const data = await response.json()
    return {
      synced: true,
      recentTracks: data.items?.length || 0,
      lastPlayed: data.items?.[0]?.track?.name,
    }
  },

  // Strava - fetch recent activities
  strava: async (connection, supabase, userId) => {
    const accessToken = connection.access_token
    if (!accessToken) throw new Error('Access token not found')

    const response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      throw new Error('Token expired. Please reconnect Strava.')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch Strava activities')
    }

    const activities = await response.json()

    // Sync activities to fitness_activities
    for (const activity of activities) {
      await supabase
        .from('fitness_activities')
        .upsert({
          user_id: userId,
          activity_type: activity.type.toLowerCase(),
          activity_name: activity.name,
          start_time: activity.start_date,
          duration_minutes: Math.round(activity.elapsed_time / 60),
          distance_km: activity.distance / 1000,
          calories_burned: activity.kilojoules ? Math.round(activity.kilojoules * 0.239) : null,
          metadata: {
            source: 'strava',
            strava_id: activity.id,
            average_speed: activity.average_speed,
            max_speed: activity.max_speed,
          },
        }, {
          onConflict: 'user_id,start_time',
        })
    }

    return {
      synced: true,
      activitiesImported: activities.length,
    }
  },

  // Fitbit - fetch daily summary
  fitbit: async (connection, supabase, userId) => {
    const accessToken = connection.access_token
    if (!accessToken) throw new Error('Access token not found')

    const today = new Date().toISOString().split('T')[0]
    const response = await fetch(`https://api.fitbit.com/1/user/-/activities/date/${today}.json`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (response.status === 401) {
      throw new Error('Token expired. Please reconnect Fitbit.')
    }

    if (!response.ok) {
      throw new Error('Failed to fetch Fitbit data')
    }

    const data = await response.json()
    const summary = data.summary

    // Create a fitness activity for today
    if (summary) {
      await supabase
        .from('fitness_activities')
        .upsert({
          user_id: userId,
          activity_type: 'daily_summary',
          activity_name: `Daily Activity - ${today}`,
          start_time: new Date(today).toISOString(),
          steps: summary.steps,
          calories_burned: summary.caloriesOut,
          duration_minutes: summary.veryActiveMinutes + summary.fairlyActiveMinutes,
          metadata: {
            source: 'fitbit',
            floors: summary.floors,
            sedentary_minutes: summary.sedentaryMinutes,
            lightly_active: summary.lightlyActiveMinutes,
          },
        }, {
          onConflict: 'user_id,start_time',
        })
    }

    return {
      synced: true,
      steps: summary?.steps || 0,
      calories: summary?.caloriesOut || 0,
    }
  },

  // Generic handler for unsupported providers
  // Generic handler for unsupported providers
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  default: async (connection, _supabase, _userId) => {
    return {
      synced: true,
      message: `Sync marked complete for ${connection.provider}. Real-time sync not yet implemented.`,
    }
  },
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    // Get connection details
    const { data: connection, error: connError } = await supabase
      .from('external_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('status', 'active')
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Get the sync handler
    const handler = SYNC_HANDLERS[provider] || SYNC_HANDLERS.default

    // Execute sync
    const startTime = Date.now()
    const result = await handler(connection, supabase, user.id)
    const duration = Date.now() - startTime

    // Update last_synced timestamp
    await supabase
      .from('external_connections')
      .update({ 
        last_synced: new Date().toISOString(),
        metadata: {
          ...connection.metadata,
          last_sync_duration_ms: duration,
          last_sync_result: result,
        },
      })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      provider,
      ...result,
      duration_ms: duration,
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}

