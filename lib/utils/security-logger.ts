/**
 * Security Event Logger
 * Logs security-relevant events for monitoring and audit purposes
 */

interface SecurityEvent {
  type: 'auth' | 'authorization' | 'data_access' | 'rate_limit' | 'validation' | 'suspicious'
  action: string
  userId?: string
  ip?: string
  userAgent?: string
  success: boolean
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AuditLog {
  timestamp: string
  requestId: string
  event: SecurityEvent
}

/**
 * Log a security event
 */
export function logSecurityEvent(event: SecurityEvent, requestId?: string): void {
  const timestamp = new Date().toISOString()
  const logEntry: AuditLog = {
    timestamp,
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    event
  }
  
  // Different log levels based on severity
  switch (event.severity) {
    case 'critical':
      console.error('[SECURITY:CRITICAL]', JSON.stringify(logEntry))
      break
    case 'high':
      console.error('[SECURITY:HIGH]', JSON.stringify(logEntry))
      break
    case 'medium':
      console.warn('[SECURITY:MEDIUM]', JSON.stringify(logEntry))
      break
    case 'low':
    default:
      console.info('[SECURITY:LOW]', JSON.stringify(logEntry))
      break
  }
  
  // In production, you would also:
  // 1. Send to a monitoring service (e.g., Sentry, DataDog, CloudWatch)
  // 2. Store in a security audit table
  // 3. Trigger alerts for critical events
  
  // Example: Send to monitoring service
  if (typeof window === 'undefined' && event.severity === 'critical') {
    // Server-side only
    sendToMonitoringService(logEntry)
  }
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  action: 'login' | 'logout' | 'login_failed' | 'signup' | 'password_reset',
  success: boolean,
  userId?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    type: 'auth',
    action,
    userId,
    success,
    details,
    severity: success ? 'low' : (action === 'login_failed' ? 'medium' : 'low')
  })
}

/**
 * Log authorization failures (access denied)
 */
export function logAuthorizationFailure(
  resource: string,
  userId?: string,
  details?: Record<string, any>
): void {
  logSecurityEvent({
    type: 'authorization',
    action: 'access_denied',
    userId,
    success: false,
    details: { resource, ...details },
    severity: 'medium'
  })
}

/**
 * Log data access events (for sensitive data)
 */
export function logDataAccess(
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete',
  userId?: string,
  recordCount?: number
): void {
  logSecurityEvent({
    type: 'data_access',
    action: `${action}_${resource}`,
    userId,
    success: true,
    details: { resource, recordCount },
    severity: action === 'delete' ? 'medium' : 'low'
  })
}

/**
 * Log rate limit violations
 */
export function logRateLimitViolation(
  endpoint: string,
  userId?: string,
  ip?: string
): void {
  logSecurityEvent({
    type: 'rate_limit',
    action: 'rate_limit_exceeded',
    userId,
    ip,
    success: false,
    details: { endpoint },
    severity: 'medium'
  })
}

/**
 * Log validation failures
 */
export function logValidationFailure(
  input: string,
  reason: string,
  userId?: string
): void {
  logSecurityEvent({
    type: 'validation',
    action: 'validation_failed',
    userId,
    success: false,
    details: { input, reason },
    severity: 'low'
  })
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  activity: string,
  details: Record<string, any>,
  userId?: string,
  severity: SecurityEvent['severity'] = 'high'
): void {
  logSecurityEvent({
    type: 'suspicious',
    action: activity,
    userId,
    success: false,
    details,
    severity
  })
}

/**
 * Detect and log suspicious patterns
 */
export function detectSuspiciousPatterns(
  userId: string,
  action: string,
  details: Record<string, any>
): void {
  // Example patterns to detect:
  
  // 1. SQL Injection attempts
  const sqlPatterns = [
    /union.*select/i,
    /';.*drop/i,
    /';.*delete/i,
    /';.*update/i,
    /or.*1.*=.*1/i
  ]
  
  const input = JSON.stringify(details)
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      logSuspiciousActivity(
        'sql_injection_attempt',
        { action, input: input.substring(0, 200) },
        userId,
        'critical'
      )
      return
    }
  }
  
  // 2. XSS attempts
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i
  ]
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      logSuspiciousActivity(
        'xss_attempt',
        { action, input: input.substring(0, 200) },
        userId,
        'high'
      )
      return
    }
  }
  
  // 3. Path traversal attempts
  if (input.includes('../') || input.includes('..\\')) {
    logSuspiciousActivity(
      'path_traversal_attempt',
      { action, input: input.substring(0, 200) },
      userId,
      'high'
    )
  }
}

/**
 * Send to monitoring service (placeholder)
 */
function sendToMonitoringService(log: AuditLog): void {
  // In production, implement actual sending to:
  // - Sentry
  // - DataDog
  // - CloudWatch
  // - Custom monitoring solution
  
  // Example with Sentry:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureMessage(`Security Event: ${log.event.action}`, {
  //   level: log.event.severity === 'critical' ? 'error' : 'warning',
  //   extra: log
  // })
  
  console.log('[MONITORING] Would send to monitoring service:', log)
}

/**
 * Get security metrics (for dashboard)
 */
export interface SecurityMetrics {
  failedLogins: number
  rateLimitViolations: number
  authorizationFailures: number
  suspiciousActivities: number
}

// In-memory storage for demo (use database in production)
const metrics: SecurityMetrics = {
  failedLogins: 0,
  rateLimitViolations: 0,
  authorizationFailures: 0,
  suspiciousActivities: 0
}

export function incrementMetric(metric: keyof SecurityMetrics): void {
  metrics[metric]++
}

export function getSecurityMetrics(): SecurityMetrics {
  return { ...metrics }
}

export function resetSecurityMetrics(): void {
  metrics.failedLogins = 0
  metrics.rateLimitViolations = 0
  metrics.authorizationFailures = 0
  metrics.suspiciousActivities = 0
}



