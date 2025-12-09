import { createServerClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')

    if (!petId) {
      return NextResponse.json({ error: 'Pet ID required' }, { status: 400 })
    }

    // Get pet details to search by name
    const { data: pet, error: petError } = await supabase
      .from('pets')
      .select('name')
      .eq('id', petId)
      .eq('user_id', user.id)
      .single()

    if (petError || !pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    // Query 1: Get dedicated pet_costs entries
    const { data: petCosts, error: costsError } = await supabase
      .from('pet_costs')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (costsError) throw costsError

    // Query 2: Get financial domain entries that mention this pet
    const { data: financialEntries, error: financialError } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('domain', 'financial')
      .eq('user_id', user.id)
      .or(`title.ilike.%${pet.name}%,description.ilike.%${pet.name}%,metadata->>description.ilike.%${pet.name}%`)
      .order('created_at', { ascending: false })

    if (financialError) {
      console.error('Error fetching financial entries:', financialError)
    }

    // Transform financial entries to match pet_costs format
    const transformedFinancialCosts = (financialEntries || [])
      .filter(entry => {
        // Only include entries with amounts that are clearly pet-related
        const metadata = entry.metadata || {}
        return metadata.amount || metadata.cost
      })
      .map(entry => {
        const metadata = entry.metadata || {}
        const amount = parseFloat(metadata.amount || metadata.cost || '0')
        
        // Determine cost_type from category or description
        let cost_type = 'other'
        const category = (metadata.category || '').toLowerCase()
        const desc = (metadata.description || entry.description || '').toLowerCase()
        
        if (category.includes('vet') || desc.includes('vet')) {
          cost_type = 'vet'
        } else if (category.includes('food') || desc.includes('food')) {
          cost_type = 'food'
        } else if (category.includes('groom') || desc.includes('groom')) {
          cost_type = 'grooming'
        } else if (category.includes('supply') || desc.includes('supply')) {
          cost_type = 'supplies'
        }

        return {
          id: entry.id,
          pet_id: petId,
          user_id: entry.user_id,
          cost_type,
          amount,
          date: metadata.transactionDate?.split('T')[0] || entry.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          description: metadata.description || entry.description || entry.title || 'Pet expense',
          vendor: metadata.vendor || null,
          source: 'financial_domain' // Mark as coming from financial domain
        }
      })

    // Combine both sources
    const allCosts = [...(petCosts || []), ...transformedFinancialCosts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`✅ Found ${petCosts?.length || 0} pet_costs + ${transformedFinancialCosts.length} financial entries for ${pet.name}`)

    return NextResponse.json({ costs: allCosts })
  } catch (error) {
    console.error('Error fetching costs:', error)
    return NextResponse.json({ error: 'Failed to fetch costs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const costData = {
      ...body,
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('pet_costs')
      .insert([costData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ cost: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating cost:', error)
    return NextResponse.json({ error: 'Failed to create cost' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const costId = searchParams.get('costId')

    if (!costId) {
      return NextResponse.json({ error: 'Cost ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pet_costs')
      .delete()
      .eq('id', costId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting cost:', error)
    return NextResponse.json({ error: 'Failed to delete cost' }, { status: 500 })
  }
}



















