/**
 * Centralized error handling for Personal AI Assistant
 */

export class PersonalAssistantError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'PersonalAssistantError'
  }
}

export class ValidationError extends PersonalAssistantError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details)
    this.name = 'ValidationError'
  }
}

export class AIProcessingError extends PersonalAssistantError {
  constructor(message: string, details?: any) {
    super('AI_PROCESSING_ERROR', message, 500, details)
    this.name = 'AIProcessingError'
  }
}

export class CallServiceError extends PersonalAssistantError {
  constructor(message: string, details?: any) {
    super('CALL_SERVICE_ERROR', message, 500, details)
    this.name = 'CallServiceError'
  }
}

export class AuthorizationError extends PersonalAssistantError {
  constructor(message: string = 'Unauthorized') {
    super('AUTHORIZATION_ERROR', message, 401)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends PersonalAssistantError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends PersonalAssistantError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT_EXCEEDED', 'Too many requests', 429, { retryAfter })
    this.name = 'RateLimitError'
  }
}

/**
 * Retry logic for transient errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    delayMs?: number
    backoffMultiplier?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    shouldRetry = (error) => {
      // Retry on network errors, 5xx errors, rate limits
      return (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.statusCode >= 500 ||
        error.statusCode === 429
      )
    }
  } = options

  let lastError: any
  let currentDelay = delayMs

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, currentDelay))
      currentDelay *= backoffMultiplier
    }
  }

  throw lastError
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now()
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failureCount = 0
    this.state = 'closed'
  }

  private onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.threshold) {
      this.state = 'open'
    }
  }

  getState() {
    return this.state
  }
}

/**
 * Format error for user display
 */
export function formatErrorForUser(error: any): string {
  if (error instanceof ValidationError) {
    return error.message
  }

  if (error instanceof AIProcessingError) {
    return 'AI processing failed. Please try again or rephrase your request.'
  }

  if (error instanceof CallServiceError) {
    return 'Call service is temporarily unavailable. Please try again later.'
  }

  if (error instanceof AuthorizationError) {
    return 'You do not have permission to perform this action.'
  }

  if (error instanceof NotFoundError) {
    return error.message
  }

  if (error instanceof RateLimitError) {
    const retryAfter = error.details?.retryAfter
    return `Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`
  }

  // Generic error
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log error with context
 */
export function logError(error: any, context: Record<string, any> = {}) {
  console.error('[Personal AI Assistant Error]', {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    },
    context,
    timestamp: new Date().toISOString()
  })
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // E.164 format: +[country code][number]
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== 'string') {
    throw new ValidationError('Input must be a non-empty string')
  }

  const sanitized = input.trim()

  if (sanitized.length === 0) {
    throw new ValidationError('Input cannot be empty')
  }

  if (sanitized.length > maxLength) {
    throw new ValidationError(`Input exceeds maximum length of ${maxLength} characters`)
  }

  return sanitized
}

/**
 * Validate call task status transition
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    'pending': ['preparing', 'waiting_for_user', 'ready_to_call', 'cancelled'],
    'preparing': ['waiting_for_user', 'ready_to_call', 'cancelled'],
    'waiting_for_user': ['ready_to_call', 'cancelled'],
    'ready_to_call': ['in_progress', 'cancelled'],
    'in_progress': ['completed', 'failed', 'cancelled'],
    'completed': [],
    'failed': ['ready_to_call', 'cancelled'],
    'cancelled': []
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Rate limiting tracker
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()

  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    )

    if (recentRequests.length >= this.maxRequests) {
      return false
    }

    recentRequests.push(now)
    this.requests.set(identifier, recentRequests)
    return true
  }

  reset(identifier: string) {
    this.requests.delete(identifier)
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    const recentRequests = userRequests.filter(
      time => now - time < this.windowMs
    )
    return Math.max(0, this.maxRequests - recentRequests.length)
  }
}





























