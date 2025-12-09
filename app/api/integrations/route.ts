/**
 * External Integrations API
 * Manages OAuth connections and API key-based integrations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

/**
 * GET /api/integrations
 * Fetches all connected integrations for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: connections, error } = await supabase
      .from('external_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching connections:', error)
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 })
    }

    // Mask sensitive tokens in response
    const safeConnections = connections?.map(conn => ({
      ...conn,
      access_token: conn.access_token ? '********' : null,
      refresh_token: conn.refresh_token ? '********' : null,
    }))

    return NextResponse.json({ connections: safeConnections })
  } catch (error: any) {
    console.error('Integrations GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

/**
 * POST /api/integrations
 * Creates or updates an integration connection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, connection_type, access_token, refresh_token, expires_at, metadata, api_key } = body

    if (!provider || !connection_type) {
      return NextResponse.json({ error: 'Provider and connection_type are required' }, { status: 400 })
    }

    // Prepare connection data
    const connectionData: any = {
      user_id: user.id,
      provider,
      connection_type,
      status: 'active',
      metadata: metadata || {},
      last_synced: new Date().toISOString(),
    }

    // Handle OAuth tokens
    if (access_token) {
      connectionData.access_token = access_token
    }
    if (refresh_token) {
      connectionData.refresh_token = refresh_token
    }
    if (expires_at) {
      connectionData.expires_at = expires_at
    }

    // Handle API key connections (stored in metadata)
    if (api_key && connection_type === 'api_key') {
      connectionData.metadata = {
        ...connectionData.metadata,
        api_key_masked: api_key.slice(0, 4) + '...' + api_key.slice(-4),
      }
      // Store actual API key encrypted (in production, use proper encryption)
      connectionData.access_token = api_key
    }

    // Upsert connection (using the unique constraint)
    const { data: result, error: upsertError } = await supabase
      .from('external_connections')
      .upsert(connectionData, {
        onConflict: 'user_id,provider,connection_type',
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      throw upsertError
    }

    return NextResponse.json({
      success: true,
      connection: {
        ...result,
        access_token: result.access_token ? '********' : null,
        refresh_token: result.refresh_token ? '********' : null,
      }
    })
  } catch (error: any) {
    console.error('Integrations POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save connection' }, { status: 500 })
  }
}

/**
 * DELETE /api/integrations
 * Removes an integration connection
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { session }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('external_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider)

    if (error) {
      console.error('Error deleting connection:', error)
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Integrations DELETE error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

