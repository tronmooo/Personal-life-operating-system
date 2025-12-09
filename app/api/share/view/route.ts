import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

import { GetSharedContentRequest, GetSharedContentResponse } from '@/types/share'
import { DOMAIN_CONFIGS, Domain } from '@/types/domains'
import { createHash } from 'crypto'

/**
 * POST /api/share/view
 * Get shared content (public endpoint with access control)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const body: GetSharedContentRequest = await request.json()
    
    if (!body.token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Get shared link
    const { data: link, error: linkError } = await supabase
      .from('shared_links')
      .select('*')
      .eq('share_token', body.token)
      .single()

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Shared link not found' },
        { status: 404 }
      )
    }

    // Check if link is expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This link has expired' },
        { status: 410 }
      )
    }

    // Check view limit
    if (link.max_views && link.view_count >= link.max_views) {
      return NextResponse.json(
        { error: 'This link has reached its view limit' },
        { status: 410 }
      )
    }

    // Access control checks
    let has_access = false
    let requires_password = false
    let requires_email = false

    switch (link.access_type) {
      case 'public':
        has_access = true
        break

      case 'password':
        requires_password = true
        if (body.password) {
          const password_hash = createHash('sha256')
            .update(body.password)
            .digest('hex')
          has_access = password_hash === link.password_hash
        }
        break

      case 'email-only':
        requires_email = true
        if (body.viewer_email && link.allowed_emails) {
          has_access = link.allowed_emails.includes(body.viewer_email)
        }
        break

      default:
        has_access = false
    }

    // If access denied, return limited info
    if (!has_access) {
      const response: GetSharedContentResponse = {
        success: false,
        link: {
          ...link,
          entry_ids: [], // Don't reveal IDs
          password_hash: undefined,
          allowed_emails: undefined
        },
        entries: [],
        domain_config: DOMAIN_CONFIGS[link.domain as Domain],
        has_access: false,
        requires_password,
        requires_email
      }
      return NextResponse.json(response)
    }

    // Fetch shared entries
    const { data: entries, error: entriesError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('domain', link.domain)
      .in('id', link.entry_ids)

    if (entriesError) {
      console.error('Error fetching entries:', entriesError)
      return NextResponse.json(
        { error: 'Failed to fetch shared content' },
        { status: 500 }
      )
    }

    // Increment view count
    await supabase.rpc('increment_share_view_count', {
      link_token: body.token
    })

    // Track analytics
    const viewerInfo = {
      viewer_email: body.viewer_email,
      viewer_ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      device_info: {
        user_agent: request.headers.get('user-agent')
      }
    }

    await supabase
      .from('share_analytics')
      .insert({
        shared_link_id: link.id,
        action: 'view',
        ...viewerInfo,
        action_details: { method: 'web' }
      })

    const response: GetSharedContentResponse = {
      success: true,
      link: {
        ...link,
        password_hash: undefined,
        allowed_emails: undefined
      },
      entries: entries || [],
      domain_config: DOMAIN_CONFIGS[link.domain as Domain],
      has_access: true
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Exception in POST /api/share/view:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

