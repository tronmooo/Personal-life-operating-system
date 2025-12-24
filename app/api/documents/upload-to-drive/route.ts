import { NextRequest, NextResponse } from 'next/server'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { createServerClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/documents/upload-to-drive
 * Upload a document to Google Drive (server-side only)
 * Stores file metadata in the documents table for persistence
 */
export async function POST(request: NextRequest) {
  try {
    console.log('☁️ Google Drive upload request received')

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Drive upload: Not authenticated')
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('📝 Drive upload: User authenticated:', user.email)

    // Get Google tokens using the robust token retrieval pattern
    const tokens = await getGoogleTokens()
    
    if (!tokens.accessToken) {
      console.warn('⚠️ No Google access token found in user_settings')
      return NextResponse.json({
        success: false,
        error: 'No Google access token. Please sign in with Google.',
        requiresAuth: true
      })
    }

    // Validate/refresh the token
    const tokenResult = await getValidGoogleToken(
      user.id,
      tokens.accessToken,
      tokens.refreshToken || null
    )

    if (!tokenResult.success) {
      const errorResult = tokenResult as { success: false; error: string; requiresReauth?: boolean }
      console.error('❌ Drive upload: Failed to get valid Google token:', errorResult.error)
      return NextResponse.json({
        success: false,
        error: errorResult.error || 'Google token expired and could not be refreshed. Please re-authenticate with Google.',
        requiresAuth: errorResult.requiresReauth ?? true
      })
    }
    
    const validToken = tokenResult.accessToken

    // Get file and metadata from form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string || 'Document'
    const suggestedDomain = formData.get('suggestedDomain') as string || 'misc'
    const extractedText = formData.get('extractedText') as string
    const documentName = formData.get('documentName') as string
    const documentDescription = formData.get('documentDescription') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log(`📤 Uploading to Google Drive: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Initialize Google Drive service with validated token
    const driveService = new GoogleDriveService(
      validToken,
      tokens.refreshToken || undefined
    )

    // Map domain to folder name (normalize casing)
    const domainMap: Record<string, string> = {
      'insurance': 'insurance',
      'Insurance': 'insurance',
      'health': 'health',
      'Health': 'health',
      'vehicles': 'vehicles',
      'Vehicles': 'vehicles',
      'finance': 'financial',
      'Finance': 'financial',
      'financial': 'financial',
      'Financial': 'financial',
      'documents': 'misc',
      'Documents': 'misc',
      'home': 'home',
      'Home': 'home',
      'pets': 'pets',
      'Pets': 'pets',
      'career': 'career',
      'Career': 'career',
    }
    const domainFolder = domainMap[suggestedDomain] || 'misc'
    const normalizedDomain = domainFolder // For DB storage

    // Generate filename with timestamp and document type
    const timestamp = new Date().toISOString().split('T')[0]
    const safeDocType = documentType.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')
    const fileName = `${timestamp}_${safeDocType}_${file.name}`

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

    // Store document metadata in the database
    const adminClient = getSupabaseAdmin()
    const { data: documentRecord, error: dbError } = await adminClient
      .from('documents')
      .insert({
        user_id: user.id,
        domain: normalizedDomain,
        document_name: documentName || file.name,
        document_description: documentDescription || `${documentType} uploaded via Drive`,
        document_type: documentType,
        file_name: driveFile.name,
        mime_type: driveFile.mimeType,
        file_size: driveFile.size || String(file.size),
        drive_file_id: driveFile.id,
        web_view_link: driveFile.webViewLink,
        web_content_link: driveFile.webContentLink,
        thumbnail_link: driveFile.thumbnailLink,
        extracted_text: extractedText || null,
        ocr_text: extractedText || null,
        ocr_processed: !!extractedText,
        metadata: {
          uploadedAt: new Date().toISOString(),
          originalFileName: file.name,
          driveCreatedTime: driveFile.createdTime,
          driveModifiedTime: driveFile.modifiedTime,
          domainFolder: domainFolder,
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('⚠️ Failed to store document metadata in DB:', dbError)
      // Still return success since Drive upload worked, but include warning
      return NextResponse.json({
        success: true,
        warning: 'File uploaded to Drive but metadata storage failed',
        driveUrl: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
        fileId: driveFile.id,
        fileName: driveFile.name,
        mimeType: driveFile.mimeType,
        thumbnailLink: driveFile.thumbnailLink,
        size: driveFile.size,
        createdTime: driveFile.createdTime,
      })
    }

    console.log('✅ Document metadata stored in DB:', documentRecord.id)

    return NextResponse.json({
      success: true,
      driveUrl: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
      fileId: driveFile.id,
      fileName: driveFile.name,
      mimeType: driveFile.mimeType,
      thumbnailLink: driveFile.thumbnailLink,
      size: driveFile.size,
      createdTime: driveFile.createdTime,
      documentId: documentRecord.id,
      domain: normalizedDomain,
    })
  } catch (error: any) {
    console.error('❌ Google Drive upload error:', error)
    
    // Check for specific Google API errors
    if (error.message?.includes('invalid_grant') || error.message?.includes('Token has been expired')) {
      return NextResponse.json({
        success: false,
        error: 'Google authentication expired. Please re-authenticate with Google.',
        requiresAuth: true,
      }, { status: 401 })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to upload to Google Drive',
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined,
      },
      { status: 500 }
    )
  }
}






























