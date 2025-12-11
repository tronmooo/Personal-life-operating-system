import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

/**
 * Server-side migration endpoint for legacy localStorage data.
 * 
 * This replaces client-side migrations to:
 * - Reduce bundle size (no migration code shipped to users)
 * - Centralize validation and security
 * - Better error handling and logging
 * - Enable proper rate limiting
 * 
 * POST /api/migrate-legacy-data
 * Body: {
 *   type: 'routines' | 'domain-logs' | 'other',
 *   domain?: string,
 *   data: any[]
 * }
 */

interface MigrationRequest {
  type: 'routines' | 'domain-logs' | 'other'
  domain?: string
  data: unknown[]
}

interface MigrationResult {
  success: boolean
  migratedCount: number
  skippedCount: number
  failedCount: number
  errors: string[]
  message: string
}

export async function POST(request: NextRequest): Promise<NextResponse<MigrationResult>> {
  try {
    const supabase = await createServerClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          migratedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errors: ['Unauthorized: You must be logged in to migrate data'],
          message: 'Authentication required'
        },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Parse and validate request
    const body: MigrationRequest = await request.json()
    
    if (!body.type || !body.data || !Array.isArray(body.data)) {
      return NextResponse.json(
        {
          success: false,
          migratedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errors: ['Invalid request: type and data array required'],
          message: 'Validation failed'
        },
        { status: 400 }
      )
    }

    // 3. Rate limiting: max 1000 items per request
    if (body.data.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          migratedCount: 0,
          skippedCount: 0,
          failedCount: 0,
          errors: [`Too many items: ${body.data.length} (max 1000)`],
          message: 'Rate limit exceeded'
        },
        { status: 429 }
      )
    }

    // 4. Route to appropriate migration handler
    let result: MigrationResult

    switch (body.type) {
      case 'routines':
        result = await migrateRoutines(supabase, userId, body.data)
        break
      case 'domain-logs':
        if (!body.domain) {
          return NextResponse.json(
            {
              success: false,
              migratedCount: 0,
              skippedCount: 0,
              failedCount: 0,
              errors: ['domain parameter required for domain-logs migration'],
              message: 'Validation failed'
            },
            { status: 400 }
          )
        }
        result = await migrateDomainLogs(supabase, userId, body.domain, body.data)
        break
      case 'other':
        result = await migrateGenericData(supabase, userId, body.domain || 'other', body.data)
        break
      default:
        return NextResponse.json(
          {
            success: false,
            migratedCount: 0,
            skippedCount: 0,
            failedCount: 0,
            errors: [`Unknown migration type: ${body.type}`],
            message: 'Invalid migration type'
          },
          { status: 400 }
        )
    }

    // 5. Log migration to telemetry table
    try {
      await supabase.from('migration_logs').insert({
        user_id: userId,
        migration_type: body.type,
        domain: body.domain,
        total_items: body.data.length,
        migrated_count: result.migratedCount,
        skipped_count: result.skippedCount,
        failed_count: result.failedCount,
        success: result.success,
        errors: result.errors,
        migrated_at: new Date().toISOString()
      })
    } catch (logError) {
      console.error('Failed to log migration:', logError)
      // Don't fail the entire migration if logging fails
    }

    return NextResponse.json(result, { status: result.success ? 200 : 207 })
  } catch (error) {
    console.error('Migration endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        migratedCount: 0,
        skippedCount: 0,
        failedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        message: 'Server error during migration'
      },
      { status: 500 }
    )
  }
}

/**
 * Migrate routines to mindfulness domain
 */
async function migrateRoutines(
  supabase: ReturnType<typeof createServerClient> extends Promise<infer T> ? T : never,
  userId: string,
  routines: unknown[]
): Promise<MigrationResult> {
  let migratedCount = 0
  let skippedCount = 0
  let failedCount = 0
  const errors: string[] = []

  // Check for existing routines to avoid duplicates
  const { data: existingRoutines } = await supabase
    .from('domain_entries')
    .select('id, metadata')
    .eq('user_id', userId)
    .eq('domain', 'mindfulness')
    .eq('metadata->>itemType', 'routine')

  const existingLegacyIds = new Set(
    existingRoutines?.map((r: { metadata?: { legacyId?: string } }) => r.metadata?.legacyId).filter(Boolean) || []
  )

  for (const routine of routines as Record<string, unknown>[]) {
    try {
      // Skip if already migrated
      if (routine.id && existingLegacyIds.has(routine.id as string)) {
        skippedCount++
        continue
      }

      // Validate required fields
      if (!routine.name) {
        errors.push(`Routine missing name: ${JSON.stringify(routine)}`)
        failedCount++
        continue
      }

      // Insert into domain_entries
      const { error } = await supabase.from('domain_entries').insert({
        user_id: userId,
        domain: 'mindfulness',
        title: routine.name as string,
        description: (routine.description as string) || '',
        metadata: {
          itemType: 'routine',
          timeOfDay: routine.timeOfDay,
          days: routine.days || [],
          estimatedDuration: routine.estimatedDuration,
          completionCount: routine.completionCount || 0,
          steps: routine.steps || [],
          enabled: routine.enabled ?? true,
          type: routine.type || 'custom',
          legacyId: routine.id,
          migratedFrom: 'localStorage-server',
          migratedAt: new Date().toISOString()
        }
      })

      if (error) {
        errors.push(`Failed to migrate routine "${routine.name}": ${error.message}`)
        failedCount++
      } else {
        migratedCount++
      }
    } catch (error) {
      errors.push(`Error migrating routine: ${error instanceof Error ? error.message : 'Unknown'}`)
      failedCount++
    }
  }

  return {
    success: failedCount === 0,
    migratedCount,
    skippedCount,
    failedCount,
    errors,
    message: `Migrated ${migratedCount} routines, skipped ${skippedCount}, failed ${failedCount}`
  }
}

/**
 * Migrate domain log entries
 */
async function migrateDomainLogs(
  supabase: ReturnType<typeof createServerClient> extends Promise<infer T> ? T : never,
  userId: string,
  domain: string,
  logs: unknown[]
): Promise<MigrationResult> {
  let migratedCount = 0
  let skippedCount = 0
  let failedCount = 0
  const errors: string[] = []

  // Check for existing logs to avoid duplicates
  const { data: existingLogs } = await supabase
    .from('domain_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('domain', domain)

  const existingIds = new Set(existingLogs?.map((l: { id: string }) => l.id) || [])

  for (const log of logs as Record<string, unknown>[]) {
    try {
      // Skip if already exists
      if (log.id && existingIds.has(log.id as string)) {
        skippedCount++
        continue
      }

      const payload = log.data && typeof log.data === 'object' ? log.data as Record<string, unknown> : {}
      const timestamp = (log.timestamp ?? payload.date ?? new Date().toISOString()) as string
      const typeName = (log.typeName ?? log.type ?? 'Log Entry') as string
      const logTypeId = log.type ?? log.logType ?? payload.logType

      // Insert into domain_entries
      const { error } = await supabase.from('domain_entries').insert({
        user_id: userId,
        domain,
        title: (log.title ?? `${typeName} - ${new Date(timestamp).toLocaleString()}`) as string,
        description: ((payload.notes ?? log.notes ?? '') as string),
        metadata: {
          source: 'domain-quick-log-legacy',
          migratedFrom: 'localStorage-server',
          logType: logTypeId,
          typeName,
          icon: log.icon ?? '📝',
          timestamp,
          data: payload,
          migratedAt: new Date().toISOString()
        }
      })

      if (error) {
        errors.push(`Failed to migrate log: ${error.message}`)
        failedCount++
      } else {
        migratedCount++
      }
    } catch (error) {
      errors.push(`Error migrating log: ${error instanceof Error ? error.message : 'Unknown'}`)
      failedCount++
    }
  }

  return {
    success: failedCount === 0,
    migratedCount,
    skippedCount,
    failedCount,
    errors,
    message: `Migrated ${migratedCount} logs, skipped ${skippedCount}, failed ${failedCount}`
  }
}

/**
 * Migrate generic data to specified domain
 */
async function migrateGenericData(
  supabase: ReturnType<typeof createServerClient> extends Promise<infer T> ? T : never,
  userId: string,
  domain: string,
  items: unknown[]
): Promise<MigrationResult> {
  let migratedCount = 0
  const skippedCount = 0
  let failedCount = 0
  const errors: string[] = []

  for (const item of items as Record<string, unknown>[]) {
    try {
      if (!item.title && !item.name) {
        errors.push(`Item missing title/name: ${JSON.stringify(item)}`)
        failedCount++
        continue
      }

      const { error } = await supabase.from('domain_entries').insert({
        user_id: userId,
        domain,
        title: ((item.title ?? item.name ?? 'Migrated Item') as string),
        description: ((item.description ?? '') as string),
        metadata: {
          ...item,
          migratedFrom: 'localStorage-server',
          migratedAt: new Date().toISOString()
        }
      })

      if (error) {
        errors.push(`Failed to migrate item: ${error.message}`)
        failedCount++
      } else {
        migratedCount++
      }
    } catch (error) {
      errors.push(`Error migrating item: ${error instanceof Error ? error.message : 'Unknown'}`)
      failedCount++
    }
  }

  return {
    success: failedCount === 0,
    migratedCount,
    skippedCount,
    failedCount,
    errors,
    message: `Migrated ${migratedCount} items, skipped ${skippedCount}, failed ${failedCount}`
  }
}
