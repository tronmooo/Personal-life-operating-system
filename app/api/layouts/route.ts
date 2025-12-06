import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

/**
 * GET /api/layouts
 * Get all layouts for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: layouts, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, layouts })
  } catch (error: any) {
    console.error('Error fetching layouts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch layouts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/layouts
 * Create a new layout
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { layout_name, description, layout_config, is_active } = body

    const { data: layout, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        user_id: session.user.id,
        layout_name,
        description,
        layout_config,
        is_active: is_active || false,
        is_default: false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, layout })
  } catch (error: any) {
    console.error('Error creating layout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create layout' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/layouts
 * Update an existing layout
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { id, layout_name, description, layout_config, is_active } = body

    const { data: layout, error } = await supabase
      .from('dashboard_layouts')
      .update({
        layout_name,
        description,
        layout_config,
        is_active,
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, layout })
  } catch (error: any) {
    console.error('Error updating layout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update layout' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/layouts
 * Delete a layout
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Layout ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('dashboard_layouts')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting layout:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete layout' },
      { status: 500 }
    )
  }
}






























