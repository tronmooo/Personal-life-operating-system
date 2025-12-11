import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const domain_id = searchParams.get('domain_id')
    const log_type = searchParams.get('log_type')
    const limit = searchParams.get('limit') || '100'

    let query = supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit))

    if (domain_id) {
      query = query.eq('domain_id', domain_id)
    }

    if (log_type) {
      query = query.eq('log_type', log_type)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { domain_id, log_type, data: logData, metadata } = body

    if (!log_type || !logData) {
      return NextResponse.json(
        { error: 'log_type and data are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('logs')
      .insert({
        user_id: user.id,
        domain_id: domain_id || null,
        log_type,
        data: logData,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

