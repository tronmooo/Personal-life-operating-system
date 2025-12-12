import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint uses the service role key to run migrations
// Only call from server-side or admin tools

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jphpxqqilrjyypztkswc.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4NzM4MCwiZXhwIjoyMDcwMTYzMzgwfQ.TTjNfgcHS0eODi-50B1Fp2nuiB49DttKEMJH_TOPJIg'

export async function POST(request: Request) {
  try {
    const { migration } = await request.json()
    
    if (!migration) {
      return NextResponse.json({ error: 'Migration name required' }, { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })

    if (migration === 'service_providers') {
      // Create service_providers table
      const { error: error1 } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS service_providers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            provider_name TEXT NOT NULL,
            category TEXT NOT NULL CHECK (category IN ('insurance', 'utilities', 'telecom', 'financial', 'subscriptions', 'other')),
            subcategory TEXT,
            account_number TEXT,
            phone TEXT,
            website TEXT,
            monthly_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31),
            auto_pay_enabled BOOLEAN DEFAULT false,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
            icon_color TEXT,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      })

      if (error1) {
        // Try direct insert to check if table exists
        const { error: checkError } = await supabase
          .from('service_providers')
          .select('id')
          .limit(1)
        
        if (checkError?.code === '42P01') {
          // Table doesn't exist - we need to use raw SQL another way
          return NextResponse.json({ 
            error: 'Cannot create tables via RPC. Please run migration manually.',
            sql_required: true,
            message: 'The exec_sql RPC function is not available. Run the SQL in Supabase Dashboard.'
          }, { status: 400 })
        }
        // Table exists, continue
      }

      // Check if tables exist by trying to query them
      const { error: providerCheck } = await supabase
        .from('service_providers')
        .select('id')
        .limit(1)

      if (providerCheck?.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'Tables do not exist. Manual SQL execution required.',
          action: 'Run the migration SQL in Supabase Dashboard SQL Editor'
        }, { status: 400 })
      }

      // Tables exist!
      return NextResponse.json({
        success: true,
        message: 'Service providers tables verified/created'
      })
    }

    return NextResponse.json({ error: 'Unknown migration' }, { status: 400 })

  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET to check table status
export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    })

    const tables = ['service_providers', 'service_payments', 'service_documents']
    const status: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1)
      status[table] = !error || error.code !== '42P01'
    }

    const allExist = Object.values(status).every(Boolean)

    return NextResponse.json({
      tables: status,
      allExist,
      message: allExist ? 'All tables ready' : 'Some tables missing - run migration'
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


