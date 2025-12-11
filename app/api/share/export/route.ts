import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ExportDataRequest, ExportDataResponse } from '@/types/share'
import { universalExporter } from '@/lib/share/universal-exporter'

export const maxDuration = 60

/**
 * POST /api/share/export
 * Export domain entries in various formats
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ExportDataRequest = await request.json()
    
    if (!body.domain || !body.entry_ids || body.entry_ids.length === 0) {
      return NextResponse.json(
        { error: 'Domain and entry_ids are required' },
        { status: 400 }
      )
    }

    if (!body.format) {
      return NextResponse.json(
        { error: 'Format is required' },
        { status: 400 }
      )
    }

    // Fetch entries from database
    const { data: entries, error } = await supabase
      .from('domain_entries')
      .select('*')
      .eq('domain', body.domain)
      .in('id', body.entry_ids)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching entries:', error)
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      )
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries found' },
        { status: 404 }
      )
    }

    // Export data
    const result = await universalExporter.export(
      body.domain,
      entries,
      body.format,
      body.options || {}
    )

    // Convert Blob to base64 for JSON response
    const blob = typeof result.data === 'string' ? new Blob([result.data]) : result.data
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const response: ExportDataResponse = {
      success: true,
      data: base64,
      filename: result.filename,
      mime_type: blob.type || 'application/octet-stream',
    }

    return NextResponse.json(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed'
    console.error('Exception in POST /api/share/export:', error)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
