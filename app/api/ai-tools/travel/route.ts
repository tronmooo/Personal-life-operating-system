import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // First try travel_plans table, fall back to domain_entries
    let { data, error } = await supabaseAdmin
      .from('travel_plans')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    // If travel_plans doesn't work, use domain_entries
    if (error) {
      console.log('Falling back to domain_entries for travel plans')
      const { data: domainData, error: domainError } = await supabaseAdmin
        .from('domain_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('domain', 'travel_plans')
        .order('created_at', { ascending: false })

      if (domainError) {
        console.error('❌ Error fetching travel plans:', domainError)
        return NextResponse.json({ error: domainError.message }, { status: 500 })
      }

      // Transform to expected format
      data = (domainData || []).map((entry: any) => ({
        id: entry.id,
        trip_name: entry.title,
        destination: entry.metadata?.destination || '',
        start_date: entry.metadata?.start_date || entry.created_at?.split('T')[0],
        end_date: entry.metadata?.end_date,
        budget: entry.metadata?.budget || 0,
        itinerary: entry.metadata?.itinerary || [],
        notes: entry.description,
        created_at: entry.created_at
      }))
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Exception in GET /api/ai-tools/travel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const body = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Try inserting into travel_plans first
    let { data, error } = await supabaseAdmin
      .from('travel_plans')
      .insert({
        user_id: userId,
        ...body
      })
      .select()
      .single()

    // If travel_plans fails, use domain_entries
    if (error) {
      console.log('Falling back to domain_entries for travel plan creation')
      const { data: domainData, error: domainError } = await supabaseAdmin
        .from('domain_entries')
        .insert({
          user_id: userId,
          domain: 'travel_plans',
          title: body.trip_name,
          description: body.notes || '',
          metadata: {
            destination: body.destination,
            start_date: body.start_date,
            end_date: body.end_date,
            budget: body.budget,
            itinerary: body.itinerary
          }
        })
        .select()
        .single()

      if (domainError) {
        console.error('❌ Error creating travel plan:', domainError)
        return NextResponse.json({ error: domainError.message }, { status: 500 })
      }

      // Transform to expected format
      data = {
        id: domainData.id,
        trip_name: domainData.title,
        destination: domainData.metadata?.destination,
        start_date: domainData.metadata?.start_date,
        end_date: domainData.metadata?.end_date,
        budget: domainData.metadata?.budget,
        itinerary: domainData.metadata?.itinerary,
        notes: domainData.description,
        created_at: domainData.created_at
      }
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('❌ Exception in POST /api/ai-tools/travel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Travel plan ID required' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Try deleting from travel_plans first
    let { error } = await supabaseAdmin
      .from('travel_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    // If travel_plans fails, try domain_entries
    if (error) {
      const { error: domainError } = await supabaseAdmin
        .from('domain_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .eq('domain', 'travel_plans')

      if (domainError) {
        console.error('❌ Error deleting travel plan:', domainError)
        return NextResponse.json({ error: domainError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Exception in DELETE /api/ai-tools/travel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
