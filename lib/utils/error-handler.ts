/**
 * Error Handler Utility
 * Provides secure error handling that doesn't leak sensitive information
 */

import { NextResponse } from 'next/server'

// Generate unique request ID for error tracking
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Log errors securely (server-side only)
export function logError(error: any, context?: Record<string, any>) {
  const timestamp = new Date().toISOString()
  const requestId = context?.requestId || generateRequestId()
  
  console.error(`[ERROR] ${timestamp} [${requestId}]`, {
    message: error.message || 'Unknown error',
    stack: error.stack,
    name: error.name,
    ...context
  })
  
  return requestId
}

// Sanitize error messages for client response
export function sanitizeErrorMessage(error: any): string {
  const message = error.message || error.toString()
  
  // List of patterns that might leak sensitive information
  const sensitivePatterns = [
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/, // JWT tokens
    /sk-[A-Za-z0-9]{48}/, // OpenAI API keys
    /AIza[A-Za-z0-9_-]{35}/, // Google API keys
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /supabase/i,
    /database/i,
    /postgres/i,
    /connection string/i,
    /ECONNREFUSED/,
    /ETIMEDOUT/,
  ]
  
  // Check if message contains sensitive information
  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return 'An error occurred while processing your request'
    }
  }
  
  // List of safe error messages that can be shown to users
  const safeErrors = [
    'Unauthorized',
    'Forbidden',
    'Not found',
    'Bad request',
    'Invalid input',
    'Validation failed',
    'Rate limit exceeded',
    'File too large',
    'Invalid file type',
    'Duplicate entry',
  ]
  
  // Check if it's a safe error message
  for (const safeError of safeErrors) {
    if (message.toLowerCase().includes(safeError.toLowerCase())) {
      return message
    }
  }
  
  // Default generic message
  return 'An error occurred while processing your request'
}

// Create a safe error response
export function createErrorResponse(
  error: any,
  status: number = 500,
  context?: Record<string, any>
): NextResponse {
  // Log the full error server-side
  const requestId = logError(error, context)
  
  // Send sanitized error to client
  const clientMessage = sanitizeErrorMessage(error)
  
  return NextResponse.json(
    {
      error: clientMessage,
      requestId, // Useful for support team to lookup the error
    },
    { status }
  )
}

// Specific error response creators
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

export function notFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 404 }
  )
}

export function badRequestResponse(message = 'Bad request', errors?: string[]): NextResponse {
  return NextResponse.json(
    { error: message, errors },
    { status: 400 }
  )
}

export function rateLimitResponse(retryAfter?: number): NextResponse {
  return NextResponse.json(
    { 
      error: 'Rate limit exceeded', 
      message: retryAfter 
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.'
    },
    { status: 429 }
  )
}

export function conflictResponse(message = 'Conflict'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 409 }
  )
}

// Type guard for checking if error is an expected type
export function isKnownError(error: any): boolean {
  return (
    error?.name === 'ValidationError' ||
    error?.name === 'UnauthorizedError' ||
    error?.name === 'ForbiddenError' ||
    error?.name === 'NotFoundError' ||
    error?.name === 'RateLimitError' ||
    error?.name === 'ConflictError'
  )
}

// Extract user-friendly message from various error types
export function getUserFriendlyErrorMessage(error: any): string {
  // Supabase errors
  if (error?.code) {
    switch (error.code) {
      case '23505': return 'A record with this information already exists'
      case '23503': return 'Referenced record not found'
      case '23502': return 'Required field is missing'
      case '42P01': return 'Database table not found'
      case 'PGRST116': return 'No rows found'
      default: return 'Database error occurred'
    }
  }
  
  // Network errors
  if (error?.name === 'NetworkError' || error?.code === 'ECONNREFUSED') {
    return 'Unable to connect to the server. Please check your internet connection.'
  }
  
  // Timeout errors
  if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
    return 'Request timed out. Please try again.'
  }
  
  // Validation errors
  if (error?.name === 'ValidationError') {
    return error.message || 'Invalid input provided'
  }
  
  // Default sanitized message
  return sanitizeErrorMessage(error)
}
