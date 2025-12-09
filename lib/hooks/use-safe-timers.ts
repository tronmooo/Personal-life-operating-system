import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook for creating safe timers that automatically clean up on unmount
 * 
 * This prevents memory leaks from setTimeout/setInterval calls that aren't cleaned up
 * when components unmount.
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { setTimeout, setInterval } = useSafeTimers()
 *   
 *   useEffect(() => {
 *     // These are automatically cleaned up!
 *     setTimeout(() => console.log('Hello'), 1000)
 *     setInterval(() => console.log('Polling'), 5000)
 *   }, [])
 * }
 * ```
 */
export function useSafeTimers() {
  const timeoutIds = useRef<Set<NodeJS.Timeout>>(new Set())
  const intervalIds = useRef<Set<NodeJS.Timeout>>(new Set())

  /**
   * Safe setTimeout that automatically cleans up on unmount
   */
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const id = globalThis.setTimeout(() => {
      callback()
      timeoutIds.current.delete(id)
    }, delay)
    
    timeoutIds.current.add(id)
    return id
  }, [])

  /**
   * Safe setInterval that automatically cleans up on unmount
   */
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const id = globalThis.setInterval(callback, delay)
    intervalIds.current.add(id)
    return id
  }, [])

  /**
   * Manually clear a timeout (optional, auto-cleared on unmount)
   */
  const clearSafeTimeout = useCallback((id: NodeJS.Timeout) => {
    globalThis.clearTimeout(id)
    timeoutIds.current.delete(id)
  }, [])

  /**
   * Manually clear an interval (optional, auto-cleared on unmount)
   */
  const clearSafeInterval = useCallback((id: NodeJS.Timeout) => {
    globalThis.clearInterval(id)
    intervalIds.current.delete(id)
  }, [])

  /**
   * Cleanup all timers on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all timeouts
      timeoutIds.current.forEach((id) => {
        globalThis.clearTimeout(id)
      })
      timeoutIds.current.clear()

      // Clear all intervals
      intervalIds.current.forEach((id) => {
        globalThis.clearInterval(id)
      })
      intervalIds.current.clear()
    }
  }, [])

  return {
    setTimeout: safeSetTimeout,
    setInterval: safeSetInterval,
    clearTimeout: clearSafeTimeout,
    clearInterval: clearSafeInterval,
  }
}

/**
 * Hook for creating a debounced function that automatically cleans up
 * 
 * @param callback Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * function SearchBox() {
 *   const [query, setQuery] = useState('')
 *   
 *   const debouncedSearch = useDebounce((q: string) => {
 *     fetchResults(q)
 *   }, 300)
 *   
 *   return <input onChange={(e) => debouncedSearch(e.target.value)} />
 * }
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )
}

/**
 * Hook for polling data at regular intervals with automatic cleanup
 * 
 * @param callback Function to call on each interval
 * @param delay Delay in milliseconds (0 or null to disable)
 * @param runImmediately Whether to run callback immediately on mount
 * 
 * @example
 * ```typescript
 * function Dashboard() {
 *   const [data, setData] = useState(null)
 *   
 *   useInterval(() => {
 *     fetchData().then(setData)
 *   }, 30000, true) // Poll every 30s, run immediately
 *   
 *   return <div>{data}</div>
 * }
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  runImmediately = false
) {
  const savedCallback = useRef(callback)

  // Remember latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Run immediately if requested
  useEffect(() => {
    if (runImmediately && delay !== null) {
      savedCallback.current()
    }
  }, [runImmediately, delay])

  // Set up interval
  useEffect(() => {
    if (delay === null || delay === 0) {
      return
    }

    const id = setInterval(() => {
      savedCallback.current()
    }, delay)

    return () => clearInterval(id)
  }, [delay])
}

/**
 * Hook for RAF (RequestAnimationFrame) based animations with automatic cleanup
 * 
 * @param callback Animation callback
 * @param active Whether animation should be running
 * 
 * @example
 * ```typescript
 * function AnimatedComponent() {
 *   const [position, setPosition] = useState(0)
 *   
 *   useAnimationFrame(() => {
 *     setPosition(p => p + 1)
 *   }, position < 100) // Animate until position reaches 100
 *   
 *   return <div style={{ transform: `translateX(${position}px)` }} />
 * }
 * ```
 */
export function useAnimationFrame(callback: (deltaTime: number) => void, active = true) {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callback(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    },
    [callback]
  )

  useEffect(() => {
    if (active) {
      requestRef.current = requestAnimationFrame(animate)
      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current)
        }
      }
    }
  }, [active, animate])
}

































