import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const searchParams = request.nextUrl.searchParams
    const domain_id = searchParams.get('domain_id')

    let query = supabaseAdmin
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false })

    if (domain_id) {
      query = query.eq('domain_id', domain_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { 
      domain, 
      domain_id, 
      file_path, 
      metadata, 
      ocr_data,
      document_name,
      file_name,
      document_type,
      mime_type,
      file_size,
      file_data,
      file_url,
      tags,
      ocr_processed,
      ocr_text,
      ocr_confidence,
      extracted_data,
      notes,
      expiration_date,
      renewal_date,
      policy_number,
      account_number,
      amount,
      reminder_created,
      reminder_id
    } = body

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: user.id,
        domain: domain || null,
        domain_id: domain_id || null,
        file_path: file_path || file_url,
        document_name: document_name || file_name,
        file_name: file_name || document_name,
        document_type: document_type || mime_type,
        mime_type: mime_type || document_type,
        file_size: file_size || null,
        file_data: file_data || null,
        file_url: file_url || file_path,
        tags: tags || [],
        metadata: metadata || {},
        ocr_processed: ocr_processed || false,
        ocr_text: ocr_text || null,
        ocr_confidence: ocr_confidence || null,
        extracted_data: extracted_data || {},
        ocr_data: ocr_data || null,
        notes: notes || null,
        expiration_date: expiration_date || null,
        renewal_date: renewal_date || null,
        policy_number: policy_number || null,
        account_number: account_number || null,
        amount: amount || null,
        reminder_created: reminder_created || false,
        reminder_id: reminder_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('POST /api/documents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const searchParams = request.nextUrl.searchParams
    const document_id = searchParams.get('id')

    if (!document_id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // First, get the document to check ownership and get file paths for cleanup
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete the document record
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', document_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // TODO: Also delete from storage if file_path exists
    // This would require extracting the path from the URL and calling storage.remove()

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('DELETE /api/documents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Service role client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('PATCH /api/documents error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

