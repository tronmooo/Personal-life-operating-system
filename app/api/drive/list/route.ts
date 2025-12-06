export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/drive/list?domain=insurance
 * List all files for a specific domain
 */
export async function GET(request: NextRequest) {
  try {
    // Get Google tokens from Supabase user_settings
    const tokens = await getGoogleTokens()

    if (!tokens || !tokens.accessToken) {
      return NextResponse.json({ 
        error: 'No Google Drive access. Please sign out and sign in again with Google.',
        needsReauth: true 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domain = searchParams.get('domain')

    if (!domain) {
      return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
    }

    const driveService = new GoogleDriveService(
      tokens.accessToken,
      tokens.refreshToken || ''
    )

    const files = await driveService.listDomainFiles(domain)

    // Get metadata from Supabase for these files
    const driveFileIds = files.map((f: any) => f.id)
    const { data: metadata } = await supabase
      .from('documents')
      .select('drive_file_id, document_name, document_description, issue_date')
      .in('drive_file_id', driveFileIds)

    // Merge metadata with files
    const filesWithMetadata = files.map((file: any) => {
      const meta = metadata?.find((m) => m.drive_file_id === file.id)
      return {
        ...file,
        documentName: meta?.document_name,
        documentDescription: meta?.document_description,
        issueDate: meta?.issue_date,
      }
    })

    return NextResponse.json({
      domain,
      files: filesWithMetadata,
      count: filesWithMetadata.length,
    })
  } catch (error: any) {
    console.error('List files error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to list files' },
      { status: 500 }
    )
  }
}
