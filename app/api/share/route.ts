import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { CreateShareLinkRequest, CreateShareLinkResponse } from '@/types/share'
import { createHash, randomBytes } from 'crypto'

/**
 * POST /api/share
 * Create a new shareable link
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateShareLinkRequest = await request.json()
    
    if (!body.domain || !body.entry_ids || body.entry_ids.length === 0) {
      return NextResponse.json(
        { error: 'Domain and entry_ids are required' },
        { status: 400 }
      )
    }

    // Generate unique share token
    const share_token = randomBytes(16).toString('hex')

    // Hash password if provided
    let password_hash: string | undefined
    if (body.password && body.access_type === 'password') {
      password_hash = createHash('sha256')
        .update(body.password)
        .digest('hex')
    }

    // Create shared link record
    const { data: link, error } = await supabase
      .from('shared_links')
      .insert({
        user_id: session.user.id,
        domain: body.domain,
        entry_ids: body.entry_ids,
        title: body.title,
        description: body.description,
        share_token,
        access_type: body.access_type || 'public',
        password_hash,
        allowed_emails: body.allowed_emails,
        expires_at: body.expires_at,
        max_views: body.max_views,
        allow_download: body.allow_download !== false,
        show_metadata: body.show_metadata !== false,
        watermark: body.watermark,
        metadata: body.metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating shared link:', error)
      return NextResponse.json(
        { error: 'Failed to create shared link' },
        { status: 500 }
      )
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const share_url = `${baseUrl}/shared/${share_token}`

    const response: CreateShareLinkResponse = {
      success: true,
      link,
      share_url
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Exception in POST /api/share:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/share
 * Get user's shared links
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('shared_links')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (domain) {
      query = query.eq('domain', domain)
    }

    const { data: links, error } = await query

    if (error) {
      console.error('Error fetching shared links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shared links' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, links })
  } catch (error: any) {
    console.error('Exception in GET /api/share:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/share?id=xxx
 * Delete a shared link
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('shared_links')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      console.error('Error deleting shared link:', error)
      return NextResponse.json(
        { error: 'Failed to delete shared link' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Exception in DELETE /api/share:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

