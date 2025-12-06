/**
 * Type-Safe Error Handling Utilities
 * 
 * Replaces `catch (err: any)` with proper error typing.
 * 
 * Usage:
 * ```typescript
 * // Before (BAD)
 * try {
 *   await doSomething()
 * } catch (err: any) {
 *   console.error(err.message)
 * }
 * 
 * // After (GOOD)
 * try {
 *   await doSomething()
 * } catch (err) {
 *   const error = toError(err)
 *   logger.error('Failed to do something', error)
 * }
 * ```
 */

/**
 * Standard error interface
 */
export interface AppError extends Error {
  code?: string
  status?: number
  context?: Record<string, any>
}

/**
 * Convert unknown error to Error object
 * 
 * Handles all error types safely:
 * - Error objects
 * - String messages
 * - Objects with message property
 * - Anything else
 */
export function toError(err: unknown): Error {
  // Already an Error object
  if (err instanceof Error) {
    return err
  }

  // String error
  if (typeof err === 'string') {
    return new Error(err)
  }

  // Object with message property
  if (err && typeof err === 'object' && 'message' in err) {
    const message = String((err as any).message)
    const error = new Error(message)
    
    // Preserve additional properties
    if ('code' in err) {
      (error as AppError).code = String((err as any).code)
    }
    if ('status' in err) {
      (error as AppError).status = Number((err as any).status)
    }
    
    return error
  }

  // Unknown type - convert to string
  return new Error(String(err))
}

/**
 * Extract error message safely
 */
export function getErrorMessage(err: unknown): string {
  const error = toError(err)
  return error.message || 'An unknown error occurred'
}

/**
 * Check if error is a specific type
 */
export function isErrorWithCode(err: unknown, code: string): boolean {
  const error = toError(err)
  return (error as AppError).code === code
}

/**
 * Check if error is an AbortError (from AbortController)
 */
export function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

/**
 * Check if error is a network error
 */
export function isNetworkError(err: unknown): boolean {
  const error = toError(err)
  return (
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('fetch') ||
    error.message.toLowerCase().includes('connection') ||
    (error as AppError).code === 'NETWORK_ERROR'
  )
}

/**
 * Check if error is authentication related
 */
export function isAuthError(err: unknown): boolean {
  const error = toError(err)
  const status = (error as AppError).status
  return (
    status === 401 ||
    status === 403 ||
    error.message.toLowerCase().includes('unauthorized') ||
    error.message.toLowerCase().includes('authentication') ||
    (error as AppError).code === 'AUTH_ERROR'
  )
}

/**
 * Create an app error with additional context
 */
export function createError(
  message: string,
  options?: {
    code?: string
    status?: number
    context?: Record<string, any>
    cause?: Error
  }
): AppError {
  const error = new Error(message) as AppError
  
  if (options?.code) {
    error.code = options.code
  }
  
  if (options?.status) {
    error.status = options.status
  }
  
  if (options?.context) {
    error.context = options.context
  }
  
  if (options?.cause) {
    error.cause = options.cause
  }
  
  return error
}

/**
 * Wrap async function with error handling
 * 
 * Usage:
 * ```typescript
 * const safeFunction = withErrorHandling(
 *   async () => {
 *     await riskyOperation()
 *   },
 *   'Failed to perform operation'
 * )
 * 
 * const result = await safeFunction() // Returns { data, error }
 * ```
 */
export function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage: string
): () => Promise<{ data: T | null; error: Error | null }> {
  return async () => {
    try {
      const data = await fn()
      return { data, error: null }
    } catch (err) {
      const error = toError(err)
      error.message = `${errorMessage}: ${error.message}`
      return { data: null, error }
    }
  }
}

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, onRetry } = options
  
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = toError(err)
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Don't retry auth errors
      if (isAuthError(err)) {
        break
      }
      
      // Don't retry abort errors
      if (isAbortError(err)) {
        break
      }
      
      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Standard error response for API routes
 */
export interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: any
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  err: unknown,
  defaultMessage = 'An error occurred'
): ErrorResponse {
  const error = toError(err)
  
  return {
    error: {
      message: error.message || defaultMessage,
      code: (error as AppError).code,
      details: (error as AppError).context
    }
  }
}

/**
 * Type guard for checking if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Type guard for checking if value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return isError(value) && ('code' in value || 'status' in value || 'context' in value)
}

/**
 * Example usage in catch blocks:
 * 
 * ```typescript
 * // Simple usage
 * try {
 *   await doSomething()
 * } catch (err) {
 *   const error = toError(err)
 *   logger.error('Operation failed', error)
 *   toast.error(error.message)
 * }
 * 
 * // With specific error handling
 * try {
 *   await fetchData()
 * } catch (err) {
 *   if (isAbortError(err)) {
 *     // Request was cancelled - ignore
 *     return
 *   }
 *   
 *   if (isAuthError(err)) {
 *     // Redirect to login
 *     router.push('/login')
 *     return
 *   }
 *   
 *   if (isNetworkError(err)) {
 *     toast.error('Network error. Please check your connection.')
 *     return
 *   }
 *   
 *   // Generic error
 *   const error = toError(err)
 *   logger.error('Failed to fetch data', error)
 *   toast.error(error.message)
 * }
 * 
 * // In API routes
 * export async function POST(request: Request) {
 *   try {
 *     const data = await request.json()
 *     const result = await saveData(data)
 *     return Response.json({ success: true, data: result })
 *   } catch (err) {
 *     const error = toError(err)
 *     logger.error('API error', error, { endpoint: '/api/save' })
 *     return Response.json(
 *       createErrorResponse(error),
 *       { status: (error as AppError).status || 500 }
 *     )
 *   }
 * }
 * ```
 */



