import { createServerClient } from '@/lib/supabase/server'

import { NextResponse } from 'next/server'
import { generateSeedData } from '@/lib/seed-data'

/**
 * API endpoint to seed the database with sample data
 * POST /api/seed-data
 * 
 * This will populate all domains with realistic sample data for new users
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🌱 Seeding data for user:', user.email)

    // Generate seed data
    const seedData = generateSeedData()
    
    // Insert data for each domain
    const results: Record<string, any> = {}
    
    for (const [domainName, data] of Object.entries(seedData)) {
      console.log(`📦 Seeding ${domainName} domain with ${data.length} items...`)
      
      // Check if domain already has data
      const { data: existing } = await supabase
        .from('domains')
        .select('data')
        .eq('user_id', user.id)
        .eq('domain_name', domainName)
        .single()
      
      if (existing && Array.isArray(existing.data) && existing.data.length > 0) {
        console.log(`⚠️  ${domainName} already has data, skipping...`)
        results[domainName] = {
          status: 'skipped',
          reason: 'Domain already has data',
          existingCount: existing.data.length
        }
        continue
      }
      
      // Upsert domain data
      const { error: upsertError } = await supabase
        .from('domains')
        .upsert({
          user_id: user.id,
          domain_name: domainName,
          data: data,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,domain_name' 
        })
      
      if (upsertError) {
        console.error(`❌ Error seeding ${domainName}:`, upsertError)
        results[domainName] = {
          status: 'error',
          error: upsertError.message
        }
      } else {
        console.log(`✅ ${domainName} seeded successfully`)
        results[domainName] = {
          status: 'success',
          itemsCreated: data.length
        }
      }
    }

    // Count total items created
    const totalCreated = Object.values(results)
      .filter((r: any) => r.status === 'success')
      .reduce((sum: number, r: any) => sum + (r.itemsCreated || 0), 0)
    
    const totalSkipped = Object.values(results)
      .filter((r: any) => r.status === 'skipped').length
    
    const totalErrors = Object.values(results)
      .filter((r: any) => r.status === 'error').length

    console.log('✅ Seeding complete!', {
      totalCreated,
      totalSkipped,
      totalErrors
    })

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      summary: {
        totalCreated,
        totalSkipped,
        totalErrors,
        domainsSeeded: Object.keys(results).length
      },
      details: results
    })
  } catch (error: any) {
    console.error('❌ Seed data error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to seed data' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check if user has data
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check all domains
    const { data: domains } = await supabase
      .from('domains')
      .select('domain_name, data')
      .eq('user_id', user.id)
    
    const domainStats = (domains || []).map(d => ({
      domain: d.domain_name,
      itemCount: Array.isArray(d.data) ? d.data.length : 0
    }))
    
    const totalItems = domainStats.reduce((sum, d) => sum + d.itemCount, 0)
    const hasData = totalItems > 0

    return NextResponse.json({
      hasData,
      totalItems,
      domains: domainStats
    })
  } catch (error: any) {
    console.error('❌ Check data error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check data' },
      { status: 500 }
    )
  }
}

















