import { createServerClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'

/**
 * Database Test Endpoint
 * Tests connection and table access
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const results: any = {
      auth: !!session,
      user_id: session?.user?.id || null,
      email: session?.user?.email || null,
      tables: {}
    }

    if (authError || !user) {
      return NextResponse.json({
        ...results,
        message: 'Not authenticated. Please sign in first.'
      })
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
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: false })
          .limit(1)

        results.tables[table] = {
          accessible: !error,
          count: count || 0,
          error: error?.message || null
        }
      } catch (err: any) {
        results.tables[table] = {
          accessible: false,
          error: err.message
        }
      }
    }

    return NextResponse.json({
      ...results,
      message: '✅ Database test complete',
      summary: {
        total_tables: tables.length,
        accessible: Object.values(results.tables).filter((t: any) => t.accessible).length,
        with_data: Object.values(results.tables).filter((t: any) => t.count > 0).length
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Database test failed',
      details: error.message
    }, { status: 500 })
  }
}



















