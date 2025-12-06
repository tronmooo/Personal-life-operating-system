import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

// Legacy GET disabled: use domain_entries endpoints instead
export async function GET() {
  return NextResponse.json(
    { error: 'Deprecated. Use domain_entries endpoints.' },
    { status: 410 }
  )
}

// Legacy POST disabled: use domain_entries endpoints instead
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated. Use domain_entries endpoints.' },
    { status: 410 }
  )
}
