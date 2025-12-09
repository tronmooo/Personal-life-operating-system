import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

type ClientResult =
  | { errorResponse: NextResponse }
  | { supabaseAdmin: SupabaseClient; userId: string }

async function getClients(): Promise<ClientResult> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  return { supabaseAdmin, userId: user.id }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const clientResult = await getClients()
    if ('errorResponse' in clientResult) return clientResult.errorResponse

    const { supabaseAdmin, userId } = clientResult
    const payload = await request.json()
    const updates: Record<string, any> = {}

    if (payload.title !== undefined) updates.title = payload.title
    if (payload.description !== undefined) updates.description = payload.description
    if (payload.metadata !== undefined) updates.metadata = payload.metadata
    if (payload.domain !== undefined) updates.domain = payload.domain

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('domain_entries')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const clientResult = await getClients()
    if ('errorResponse' in clientResult) return clientResult.errorResponse

    const { supabaseAdmin, userId } = clientResult

    const { error } = await supabaseAdmin
      .from('domain_entries')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
