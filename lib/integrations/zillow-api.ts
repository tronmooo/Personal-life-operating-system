/*
  Real Estate valuation integration.
  Uses Realty Mole API (most reliable), with multiple fallbacks.
*/

type FetchPropertyValueParams = {
  address: string
}

export type PropertyValuation = {
  value: number | null
  source: string
  accuracy?: 'high' | 'medium' | 'low'
  raw?: unknown
}

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY

// Statistical estimate based on location (used as fallback)
function getStatisticalEstimate(address: string): number {
  const addressLower = address.toLowerCase()
  let baseValue = 350000 // National median
  
  if (addressLower.includes('california') || addressLower.includes(', ca ')) {
    baseValue = 750000
  } else if (addressLower.includes('florida') || addressLower.includes(', fl ')) {
    baseValue = 400000
    if (addressLower.includes('miami') || addressLower.includes('fort lauderdale')) {
      baseValue = 550000
    } else if (addressLower.includes('tampa') || addressLower.includes('tarpon springs')) {
      baseValue = 380000
    }
  } else if (addressLower.includes('texas') || addressLower.includes(', tx ')) {
    baseValue = 380000
  } else if (addressLower.includes('new york') || addressLower.includes(', ny ')) {
    baseValue = 600000
  } else if (addressLower.includes('washington') || addressLower.includes(', wa ')) {
    baseValue = 550000
  } else if (addressLower.includes('colorado') || addressLower.includes(', co ')) {
    baseValue = 500000
  } else if (addressLower.includes('arizona') || addressLower.includes(', az ')) {
    baseValue = 420000
  }
  
  // Add small variance
  const variance = (Math.random() - 0.5) * 0.1
  return Math.round(baseValue * (1 + variance))
}

export async function fetchPropertyValue({ address }: FetchPropertyValueParams): Promise<PropertyValuation> {
  if (!address || !address.trim()) {
    return { value: null, source: 'invalid_address' }
  }

  // 1) Realty Mole API (most reliable free option)
  if (RAPIDAPI_KEY) {
    try {
      const encoded = encodeURIComponent(address)
      const url = `https://realty-mole-property-api.p.rapidapi.com/properties?address=${encoded}`
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY as string,
          'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com',
        },
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const p = data[0]
          const value = p?.price || p?.estimatedValue || p?.assessedValue || p?.lastSalePrice || null
          if (value && Number.isFinite(Number(value))) {
            return { value: Number(value), source: 'Realty Mole API', accuracy: 'high', raw: data }
          }
        }
      }
    } catch {
      // swallow and try fallbacks
    }
  }

  // 2) Optional: Attom fallback if configured
  if (process.env.ATTOM_API_KEY) {
    try {
      const url = `https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?address1=${encodeURIComponent(address)}`
      const res = await fetch(url, {
        headers: { apikey: process.env.ATTOM_API_KEY as string, Accept: 'application/json' },
      })
      if (res.ok) {
        const data = await res.json()
        const v = data?.property?.[0]?.assessment?.market?.mktttlvalue
        if (v && Number.isFinite(Number(v))) {
          return { value: Number(v), source: 'Attom', accuracy: 'medium', raw: data }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Attom home valuation:', error)
    }
  }

  // 3) Statistical estimate as last resort (always returns a value)
  const estimate = getStatisticalEstimate(address)
  return { value: estimate, source: 'Statistical Estimate', accuracy: 'low' }
}
