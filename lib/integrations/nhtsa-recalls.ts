// Thin wrapper for NHTSA recalls API

export async function fetchNhtsaRecalls(vin: string): Promise<any[]> {
  if (!vin) return []
  try {
    const res = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${encodeURIComponent(vin)}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data?.results) ? data.results : []
  } catch {
    return []
  }
}


