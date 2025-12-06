import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * AI Assistant: Search and Retrieve Documents
 * Allows chat AI to find and return document URLs
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query, category } = await request.json()

    console.log('🔍 AI searching for documents:', { query, category })

    // Search documents
    let dbQuery = supabase
      .from('documents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (category) {
      dbQuery = dbQuery.eq('domain', category)
    }

    const { data: documents, error } = await dbQuery.limit(10)

    if (error) throw error

    // Filter by text search
    let results = documents || []
    if (query) {
      const searchLower = query.toLowerCase()
      results = results.filter(doc =>
        doc.document_name?.toLowerCase().includes(searchLower) ||
        doc.document_type?.toLowerCase().includes(searchLower) ||
        doc.domain?.toLowerCase().includes(searchLower) ||
        doc.metadata?.category?.toLowerCase().includes(searchLower) ||
        doc.ocr_text?.toLowerCase().includes(searchLower)
      )
    }

    console.log(`✅ Found ${results.length} matching documents`)

    return NextResponse.json({
      success: true,
      documents: results.map(doc => ({
        id: doc.id,
        name: doc.document_name || 'Untitled',
        type: doc.document_type,
        category: doc.metadata?.category || doc.domain,
        expirationDate: doc.expiration_date,
        fileUrl: doc.file_url || doc.file_path,
        uploadedAt: doc.created_at
      })),
      count: results.length
    })

  } catch (error: any) {
    console.error('❌ Document search error:', error)
    return NextResponse.json(
      { error: error.message, documents: [], count: 0 },
      { status: 200 }
    )
  }
}










