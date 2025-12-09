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

    const { data, error } = await supabase
      .from('pet_vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .eq('user_id', user.id)
      .order('administered_date', { ascending: false })

    if (error) throw error

    return NextResponse.json({ vaccinations: data })
  } catch (error) {
    console.error('Error fetching vaccinations:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 })
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
    const vaccinationData = {
      ...body,
      user_id: user.id
    }

    const { data, error } = await supabase
      .from('pet_vaccinations')
      .insert([vaccinationData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ vaccination: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating vaccination:', error)
    return NextResponse.json({ error: 'Failed to create vaccination' }, { status: 500 })
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
    const vaccinationId = searchParams.get('vaccinationId')

    if (!vaccinationId) {
      return NextResponse.json({ error: 'Vaccination ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('pet_vaccinations')
      .delete()
      .eq('id', vaccinationId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting vaccination:', error)
    return NextResponse.json({ error: 'Failed to delete vaccination' }, { status: 500 })
  }
}



















