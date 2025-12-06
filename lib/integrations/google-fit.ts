// Google Fit REST client (OAuth on server). Read-only scopes recommended.

type Token = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<Token> {
  const body = new URLSearchParams()
  body.set('code', code)
  body.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID || '')
  body.set('client_secret', process.env.GOOGLE_OAUTH_CLIENT_SECRET || '')
  body.set('redirect_uri', redirectUri)
  body.set('grant_type', 'authorization_code')
  const res = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', body })
  if (!res.ok) throw new Error('Failed to exchange code')
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<Token> {
  const body = new URLSearchParams()
  body.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID || '')
  body.set('client_secret', process.env.GOOGLE_OAUTH_CLIENT_SECRET || '')
  body.set('refresh_token', refreshToken)
  body.set('grant_type', 'refresh_token')
  const res = await fetch(GOOGLE_TOKEN_URL, { method: 'POST', body })
  if (!res.ok) throw new Error('Failed to refresh token')
  const json = await res.json()
  return { ...json, refresh_token: refreshToken }
}

// Sample data fetchers (Datasets, Sessions). These can be expanded per metric.
const FIT_BASE = 'https://www.googleapis.com/fitness/v1/users/me'

async function fitGet(path: string, accessToken: string) {
  const res = await fetch(`${FIT_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`Google Fit error: ${res.status}`)
  return res.json()
}

export async function getSessions(startMs: number, endMs: number, accessToken: string) {
  return fitGet(`/sessions?startTimeMillis=${startMs}&endTimeMillis=${endMs}`, accessToken)
}

export async function getDataset(dataSourceId: string, startNs: string, endNs: string, accessToken: string) {
  // datasetId is start-end in nanoseconds
  const datasetId = `${startNs}-${endNs}`
  return fitGet(`/dataset:aggregate`, accessToken) // Placeholder: replace with aggregate POST if needed
}

// Aggregate helper
async function aggregate(accessToken: string, body: any) {
  const res = await fetch(`${FIT_BASE}/dataset:aggregate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error(`Google Fit aggregate error: ${res.status}`)
  return res.json()
}

export async function getDailySteps(accessToken: string, startMs: number, endMs: number) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  }
  const data = await aggregate(accessToken, body)
  const buckets = data?.bucket || []
  return buckets.map((b: any) => ({
    startTimeMillis: Number(b.startTimeMillis),
    endTimeMillis: Number(b.endTimeMillis),
    steps: Number(b.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0),
  }))
}

export async function getDailyWeightKg(accessToken: string, startMs: number, endMs: number) {
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.weight' }],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  }
  const data = await aggregate(accessToken, body)
  const buckets = data?.bucket || []
  return buckets.map((b: any) => {
    const point = b.dataset?.[0]?.point?.[0]
    const kg = point?.value?.[0]?.fpVal
    return { dateMs: Number(b.startTimeMillis), kg: typeof kg === 'number' ? kg : null }
  }).filter((x: any) => x.kg !== null)
}

export async function getSleepSessions(accessToken: string, startMs: number, endMs: number) {
  // Sleep is represented as sessions with activityType 72
  const sessions = await getSessions(startMs, endMs, accessToken)
  const list = sessions?.session || []
  return list.filter((s: any) => String(s.activityType) === '72' || s.name?.toLowerCase()?.includes('sleep'))
}

export async function getWorkoutSessions(accessToken: string, startMs: number, endMs: number) {
  const sessions = await getSessions(startMs, endMs, accessToken)
  const list = sessions?.session || []
  // Exclude sleep (72)
  return list.filter((s: any) => String(s.activityType) !== '72')
}

export async function getHeartRateSamples(accessToken: string, startMs: number, endMs: number) {
  // Get heart rate data points
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.heart_rate.bpm' }],
    bucketByTime: { durationMillis: 60 * 60 * 1000 }, // hourly buckets
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  }
  const data = await aggregate(accessToken, body)
  const buckets = data?.bucket || []
  const samples: any[] = []
  for (const b of buckets) {
    const points = b.dataset?.[0]?.point || []
    for (const p of points) {
      const bpm = p.value?.[0]?.fpVal
      if (bpm) {
        samples.push({
          timestampMs: Number(p.startTimeNanos) / 1000000,
          bpm: Math.round(bpm),
        })
      }
    }
  }
  return samples
}

export async function getBloodPressureSamples(accessToken: string, startMs: number, endMs: number) {
  // Blood pressure: systolic and diastolic
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.blood_pressure' }],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 }, // daily
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  }
  const data = await aggregate(accessToken, body)
  const buckets = data?.bucket || []
  const samples: any[] = []
  for (const b of buckets) {
    const points = b.dataset?.[0]?.point || []
    for (const p of points) {
      const systolic = p.value?.[0]?.fpVal
      const diastolic = p.value?.[1]?.fpVal
      if (systolic && diastolic) {
        samples.push({
          timestampMs: Number(p.startTimeNanos) / 1000000,
          systolic: Math.round(systolic),
          diastolic: Math.round(diastolic),
        })
      }
    }
  }
  return samples
}

export async function getDailyActiveCalories(accessToken: string, startMs: number, endMs: number) {
  // Active calories (calories burned during activity)
  const body = {
    aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }],
    bucketByTime: { durationMillis: 24 * 60 * 60 * 1000 },
    startTimeMillis: startMs,
    endTimeMillis: endMs,
  }
  const data = await aggregate(accessToken, body)
  const buckets = data?.bucket || []
  return buckets.map((b: any) => {
    const point = b.dataset?.[0]?.point?.[0]
    const calories = point?.value?.[0]?.fpVal
    return {
      dateMs: Number(b.startTimeMillis),
      calories: calories ? Math.round(calories) : 0,
    }
  }).filter((x: any) => x.calories > 0)
}


