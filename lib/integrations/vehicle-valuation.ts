/* Vehicle valuation (KBB/Edmunds via RapidAPI) and recall lookups (NHTSA) */

export type VehicleQuery = {
  vin?: string
  year?: number | string
  make?: string
  model?: string
  trim?: string
  mileage?: number
  zipCode?: string
}

export type VehicleValuation = {
  value: number | null
  low?: number | null
  high?: number | null
  source: string
  raw?: any
}

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY

export async function fetchVehicleValuation(q: VehicleQuery): Promise<VehicleValuation> {
  // Prefer VIN-based APIs if provided
  if (RAPIDAPI_KEY && q.vin) {
    // Try Edmunds (example RapidAPI vendor; actual endpoint may vary)
    try {
      const url = `https://edmunds4.p.rapidapi.com/v1/vehicle/${encodeURIComponent(q.vin)}/valuation` // placeholder vendor path
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY as string,
          'X-RapidAPI-Host': 'edmunds4.p.rapidapi.com',
        },
      })
      if (res.ok) {
        const data = await res.json()
        const v = Number(data?.valuation || data?.price?.marketAverage)
        if (Number.isFinite(v)) {
          return {
            value: v,
            low: Number(data?.price?.low) || null,
            high: Number(data?.price?.high) || null,
            source: 'RapidAPI:Edmunds',
            raw: data,
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Edmunds valuation:', error)
      // Continue to try other APIs
    }
  }

  if (RAPIDAPI_KEY && q.year && q.make && q.model) {
    // Try generic KBB-like market endpoints (placeholder)
    try {
      const params = new URLSearchParams()
      params.set('year', String(q.year))
      params.set('make', String(q.make))
      params.set('model', String(q.model))
      if (q.trim) params.set('trim', q.trim)
      if (q.mileage) params.set('mileage', String(q.mileage))
      if (q.zipCode) params.set('zip', String(q.zipCode))
      const url = `https://kbb-vehicle-data.p.rapidapi.com/valuation?${params.toString()}` // placeholder vendor
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY as string,
          'X-RapidAPI-Host': 'kbb-vehicle-data.p.rapidapi.com',
        },
      })
      if (res.ok) {
        const data = await res.json()
        const v = Number(data?.valuation || data?.privateParty?.average)
        if (Number.isFinite(v)) {
          return {
            value: v,
            low: Number(data?.privateParty?.low) || null,
            high: Number(data?.privateParty?.high) || null,
            source: 'RapidAPI:KBB',
            raw: data,
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch KBB valuation:', error)
      // Continue to return unavailable
    }
  }

  return { value: null, source: 'unavailable' }
}

// NHTSA recalls: no key required
export async function fetchNhtsaRecalls(vin?: string): Promise<any[]> {
  if (!vin) return []
  try {
    const res = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    const list = Array.isArray(data?.results) ? data.results : []
    return list
  } catch {
    return []
  }
}


