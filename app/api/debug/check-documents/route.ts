import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all documents for this user
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, document_name, document_type, domain, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Show what categories are actually in the database
    const categoryCounts: Record<string, number> = {}
    const sampleDocs = (docs || []).map((doc: { document_name: string; document_type: string; domain: string; metadata: Record<string, unknown> | null; created_at: string }) => {
      const category = (doc.metadata?.category as string) || 'No category'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
      
      return {
        name: doc.document_name,
        type: doc.document_type,
        domain: doc.domain,
        metadata_category: doc.metadata?.category,
        created: doc.created_at
      }
    })

    return NextResponse.json({
      total: docs?.length || 0,
      categoryCounts,
      sampleDocuments: sampleDocs.slice(0, 10),
      allDocuments: sampleDocs
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
