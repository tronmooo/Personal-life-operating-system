import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// This endpoint runs the service_providers migration
// It's designed to be run once and then removed
export async function POST(request: Request) {
  try {
    // Verify authorization (simple check - in production use proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })

    // Check if tables already exist
    const { error: checkError } = await supabase
      .from('service_providers')
      .select('id')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tables already exist',
        tablesExist: true 
      })
    }

    // Tables don't exist - return SQL to run manually
    return NextResponse.json({
      success: false,
      message: 'Tables do not exist. Please run the migration SQL in Supabase Dashboard.',
      sqlEditorUrl: 'https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc/sql/new',
      migrationFile: 'supabase/migrations/20251211_service_providers_schema.sql'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to run migration check',
    instructions: 'Send POST with Authorization: Bearer <service_key>'
  })
}
