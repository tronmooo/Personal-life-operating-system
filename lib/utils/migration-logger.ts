/**
 * Migration Logger
 * 
 * Centralized logging for localStorage → Supabase/IndexedDB migrations
 * Helps track migration success/failures in production
 */

interface MigrationLog {
  type: 'routines' | 'ai-tools' | 'other'
  action: 'start' | 'success' | 'error' | 'skip'
  itemCount?: number
  error?: string
  timestamp: string
  userId?: string
}

class MigrationLogger {
  private logs: MigrationLog[] = []
  private readonly MAX_LOGS = 100

  /**
   * Log a migration event
   */
  log(log: Omit<MigrationLog, 'timestamp'>) {
    const entry: MigrationLog = {
      ...log,
      timestamp: new Date().toISOString(),
    }

    this.logs.push(entry)

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS)
    }

    // Console log for debugging
    const emoji = this.getEmoji(log.action)
    const prefix = `[Migration:${log.type}]`
    
    if (log.action === 'error') {
      console.error(`${emoji} ${prefix}`, log.error)
    } else {
      console.log(`${emoji} ${prefix} ${log.action}`, log.itemCount ? `(${log.itemCount} items)` : '')
    }
  }

  /**
   * Log migration start
   */
  start(type: MigrationLog['type'], itemCount?: number, userId?: string) {
    this.log({ type, action: 'start', itemCount, userId })
  }

  /**
   * Log migration success
   */
  success(type: MigrationLog['type'], itemCount?: number, userId?: string) {
    this.log({ type, action: 'success', itemCount, userId })
  }

  /**
   * Log migration error
   */
  error(type: MigrationLog['type'], error: string, userId?: string) {
    this.log({ type, action: 'error', error, userId })
  }

  /**
   * Log migration skip (no data to migrate)
   */
  skip(type: MigrationLog['type'], userId?: string) {
    this.log({ type, action: 'skip', userId })
  }

  /**
   * Get all logs
   */
  getLogs(): MigrationLog[] {
    return [...this.logs]
  }

  /**
   * Get logs for a specific type
   */
  getLogsByType(type: MigrationLog['type']): MigrationLog[] {
    return this.logs.filter(log => log.type === type)
  }

  /**
   * Get failed migrations
   */
  getFailedMigrations(): MigrationLog[] {
    return this.logs.filter(log => log.action === 'error')
  }

  /**
   * Get migration statistics
   */
  getStats() {
    const total = this.logs.length
    const byType = {
      routines: this.logs.filter(l => l.type === 'routines').length,
      'ai-tools': this.logs.filter(l => l.type === 'ai-tools').length,
      other: this.logs.filter(l => l.type === 'other').length,
    }
    const byAction = {
      start: this.logs.filter(l => l.action === 'start').length,
      success: this.logs.filter(l => l.action === 'success').length,
      error: this.logs.filter(l => l.action === 'error').length,
      skip: this.logs.filter(l => l.action === 'skip').length,
    }
    const successRate = total > 0
      ? ((byAction.success / (byAction.success + byAction.error)) * 100).toFixed(1)
      : '0'

    return {
      total,
      byType,
      byAction,
      successRate: `${successRate}%`,
    }
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logs = []
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify({
      logs: this.logs,
      stats: this.getStats(),
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  private getEmoji(action: MigrationLog['action']): string {
    switch (action) {
      case 'start': return '🔄'
      case 'success': return '✅'
      case 'error': return '❌'
      case 'skip': return '⏭️'
      default: return '📝'
    }
  }
}

// Singleton instance
export const migrationLogger = new MigrationLogger()

/**
 * React hook to get migration logs
 */
export function useMigrationLogs() {
  return {
    logs: migrationLogger.getLogs(),
    stats: migrationLogger.getStats(),
    failed: migrationLogger.getFailedMigrations(),
  }
}























