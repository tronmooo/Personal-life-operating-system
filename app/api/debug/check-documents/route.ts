import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get all documents for this user
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, document_name, document_type, domain, metadata, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Show what categories are actually in the database
    const categoryCounts: Record<string, number> = {}
    const sampleDocs = docs.map(doc => {
      const category = doc.metadata?.category || 'No category'
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
      total: docs.length,
      categoryCounts,
      sampleDocuments: sampleDocs.slice(0, 10),
      allDocuments: sampleDocs
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}






