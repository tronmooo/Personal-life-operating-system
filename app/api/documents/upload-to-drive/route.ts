import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { createServerClient } from '@/lib/supabase/server'


export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/documents/upload-to-drive
 * Upload a document to Google Drive (server-side only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('☁️ Google Drive upload request received')

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get session for provider token
    const { data: { session } } = await supabase.auth.getSession()

    // Check for Google provider token
    if (!session?.provider_token) {
      console.warn('⚠️ No Google provider token found')
      return NextResponse.json({
        success: false,
        error: 'No Google access token. Please sign in with Google.',
        requiresAuth: true
      })
    }

    // Get file and metadata from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const suggestedDomain = formData.get('suggestedDomain') as string
    const extractedText = formData.get('extractedText') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📤 Uploading to Google Drive: ${file.name}`)

    // Initialize Google Drive service
    const driveService = new GoogleDriveService(
      session.provider_token,
      session.provider_refresh_token || undefined
    )

    // Map domain to folder name
    const domainMap: Record<string, string> = {
      'Insurance': 'insurance',
      'Health': 'health',
      'Vehicles': 'vehicles',
      'Finance': 'financial',
      'Documents': 'misc',
    }
    const domainFolder = domainMap[suggestedDomain] || 'misc'

    // Generate filename with timestamp and document type
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `${timestamp}_${documentType.replace(/\s+/g, '_')}_${file.name}`

    // Convert File to Buffer for googleapis
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Drive
    const driveFile = await driveService.uploadFile({
      file: buffer,
      fileName: fileName,
      mimeType: file.type,
      domainFolder: domainFolder,
      extractedText: extractedText || undefined,
    })

    console.log('✅ Uploaded to Google Drive:', driveFile.webViewLink)

    return NextResponse.json({
      success: true,
      driveUrl: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      fileId: driveFile.id,
      fileName: driveFile.name,
    })
  } catch (error: any) {
    console.error('❌ Google Drive upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload to Google Drive',
        details: error.toString(),
      },
      { status: 500 }
    )
  }
}






























