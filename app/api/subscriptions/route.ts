import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Fetch all subscriptions with optional filters
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/route.ts:GET:start',message:'GET request started',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/route.ts:GET:auth',message:'Auth check result',data:{hasUser:!!user,userId:user?.id,authError:authError?.message||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
    // #endregion

    if (authError || !user) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'subscriptions/route.ts:GET:401',message:'Returning 401 Unauthorized',data:{authError:authError?.message,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H3'})}).catch(()=>{});
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
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Extract icon letter from service name
    const iconLetter = body.service_name?.charAt(0).toUpperCase() || 'S'
    
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
      auto_renew: body.auto_renew ?? true,
      reminder_enabled: body.reminder_enabled ?? true,
      reminder_days_before: body.reminder_days_before || 3,
      icon_color: body.icon_color,
      icon_letter: iconLetter,
      notes: body.notes,
      tags: body.tags || []
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




