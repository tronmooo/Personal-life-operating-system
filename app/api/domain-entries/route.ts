import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { validateEntry, checkRateLimit, checkDuplicateEntry, sanitizeObject } from '@/lib/middleware/validation-middleware'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
      console.log('No authenticated user, returning demo data')
      // Return demo data for guest users
      const demoData = [
        {
          id: 'demo-financial-1',
          domain: 'financial',
          title: 'Primary Checking Account',
          description: 'Main checking account with online banking',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          metadata: {
            accountType: 'checking',
            balance: 2500.00,
            institution: 'Demo Bank'
          }
        },
        {
          id: 'demo-financial-2',
          domain: 'financial',
          title: 'Emergency Savings',
          description: 'Emergency fund for unexpected expenses',
          created_at: '2024-01-16T14:30:00Z',
          updated_at: '2024-01-16T14:30:00Z',
          metadata: {
            accountType: 'savings',
            balance: 10000.00,
            institution: 'Demo Bank'
          }
        },
        {
          id: 'demo-health-1',
          domain: 'health',
          title: 'Annual Physical',
          description: 'Regular checkup with Dr. Smith',
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-02-01T09:00:00Z',
          metadata: {
            provider: 'Dr. Smith',
            type: 'physical',
            nextDue: '2025-02-01'
          }
        },
        {
          id: 'demo-vehicles-1',
          domain: 'vehicles',
          title: 'Toyota Camry',
          description: 'Primary vehicle for daily commuting',
          created_at: '2024-01-20T16:00:00Z',
          updated_at: '2024-01-20T16:00:00Z',
          metadata: {
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            mileage: 15000
          }
        },
        {
          id: 'demo-pets-1',
          domain: 'pets',
          title: 'Max the Golden Retriever',
          description: 'Family dog, loves playing fetch',
          created_at: '2024-01-25T11:00:00Z',
          updated_at: '2024-01-25T11:00:00Z',
          metadata: {
            species: 'dog',
            breed: 'Golden Retriever',
            age: 3,
            vet: 'City Animal Hospital'
          }
        },
        {
          id: 'demo-home-1',
          domain: 'home',
          title: '123 Main Street',
          description: 'Primary residence',
          created_at: '2024-01-10T08:00:00Z',
          updated_at: '2024-01-10T08:00:00Z',
          metadata: {
            type: 'house',
            bedrooms: 3,
            bathrooms: 2,
            sqFt: 2000
          }
        },
        {
          id: 'demo-nutrition-1',
          domain: 'nutrition',
          title: 'Weekly Meal Plan',
          description: 'Balanced meals for the week',
          created_at: '2024-02-05T07:00:00Z',
          updated_at: '2024-02-05T07:00:00Z',
          metadata: {
            calories: 2200,
            protein: 150,
            carbs: 250,
            fat: 70
          }
        },
        {
          id: 'demo-fitness-1',
          domain: 'fitness',
          title: 'Morning Run',
          description: 'Daily 5K run for cardiovascular health',
          created_at: '2024-02-10T06:30:00Z',
          updated_at: '2024-02-10T06:30:00Z',
          metadata: {
            type: 'cardio',
            duration: 30,
            distance: 5.0,
            calories: 300
          }
        }
      ]

      // Filter by domain if provided
      const url = new URL(request.url)
      const domain = url.searchParams.get('domain')
      const filteredData = domain ? demoData.filter(item => item.domain === domain) : demoData

      return NextResponse.json(filteredData)
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await supabaseAdmin
      .from('domain_entries_view')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (error: any) {
    console.log('API error, falling back to demo data:', error.message)
    // Fallback to demo data if anything fails
    const demoData = [
      {
        id: 'demo-financial-1',
        domain: 'financial',
        title: 'Primary Checking Account',
        description: 'Main checking account with online banking',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        metadata: {
          accountType: 'checking',
          balance: 2500.00,
          institution: 'Demo Bank'
        }
      }
    ]
    return NextResponse.json(demoData)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) {
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
      user_id: user.id,
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
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      console.warn('⚠️ Rate limit exceeded for user:', user.id)
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
        },
        { status: 429 }
      )
    }

    // 4. Duplicate detection
    const duplicateCheck = checkDuplicateEntry(user.id, title, domain)
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
      user_id: user.id,
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
