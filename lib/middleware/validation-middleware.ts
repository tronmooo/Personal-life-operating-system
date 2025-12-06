/**
 * Server-Side Validation Middleware
 * 
 * Protects API routes from invalid, malicious, or corrupted data
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateDomainEntry, validateDomainMetadataMatch, type ValidationResult } from '@/lib/validation/domain-schemas'

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 30,
  MAX_REQUESTS_PER_HOUR: 500,
  WINDOW_MINUTES: 1,
  WINDOW_HOURS: 60,
}

/**
 * Check rate limit for a user
 */
export function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = `${userId}:${Math.floor(now / (RATE_LIMITS.WINDOW_MINUTES * 60 * 1000))}`
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMITS.WINDOW_MINUTES * 60 * 1000 })
    return { allowed: true }
  }
  
  if (entry.count >= RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }
  
  entry.count++
  return { allowed: true }
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

interface DuplicateDetectionEntry {
  title: string
  domain: string
  timestamp: number
}

const recentEntriesStore = new Map<string, DuplicateDetectionEntry[]>()

const DUPLICATE_DETECTION = {
  TIME_WINDOW_MINUTES: 5,
  MAX_SIMILAR_ENTRIES: 3,
}

/**
 * Check for duplicate entries
 */
export function checkDuplicateEntry(
  userId: string,
  title: string,
  domain: string
): { isDuplicate: boolean; reason?: string } {
  const now = Date.now()
  const userEntries = recentEntriesStore.get(userId) || []
  
  // Clean old entries
  const validEntries = userEntries.filter(
    entry => now - entry.timestamp < DUPLICATE_DETECTION.TIME_WINDOW_MINUTES * 60 * 1000
  )
  
  // Check for exact duplicates
  const exactDuplicates = validEntries.filter(
    entry => entry.title === title && entry.domain === domain
  )
  
  if (exactDuplicates.length >= DUPLICATE_DETECTION.MAX_SIMILAR_ENTRIES) {
    return {
      isDuplicate: true,
      reason: `Too many similar entries in the last ${DUPLICATE_DETECTION.TIME_WINDOW_MINUTES} minutes`,
    }
  }
  
  // Add this entry to the store
  validEntries.push({ title, domain, timestamp: now })
  recentEntriesStore.set(userId, validEntries)
  
  return { isDuplicate: false }
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

export interface ValidatedEntry {
  title: string
  description?: string
  domain: string
  metadata: Record<string, unknown>
  user_id: string
}

/**
 * Validate domain entry with comprehensive checks
 */
export async function validateEntry(
  data: Partial<ValidatedEntry>
): Promise<{ valid: boolean; errors: string[]; entry?: ValidatedEntry }> {
  const errors: string[] = []
  
  // 1. Basic validation
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required and cannot be empty')
  }
  
  if (!data.domain) {
    errors.push('Domain is required')
  }
  
  if (!data.user_id) {
    errors.push('User ID is required')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  // 2. Validate using schema
  const validation = validateDomainEntry({
    title: data.title!,
    description: data.description,
    domain: data.domain!,
    metadata: data.metadata || {},
    user_id: data.user_id!,
  })
  
  if (!validation.valid) {
    return { valid: false, errors: validation.errors }
  }
  
  // 3. Check domain-metadata match
  if (data.metadata && !validateDomainMetadataMatch(data.domain!, data.metadata)) {
    errors.push('Metadata does not match domain type (possible data contamination)')
  }
  
  if (errors.length > 0) {
    return { valid: false, errors }
  }
  
  return {
    valid: true,
    errors: [],
    entry: validation.sanitized,
  }
}

/**
 * Middleware wrapper for API routes
 */
export async function withValidation(
  request: NextRequest,
  handler: (req: NextRequest, validatedData: ValidatedEntry) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json()
    
    // Validate entry
    const validation = await validateEntry(body)
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }
    
    // Check rate limit
    if (validation.entry?.user_id) {
      const rateLimit = checkRateLimit(validation.entry.user_id)
      
      if (!rateLimit.allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
          },
          { status: 429 }
        )
      }
    }
    
    // Check for duplicates
    if (validation.entry) {
      const duplicateCheck = checkDuplicateEntry(
        validation.entry.user_id,
        validation.entry.title,
        validation.entry.domain
      )
      
      if (duplicateCheck.isDuplicate) {
        return NextResponse.json(
          {
            error: 'Duplicate entry detected',
            message: duplicateCheck.reason,
          },
          { status: 409 }
        )
      }
    }
    
    // Call the handler with validated data
    return await handler(request, validation.entry!)
  } catch (error: any) {
    console.error('Validation middleware error:', error)
    return NextResponse.json(
      {
        error: 'Invalid request',
        message: error.message || 'Failed to process request',
      },
      { status: 400 }
    )
  }
}

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize HTML/XSS from string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

/**
 * Deep sanitize object
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}
















