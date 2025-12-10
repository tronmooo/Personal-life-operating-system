import { createServerClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'

/**
 * Database Test Endpoint
 * Tests connection and table access
 */

type TableTestResult = {
  accessible: boolean
  count?: number
  error?: string | null
}

type TestResults = {
  auth: boolean
  user_id: string | null
  email: string | null
  tables: Record<string, TableTestResult>
  message?: string
  summary?: {
    total_tables: number
    accessible: number
    with_data: number
  }
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const isAuthenticated = !!user && !authError
    const results: TestResults = {
      auth: isAuthenticated,
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      tables: {}
    }

    if (!isAuthenticated) {
      return NextResponse.json({
        ...results,
        message: 'Not authenticated. Please sign in first.'
      }, { status: 401 })
    }

    // Test each table
    const tables = [
      'pets',
      'pet_vaccinations',
      'pet_costs',
      'nutrition_meals',
      'nutrition_water_logs',
      'fitness_activities',
      'fitness_workouts',
      'homes',
      'home_assets',
      'home_maintenance',
      'home_projects'
    ]

    for (const table of tables) {
      try {
        const { error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(1)

        results.tables[table] = {
          accessible: !error,
          count: count || 0,
          error: error?.message || null
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        results.tables[table] = {
          accessible: false,
          error: message
        }
      }
    }

    const tableResults = Object.values(results.tables)
    const accessibleCount = tableResults.filter((t) => t.accessible).length
    const withDataCount = tableResults.filter((t) => (t.count ?? 0) > 0).length

    return NextResponse.json({
      ...results,
      message: '✅ Database test complete',
      summary: {
        total_tables: tables.length,
        accessible: accessibleCount,
        with_data: withDataCount
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({
      error: 'Database test failed',
      details: message
    }, { status: 500 })
  }
}



















