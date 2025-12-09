/**
 * Rate Limiting Middleware
 * 
 * Protects API routes from abuse by limiting requests per user/IP
 * 
 * Uses in-memory store for development, Redis for production
 * 
 * @example
 * ```typescript
 * // In API route
 * await checkRateLimit(session.user.id, 'api:general')
 * ```
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {}

// Default configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'api:general': { windowMs: 60 * 1000, max: 60 }, // 60 req/min
  'api:ai': { windowMs: 60 * 1000, max: 10 }, // 10 req/min (AI is expensive)
  'api:upload': { windowMs: 60 * 1000, max: 20 }, // 20 req/min
  'api:search': { windowMs: 60 * 1000, max: 30 }, // 30 req/min
  'auth:login': { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 min
  'auth:signup': { windowMs: 60 * 60 * 1000, max: 3 }, // 3 signups per hour
}

export class RateLimitExceededError extends Error {
  retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message)
    this.name = 'RateLimitExceededError'
    this.retryAfter = retryAfter
  }
}

/**
 * Check if request is within rate limit
 * 
 * @param identifier - User ID or IP address
 * @param limitType - Type of rate limit to apply
 * @returns Rate limit information
 * @throws RateLimitExceededError if limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'api:general'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const config = RATE_LIMITS[limitType]
  if (!config) {
    throw new Error(`Invalid rate limit type: ${limitType}`)
  }

  const key = `${limitType}:${identifier}`
  const now = Date.now()

  // Get or create rate limit entry
  let entry = store[key]

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
    store[key] = entry
  }

  // Increment count
  entry.count++

  const remaining = Math.max(0, config.max - entry.count)
  const success = entry.count <= config.max

  if (!success) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    throw new RateLimitExceededError(
      `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter
    )
  }

  return {
    success,
    limit: config.max,
    remaining,
    reset: entry.resetTime,
  }
}

/**
 * Rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  }
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  let cleaned = 0

  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
      cleaned++
    }
  }

  console.log(`Rate limit cleanup: removed ${cleaned} expired entries`)
  return cleaned
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Middleware function for Next.js API routes
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  limitType: keyof typeof RATE_LIMITS = 'api:general'
) {
  return async (req: Request): Promise<Response> => {
    try {
      // Get identifier (user ID or IP)
      const identifier = getIdentifier(req)

      // Check rate limit
      const { limit, remaining, reset } = await checkRateLimit(identifier, limitType)

      // Call original handler
      const response = await handler(req)

      // Add rate limit headers
      const headers = new Headers(response.headers)
      Object.entries(getRateLimitHeaders(limit, remaining, reset)).forEach(([key, value]) => {
        headers.set(key, value)
      })

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: error.retryAfter,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': error.retryAfter.toString(),
            },
          }
        )
      }

      throw error
    }
  }
}

/**
 * Get identifier from request (user ID or IP)
 */
function getIdentifier(req: Request): string {
  // Try to get user ID from session (implement based on your auth system)
  // const session = await getSession(req)
  // if (session?.user?.id) return session.user.id

  // Fallback to IP address
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  return ip.split(',')[0].trim()
}

/**
 * Redis-based rate limiter (for production)
 * 
 * Uncomment and use this in production with Redis
 */
/*
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function checkRateLimitRedis(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'api:general'
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const config = RATE_LIMITS[limitType]
  const key = `ratelimit:${limitType}:${identifier}`
  
  const count = await redis.incr(key)
  
  if (count === 1) {
    // First request, set expiry
    await redis.expire(key, Math.ceil(config.windowMs / 1000))
  }
  
  const ttl = await redis.ttl(key)
  const reset = Date.now() + (ttl * 1000)
  const remaining = Math.max(0, config.max - count)
  const success = count <= config.max
  
  if (!success) {
    throw new RateLimitExceededError(
      `Rate limit exceeded. Try again in ${ttl} seconds.`,
      ttl
    )
  }
  
  return {
    success,
    limit: config.max,
    remaining,
    reset,
  }
}
*/

































