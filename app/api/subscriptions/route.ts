import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all subscriptions with optional filters
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    const reqCookies = request.cookies.getAll()
    console.log('📋 [SUBSCRIPTIONS API] GET request started')
    console.log('📋 [SUBSCRIPTIONS API] Request cookies:', reqCookies.map(c => c.name).join(', '))
    console.log('📋 [SUBSCRIPTIONS API] Has sb-access-token:', reqCookies.some(c => c.name.includes('sb-') && c.name.includes('auth')))
    // #endregion
    
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // #region agent log
    console.log('📋 [SUBSCRIPTIONS API] Auth result:', { hasUser: !!user, userId: user?.id, authError: authError?.message || null })
    // #endregion

    if (authError || !user) {
      // #region agent log
      console.log('📋 [SUBSCRIPTIONS API] Returning 401 - auth failed, error:', authError?.message)
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    let query = supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('next_due_date', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('service_name', `%${search}%`)
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // #region agent log
    console.log('📋 [SUBSCRIPTIONS] Success - fetched', subscriptions?.length || 0, 'subscriptions')
    // #endregion

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Extract icon letter from service name
    const iconLetter = body.service_name?.charAt(0).toUpperCase() || 'S'
    
    // Determine auto_renew based on billing_type and renewal_type
    const billingType = body.billing_type || 'recurring'
    const renewalType = body.renewal_type || (billingType === 'recurring' ? 'auto' : 'expires')
    const autoRenew = billingType === 'recurring' && renewalType === 'auto' && (body.auto_renew ?? true)
    
    const subscriptionData = {
      user_id: user.id,
      service_name: body.service_name,
      category: body.category,
      cost: parseFloat(body.cost),
      currency: body.currency || 'USD',
      frequency: body.frequency,
      status: body.status || 'active',
      next_due_date: body.next_due_date,
      start_date: body.start_date || new Date().toISOString().split('T')[0],
      trial_end_date: body.trial_end_date,
      payment_method: body.payment_method,
      last_four: body.last_four,
      account_url: body.account_url,
      account_email: body.account_email,
      auto_renew: autoRenew,
      reminder_enabled: body.reminder_enabled ?? true,
      reminder_days_before: body.reminder_days_before || 3,
      icon_color: body.icon_color,
      icon_letter: iconLetter,
      notes: body.notes,
      tags: body.tags || [],
      // NEW: Billing terms fields
      billing_type: billingType,
      renewal_type: renewalType,
      contract_end_date: body.contract_end_date || null,
      price_locked: body.price_locked ?? false,
      original_term_months: body.original_term_months || null,
    }

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (error) {
      console.error('Error creating subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ subscription }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
