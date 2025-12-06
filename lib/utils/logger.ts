/**
 * Centralized Logger Utility
 * 
 * Replaces console.log/error/warn with a production-safe logging system.
 * 
 * Benefits:
 * - Environment-aware (different behavior in dev vs production)
 * - Structured logging (consistent format)
 * - Easy integration with monitoring services (Sentry, LogRocket, etc.)
 * - Performance tracking
 * - Context preservation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

interface LogContext {
  userId?: string
  component?: string
  action?: string
  domain?: string
  timestamp?: string
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error
  timestamp: string
}

class Logger {
  private isDevelopment: boolean
  private isClient: boolean

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development'
    this.isClient = typeof window !== 'undefined'
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    const parts = [
      `[${entry.level.toUpperCase()}]`,
      entry.timestamp,
      entry.message
    ]

    if (entry.context) {
      parts.push(JSON.stringify(entry.context, null, 2))
    }

    return parts.join(' ')
  }

  /**
   * Get emoji for log level
   */
  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      critical: '🚨'
    }
    return emojis[level] || 'ℹ️'
  }

  /**
   * Send log to monitoring service (if configured)
   */
  private async sendToMonitoring(entry: LogEntry): Promise<void> {
    // Skip in development or if no service configured
    if (this.isDevelopment) return

    try {
      // TODO: Integrate with your monitoring service
      // Examples:
      
      // Sentry
      // if (window.Sentry && entry.level === 'error') {
      //   window.Sentry.captureException(entry.error || new Error(entry.message), {
      //     level: entry.level,
      //     extra: entry.context
      //   })
      // }

      // LogRocket
      // if (window.LogRocket) {
      //   window.LogRocket.log(entry.level, entry.message, entry.context)
      // }

      // Custom endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (err) {
      // Fail silently - don't break app if logging fails
      console.error('Failed to send log to monitoring:', err)
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      error,
      timestamp: new Date().toISOString()
    }

    // Always log errors, even in production
    const shouldLog = this.isDevelopment || level === 'error' || level === 'critical'

    if (shouldLog) {
      const emoji = this.getEmoji(level)
      const prefix = `${emoji} [${level.toUpperCase()}]`

      // Use appropriate console method
      switch (level) {
        case 'error':
        case 'critical':
          console.error(prefix, message, context || '', error || '')
          break
        case 'warn':
          console.warn(prefix, message, context || '')
          break
        case 'debug':
          if (this.isDevelopment) {
            console.debug(prefix, message, context || '')
          }
          break
        default:
          console.log(prefix, message, context || '')
      }
    }

    // Send to monitoring service (async, non-blocking)
    if (level === 'error' || level === 'critical') {
      this.sendToMonitoring(entry).catch(() => {
        // Ignore monitoring failures
      })
    }
  }

  /**
   * Debug - Verbose information for development
   * Only shown in development mode
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Info - General informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Warn - Warning messages for potential issues
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Error - Error messages that should be investigated
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error)
  }

  /**
   * Critical - Critical errors that require immediate attention
   */
  critical(message: string, error?: Error, context?: LogContext): void {
    this.log('critical', message, context, error)
  }

  /**
   * Performance - Log performance metrics
   */
  performance(label: string, duration: number, context?: LogContext): void {
    const message = `${label} took ${duration}ms`
    const perfContext = { ...context, duration, type: 'performance' }
    
    if (duration > 1000) {
      this.warn(message, perfContext)
    } else if (this.isDevelopment) {
      this.debug(message, perfContext)
    }
  }

  /**
   * API - Log API calls
   */
  api(method: string, endpoint: string, status: number, duration?: number, context?: LogContext): void {
    const message = `${method} ${endpoint} - ${status}`
    const apiContext = {
      ...context,
      method,
      endpoint,
      status,
      duration,
      type: 'api'
    }

    if (status >= 500) {
      this.error(message, undefined, apiContext)
    } else if (status >= 400) {
      this.warn(message, apiContext)
    } else if (this.isDevelopment) {
      this.debug(message, apiContext)
    }
  }

  /**
   * User action - Log user interactions
   */
  userAction(action: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.debug(`User action: ${action}`, { ...context, type: 'user_action' })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const log = {
  debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error, ctx?: LogContext) => logger.error(msg, err, ctx),
  critical: (msg: string, err?: Error, ctx?: LogContext) => logger.critical(msg, err, ctx),
  performance: (label: string, duration: number, ctx?: LogContext) => logger.performance(label, duration, ctx),
  api: (method: string, endpoint: string, status: number, duration?: number, ctx?: LogContext) => 
    logger.api(method, endpoint, status, duration, ctx),
  userAction: (action: string, ctx?: LogContext) => logger.userAction(action, ctx)
}

// Export default instance
export default logger

/**
 * Usage Examples:
 * 
 * // Simple logging
 * logger.info('User logged in')
 * logger.debug('Component mounted', { component: 'Dashboard' })
 * logger.warn('Rate limit approaching', { remaining: 5 })
 * logger.error('Failed to save data', error, { domain: 'health', action: 'save' })
 * 
 * // Performance tracking
 * const start = Date.now()
 * await fetchData()
 * logger.performance('fetchData', Date.now() - start, { domain: 'financial' })
 * 
 * // API calls
 * logger.api('POST', '/api/domain-entries', 201, 150, { domain: 'vehicles' })
 * 
 * // User actions
 * logger.userAction('create_entry', { domain: 'health', type: 'vitals' })
 * 
 * // With convenience functions
 * import { log } from '@/lib/utils/logger'
 * log.info('Application started')
 * log.error('Database connection failed', error)
 */



