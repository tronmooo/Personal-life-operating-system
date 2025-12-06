import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

/**
 * API endpoint to apply RLS policies migration
 * Access: http://localhost:3000/api/admin/apply-rls
 *
 * This fixes authentication issues when adding data to domains
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20251026_add_rls_policies.sql'
    )

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split into individual statements
    const statements = migrationSQL
      .split(/;[\s\n]+(?=(?:ALTER|CREATE|DROP|ENABLE|DISABLE))/i)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    const results: any[] = []
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    // Execute each statement individually
    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue

      try {
        // Execute raw SQL
        const { data, error } = await supabase.rpc('exec', {
          sql: statement + ';'
        })

        if (error) {
          // Check if error is about something already existing
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('duplicate')
          ) {
            skipCount++
            results.push({
              status: 'skipped',
              reason: 'Already exists',
              statement: statement.substring(0, 100) + '...'
            })
            continue
          }

          throw error
        }

        successCount++
        results.push({
          status: 'success',
          statement: statement.substring(0, 100) + '...'
        })
      } catch (err: any) {
        // Handle already exists errors
        if (
          err.message?.includes('already exists') ||
          err.message?.includes('duplicate')
        ) {
          skipCount++
          results.push({
            status: 'skipped',
            reason: 'Already exists',
            statement: statement.substring(0, 100) + '...'
          })
          continue
        }

        errorCount++
        results.push({
          status: 'error',
          error: err.message,
          statement: statement.substring(0, 100) + '...'
        })
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: errorCount === 0
        ? 'RLS policies applied successfully'
        : 'RLS policies applied with some errors',
      summary: {
        total: statements.length,
        successful: successCount,
        skipped: skipCount,
        failed: errorCount
      },
      details: results
    })

  } catch (error: any) {
    console.error('Error applying RLS migration:', error)
    return NextResponse.json(
      {
        error: 'Failed to apply RLS migration',
        details: error.message,
        help: 'Please apply the migration manually via Supabase dashboard:\n1. Go to your Supabase project\n2. Navigate to SQL Editor\n3. Run the contents of supabase/migrations/20251026_add_rls_policies.sql'
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
