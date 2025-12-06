import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Store user settings in the user_settings table

export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      throw error
    }

    return NextResponse.json({ settings: data?.settings || {} })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    // Load current settings
    const { data: currentRow, error: selErr } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', session.user.id)
      .single()

    if (selErr && selErr.code !== 'PGRST116') {
      throw selErr
    }

    const merged = {
      ...(currentRow?.settings || {}),
      ...body,
    }

    const { error: upsertErr } = await supabase
      .from('user_settings')
      .upsert({
        user_id: session.user.id,
        settings: merged,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (upsertErr) throw upsertErr

    return NextResponse.json({ success: true, settings: merged })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save settings' }, { status: 500 })
  }
}








