import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// GET - List user's passkey credentials
export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: credentials, error } = await supabase
      .from('webauthn_credentials')
      .select('id, device_name, device_type, created_at, last_used_at, backed_up')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ credentials: credentials || [] })
  } catch (error: any) {
    console.error('List credentials error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list credentials' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a passkey credential
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const credentialId = searchParams.get('id')

    if (!credentialId) {
      return NextResponse.json({ error: 'Missing credential ID' }, { status: 400 })
    }

    const { error } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('user_id', user.id) // Ensure user can only delete their own

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete credential error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete credential' },
      { status: 500 }
    )
  }
}

// PATCH - Update credential name
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore
            }
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { id, device_name } = body

    if (!id || !device_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('webauthn_credentials')
      .update({ device_name })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update credential error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update credential' },
      { status: 500 }
    )
  }
}

