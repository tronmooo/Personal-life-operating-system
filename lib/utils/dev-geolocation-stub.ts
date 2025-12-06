// Dev-only geolocation stub to avoid permission prompts and timeouts locally
// This file has no side effects at module load. Call initDevGeolocationStub() from a client context.

export function initDevGeolocationStub(): void {
  if (typeof window === 'undefined') return
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return

  // Only stub on localhost-like hosts in development
  const isLocalhost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev || !isLocalhost) return

  const geo: Geolocation = navigator.geolocation
  const originalGet = geo.getCurrentPosition?.bind(geo)
  const originalWatch = geo.watchPosition?.bind(geo)

  const defaultPosition = {
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: null,
      accuracy: 25,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition

  const readDevPosition = async (): Promise<GeolocationPosition> => {
    try {
      const { idbGet } = await import('@/lib/utils/idb-cache')
      const parsed = await idbGet<{ latitude?: number; longitude?: number; accuracy?: number }>('dev-geo')
      if (!parsed) return defaultPosition
      return {
        coords: {
          latitude: parsed.latitude ?? defaultPosition.coords.latitude,
          longitude: parsed.longitude ?? defaultPosition.coords.longitude,
          altitude: null,
          accuracy: parsed.accuracy ?? defaultPosition.coords.accuracy,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition
    } catch {
      return defaultPosition
    }
  }

  // Only install once
  if ((window as any).__DEV_GEO_STUB_INSTALLED__) return
  ;(window as any).__DEV_GEO_STUB_INSTALLED__ = true

  const stubGet: typeof geo.getCurrentPosition = (success, _error, _opts) => {
    // Resolve on next tick to emulate async
    readDevPosition().then(pos => success(pos))
  }

  const stubWatch: typeof geo.watchPosition = (success, _error, _opts) => {
    const id = Math.floor(Math.random() * 1e9)
    // Emit an initial reading, then a periodic heartbeat
    readDevPosition().then(pos => success(pos))
    const interval = window.setInterval(() => {
      readDevPosition().then(pos => success(pos))
    }, 30000)
    ;(window as any)[`__DEV_GEO_WATCH_${id}`] = interval
    return id
  }

  const stubClear: typeof geo.clearWatch = (watchId: number) => {
    const key = `__DEV_GEO_WATCH_${watchId}`
    const interval = (window as any)[key]
    if (interval) {
      window.clearInterval(interval)
      delete (window as any)[key]
    }
  }

  try {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      get() {
        return {
          getCurrentPosition: stubGet,
          watchPosition: stubWatch,
          clearWatch: stubClear,
        } as Geolocation
      },
    })
    // Keep originals accessible if needed
    ;(navigator as any).__originalGeolocation = {
      getCurrentPosition: originalGet,
      watchPosition: originalWatch,
    }
    // eslint-disable-next-line no-console
    console.log('🧪 Dev geolocation stub active (local). Set IndexedDB "dev-geo" to customize.')
  } catch {
    // Fallback: mutate existing object methods if defineProperty blocked
    try {
      ;(navigator.geolocation as any).getCurrentPosition = stubGet
      ;(navigator.geolocation as any).watchPosition = stubWatch
      ;(navigator.geolocation as any).clearWatch = stubClear
      // eslint-disable-next-line no-console
      console.log('🧪 Dev geolocation stub active (mutated).')
    } catch {
      // ignore
    }
  }
}


