export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Fix document categories for existing documents
 * GET /api/fix-categories
 */
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get all documents for this user
    const { data: docs, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`🔧 Fixing categories for ${docs?.length || 0} documents...`)

    const updates = []
    let fixedCount = 0

    for (const doc of docs || []) {
      const docType = (doc.document_type || '').toLowerCase()
      const metadata = doc.metadata || {}
      const oldCategory = metadata.category
      let newCategory = oldCategory

      // Determine correct category based on document type
      if (docType.includes('license') && !docType.includes('business')) {
        newCategory = 'ID & Licenses'
      } else if (docType.includes('passport') || docType.includes('visa') || 
                 docType.includes('birth certificate') || docType.includes('social security') ||
                 docType.includes('id card') || docType.includes('id ')) {
        newCategory = 'ID & Licenses'
      } else if (docType.includes('registration') || docType.includes('title') || 
                 (docType.includes('vehicle') && !docType.includes('license'))) {
        newCategory = 'Vehicle'
      } else if (docType.includes('deed') || docType.includes('lease') || 
                 docType.includes('mortgage')) {
        newCategory = 'Property'
      } else if (docType.includes('diploma') || docType.includes('transcript') || 
                 docType.includes('certificate')) {
        newCategory = 'Education'
      } else if (docType.includes('tax') || docType.includes('bank') || 
                 docType.includes('statement')) {
        newCategory = 'Financial & Tax'
      } else if (docType.includes('prescription') || docType.includes('medical') || 
                 docType.includes('health card') || docType.includes('lab result')) {
        newCategory = 'Medical'
      } else if (docType.includes('contract') || docType.includes('will') || 
                 docType.includes('agreement')) {
        newCategory = 'Legal'
      } else if (docType.includes('insurance') || doc.domain === 'insurance') {
        newCategory = 'Insurance'
      }

      // Update if category changed
      if (newCategory !== oldCategory) {
        const updatedMetadata = { ...metadata, category: newCategory }
        
        await supabaseAdmin
          .from('documents')
          .update({ metadata: updatedMetadata })
          .eq('id', doc.id)

        fixedCount++
        updates.push({
          id: doc.id,
          name: doc.document_name,
          type: doc.document_type,
          oldCategory: oldCategory || 'none',
          newCategory: newCategory
        })

        console.log(`✅ Fixed: "${doc.document_name}" | ${oldCategory || 'none'} → ${newCategory}`)
      }
    }

    console.log(`✅ Category fix complete! Updated ${fixedCount} documents`)

    return NextResponse.json({
      success: true,
      totalDocuments: docs?.length || 0,
      fixedCount: fixedCount,
      updates: updates
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fixing categories:', error)
    return NextResponse.json({
      error: message
    }, { status: 500 })
  }
}
