import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchPropertyValue } from '@/lib/integrations/zillow-api'
import { fetchVehicleValuation, fetchNhtsaRecalls } from '@/lib/integrations/vehicle-valuation'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token'
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const mode = (request.nextUrl.searchParams.get('mode') || 'monthly') as 'monthly' | 'weekly'
    const stats = { properties: 0, vehicles: 0, recalls: 0 }

    // Load users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError

    for (const user of users.users) {
      const userId = user.id

      // Properties: update value and append history (monthly)
      if (mode === 'monthly') {
        const { data: props } = await supabase
          .from('properties')
          .select('id, address, city, state, zip_code, estimated_value')
          .eq('user_id', userId)

        for (const p of props || []) {
          const address = [p.address, p.city, p.state, p.zip_code].filter(Boolean).join(', ')
          const result = await fetchPropertyValue({ address })
          const value = result.value ?? Number(p.estimated_value || 0)

          if (Number.isFinite(value) && value > 0) {
            await supabase.from('properties').update({ estimated_value: value }).eq('id', p.id)
            await supabase.from('property_value_history').insert({
              user_id: userId,
              property_id: p.id,
              value,
              source: result.source,
              accuracy: result.accuracy,
              date: new Date().toISOString().slice(0, 10),
            })
            stats.properties++
          }
        }
      }

      // Vehicles: update value and append history (monthly), recalls weekly
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, vin, year, make, model, mileage, estimated_value, user_id')
        .eq('user_id', userId)

      for (const v of vehicles || []) {
        if (mode === 'monthly') {
          const valuation = await fetchVehicleValuation({
            vin: v.vin || undefined,
            year: v.year,
            make: v.make,
            model: v.model,
            mileage: v.mileage || undefined,
          })
          const value = valuation.value ?? Number(v.estimated_value || 0)
          if (Number.isFinite(value) && value > 0) {
            await supabase.from('vehicles').update({ estimated_value: value }).eq('id', v.id)
            await supabase.from('vehicle_value_history').insert({
              user_id: userId,
              vehicle_id: v.id,
              value,
              source: valuation.source,
              mileage: v.mileage || null,
              date: new Date().toISOString().slice(0, 10),
            })
            stats.vehicles++
          }
        }

        if (mode === 'weekly' && v.vin) {
          const recalls = await fetchNhtsaRecalls(v.vin)
          for (const r of recalls) {
            const recallId = r?.NHTSACampaignNumber || r?.RecallNumber || `${r?.ReportReceivedDate}-${r?.Component}`
            if (!recallId) continue
            await supabase
              .from('vehicle_recalls')
              .upsert({
                user_id: userId,
                vehicle_id: v.id,
                recall_id: recallId,
                description: r?.Summary || r?.Conequence || r?.Notes || '',
                severity: r?.Remedy || null,
                date_issued: r?.ReportReceivedDate ? new Date(r.ReportReceivedDate).toISOString().slice(0, 10) : null,
              }, { onConflict: 'vehicle_id,recall_id' })
            stats.recalls++
          }
        }
      }
    }

    return NextResponse.json({ success: true, mode, stats })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 })
  }
}


