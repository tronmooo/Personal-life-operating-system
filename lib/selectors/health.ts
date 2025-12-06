import { normalizeMetadata } from '@/lib/utils/normalize-metadata'

export interface LatestVitals {
  weight?: number
  heartRate?: number
  bloodPressure?: string
  glucose?: number
}

export function extractLatestVitals(healthEntries: Array<any>): LatestVitals {
  const vitals = (healthEntries || [])
    .filter((item: any) => {
      const m = normalizeMetadata(item) as any
      const t = (m.type || '').toLowerCase()
      return t === 'vitals' || t === 'weight'
    })
    .map((item: any) => {
      const m = normalizeMetadata(item) as any
      return {
        date: (m.date as string) || item.createdAt,
        weight: typeof m.weight === 'number' ? m.weight : (typeof m.value === 'number' ? m.value : undefined),
        heartRate: typeof m.heartRate === 'number' ? m.heartRate : undefined,
        bloodPressure: m.bloodPressure,
        glucose: typeof m.glucose === 'number' ? m.glucose : undefined,
      }
    })
    .sort((a: any, b: any) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())

  const latest = vitals[0]
  if (!latest) return {}

  const bp = latest?.bloodPressure && typeof latest.bloodPressure === 'object' && 'systolic' in latest.bloodPressure && 'diastolic' in latest.bloodPressure
    ? `${latest.bloodPressure.systolic}/${latest.bloodPressure.diastolic}`
    : undefined

  return {
    weight: latest.weight,
    heartRate: latest.heartRate,
    bloodPressure: bp,
    glucose: latest.glucose,
  }
}

export function computeWeeklySleepAvg(healthEntries: Array<any>): { minutes: number; label: string } {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sleep = (healthEntries || [])
    .filter((item: any) => {
      const m = normalizeMetadata(item) as any
      return (m.type || '').toLowerCase() === 'sleep'
    })
    .map((item: any) => {
      const m = normalizeMetadata(item) as any
      const d = new Date(String((m.date as string) || item.createdAt))
      return { d, minutes: parseInt(String(m.durationMinutes || 0), 10) || 0 }
    })
    .filter(s => s.d >= sevenDaysAgo && s.d <= now)

  const total = sleep.reduce((sum, s) => sum + s.minutes, 0)
  const count = sleep.length || 1
  const avg = Math.round(total / count)
  const h = Math.floor(avg / 60)
  const m = avg % 60
  return { minutes: avg, label: `${h}h ${m}m` }
}










