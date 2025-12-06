/*
  Zillow/Real Estate valuation integration.
  Attempts RapidAPI Zillow first, then optional fallbacks.
*/

type FetchPropertyValueParams = {
  address: string
}

export type PropertyValuation = {
  value: number | null
  source: string
  accuracy?: 'high' | 'medium' | 'low'
  raw?: any
}

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || process.env.RAPIDAPI_KEY
const ZILLOW_HOST = 'zillow-com1.p.rapidapi.com'

export async function fetchPropertyValue({ address }: FetchPropertyValueParams): Promise<PropertyValuation> {
  if (!address || !address.trim()) {
    return { value: null, source: 'invalid_address' }
  }

  // 1) RapidAPI Zillow: propertyExtendedSearch → optional details by zpid
  if (RAPIDAPI_KEY) {
    try {
      const encoded = encodeURIComponent(address)
      const url = `https://${ZILLOW_HOST}/propertyExtendedSearch?location=${encoded}&status_type=ForSale&home_type=Houses`
      const res = await fetch(url, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY as string,
          'X-RapidAPI-Host': ZILLOW_HOST,
        },
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        let value: number | null = null
        if (Array.isArray(data?.props) && data.props.length > 0) {
          const p = data.props[0]
          value = p?.price || p?.zestimate || p?.unformattedPrice || p?.hdpData?.homeInfo?.price || p?.hdpData?.homeInfo?.zestimate || null
        } else if (data?.zpid) {
          const detailsUrl = `https://${ZILLOW_HOST}/property?zpid=${data.zpid}`
          const d = await fetch(detailsUrl, {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY as string,
              'X-RapidAPI-Host': ZILLOW_HOST,
            },
            cache: 'no-store',
          })
          if (d.ok) {
            const details = await d.json()
            value = details?.price || details?.zestimate || details?.hdpData?.homeInfo?.zestimate || null
          }
        }
        if (value && Number.isFinite(Number(value))) {
          return { value: Number(value), source: 'RapidAPI:Zillow', accuracy: 'high', raw: data }
        }
      }
    } catch (e) {
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
      // Continue to return unavailable
    }
  }

  // 3) As a last resort, return null
  return { value: null, source: 'unavailable' }
}


