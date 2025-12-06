import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { validateEntry, checkRateLimit, checkDuplicateEntry, sanitizeObject } from '@/lib/middleware/validation-middleware'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('domain_entries_view')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const { domain, id, title, description, metadata } = payload

    // ============================================================================
    // VALIDATION & SECURITY CHECKS
    // ============================================================================

    // 1. Basic validation
    if (!domain || !title) {
      return NextResponse.json({ error: 'domain and title are required' }, { status: 400 })
    }

    // 2. Comprehensive validation using schema
    const validation = await validateEntry({
      title,
      description,
      domain,
      metadata: metadata || {},
      user_id: session.user.id,
    })

    if (!validation.valid) {
      console.warn('❌ Validation failed:', validation.errors)
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
        },
        { status: 400 }
      )
    }

    // 3. Rate limiting check
    const rateLimit = checkRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded for user:', session.user.id)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        },
        { status: 429 }
      )
    }

    // 4. Duplicate detection
    const duplicateCheck = checkDuplicateEntry(session.user.id, title, domain)
    if (duplicateCheck.isDuplicate) {
      console.warn('⚠️ Duplicate entry detected:', { title, domain })
      return NextResponse.json(
        {
          error: 'Duplicate entry detected',
          message: duplicateCheck.reason,
        },
        { status: 409 }
      )
    }

    // 5. Sanitize data
    const sanitizedMetadata = metadata ? sanitizeObject(metadata) : {}

    // 6. Get active person ID from user settings
    const { getUserSettings } = await import('@/lib/supabase/user-settings')
    const settings = await getUserSettings()
    const activePersonId = settings?.activePersonId || 
                          settings?.people?.find((p: any) => p.isActive)?.id || 
                          'me'

    // ============================================================================
    // DATABASE INSERTION
    // ============================================================================

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const insertPayload: Record<string, any> = {
      user_id: session.user.id,
      domain,
      title: validation.entry!.title, // Use validated & sanitized title
      description: validation.entry!.description || null,
      metadata: sanitizedMetadata,
      person_id: activePersonId, // 🔧 NEW: Include person_id to isolate data per person
    }

    if (id) {
      insertPayload.id = id
    }

    const { data, error } = await supabaseAdmin
      .from('domain_entries')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      console.error('❌ Database insertion error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Entry created successfully:', { domain, title })
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('❌ POST /api/domain-entries error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
