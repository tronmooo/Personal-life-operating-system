import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { refreshGoogleToken } from '@/lib/auth/refresh-google-token'

export async function POST(request: NextRequest) {
  try {
    // Check authentication using Supabase
    const supabaseAuth = await createServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session for provider token (Google Drive upload)
    const { data: { session } } = await supabaseAuth.auth.getSession()

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact support.' 
      }, { status: 500 })
    }

    // Service role client (server-side only) for storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const formData = await request.formData()
    const file = formData.get('file') as File
    const domain = formData.get('domain') as string | null
    const domain_id = formData.get('domain_id') as string | null
    const metadataStr = formData.get('metadata') as string
    const parsedMetadata = metadataStr ? JSON.parse(metadataStr) : {}

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Create a unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    console.log('✅ File uploaded to Supabase Storage:', publicUrl)

    // Extract metadata fields for document columns
    const { 
      ocrText, 
      ocrConfidence,
      expirationDate,
      renewalDate,
      policyNumber,
      accountNumber,
      amount,
      documentType,
      ...remainingMetadata 
    } = parsedMetadata

    // **Try to upload to Google Drive if user has Google OAuth token**
    let driveFileId: string | null = null
    let driveWebViewLink: string | null = null
    let driveWebContentLink: string | null = null
    let driveThumbnailLink: string | null = null

    // Get Google access token with fallback to stored tokens
    let googleAccessToken = session?.provider_token || null
    let googleRefreshToken = session?.provider_refresh_token || null
    let tokenSource = 'session'

    // If no session token, try to get from user_settings
    if (!googleAccessToken) {
      console.log('ℹ️ No session provider token, checking user_settings...')
      const storedTokens = await getGoogleTokens()
      if (storedTokens) {
        googleAccessToken = storedTokens.accessToken
        googleRefreshToken = storedTokens.refreshToken
        tokenSource = 'user_settings'
        console.log('✅ Found Google tokens in user_settings')
      }
    }

    if (googleAccessToken) {
      console.log('🔑 Google provider token found - attempting Google Drive upload...')
      console.log('   Token source:', tokenSource)
      console.log('   Token exists:', googleAccessToken.substring(0, 20) + '...')
      console.log('   GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID)
      console.log('   GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)
      console.log('   Domain folder:', domain || 'misc')
      
      try {
        const driveService = new GoogleDriveService(
          googleAccessToken,
          googleRefreshToken || undefined
        )

        // Re-read the file for Drive upload (FormData can only be read once)
        const fileArrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(fileArrayBuffer)

        const driveFile = await driveService.uploadFile({
          file: fileBuffer,
          fileName: file.name,
          mimeType: file.type,
          domainFolder: domain || 'misc',
          extractedText: ocrText || undefined,
        })

        driveFileId = driveFile.id
        driveWebViewLink = driveFile.webViewLink || null
        driveWebContentLink = driveFile.webContentLink || null
        driveThumbnailLink = driveFile.thumbnailLink || null

        console.log('✅ File also uploaded to Google Drive!')
        console.log('   Drive File ID:', driveFileId)
        console.log('   Drive View Link:', driveWebViewLink)
        console.log('   Drive Download Link:', driveWebContentLink)
      } catch (driveError: any) {
        // Check if error is due to expired token - try to refresh
        const isTokenError = driveError.message?.includes('invalid_grant') ||
                            driveError.message?.includes('Invalid Credentials') ||
                            driveError.message?.includes('401') ||
                            driveError.code === 401

        if (isTokenError && googleRefreshToken) {
          console.log('🔄 Token may be expired, attempting refresh...')
          const refreshResult = await refreshGoogleToken(user.id, googleRefreshToken)
          
          if (refreshResult.success && 'accessToken' in refreshResult) {
            console.log('✅ Token refreshed successfully, retrying upload...')
            
            try {
              const driveService = new GoogleDriveService(
                refreshResult.accessToken,
                googleRefreshToken
              )

              const fileArrayBuffer = await file.arrayBuffer()
              const fileBuffer = Buffer.from(fileArrayBuffer)

              const driveFile = await driveService.uploadFile({
                file: fileBuffer,
                fileName: file.name,
                mimeType: file.type,
                domainFolder: domain || 'misc',
                extractedText: ocrText || undefined,
              })

              driveFileId = driveFile.id
              driveWebViewLink = driveFile.webViewLink || null
              driveWebContentLink = driveFile.webContentLink || null
              driveThumbnailLink = driveFile.thumbnailLink || null

              console.log('✅ File uploaded to Google Drive after token refresh!')
              console.log('   Drive File ID:', driveFileId)
            } catch (retryError: any) {
              console.error('⚠️ Google Drive upload failed after refresh:', retryError.message)
            }
          } else {
            console.error('⚠️ Token refresh failed:', refreshResult)
          }
        } else {
          // Don't fail the entire upload if Drive fails
          console.error('⚠️ Google Drive upload failed (non-critical):', driveError.message)
          console.error('   Error details:', driveError)
        }
      }
    } else {
      console.log('ℹ️ No Google provider token available - skipping Google Drive upload')
      console.log('   Hint: Sign in with Google to enable automatic Drive backup')
    }

    // Save document metadata to database
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        domain: domain || null,
        domain_id: (domain_id && domain_id !== '') ? domain_id : null,
        file_path: publicUrl,
        file_url: publicUrl,
        file_name: file.name,
        document_name: parsedMetadata.name || file.name,
        document_type: documentType || file.type,
        mime_type: file.type,
        file_size: file.size,
        metadata: remainingMetadata,
        ocr_text: ocrText || null,
        ocr_confidence: ocrConfidence || null,
        ocr_processed: !!ocrText,
        expiration_date: expirationDate || null,
        renewal_date: renewalDate || null,
        policy_number: policyNumber || null,
        account_number: accountNumber || null,
        amount: amount || null,
        // Google Drive fields
        drive_file_id: driveFileId,
        web_view_link: driveWebViewLink,
        web_content_link: driveWebContentLink,
        thumbnail_link: driveThumbnailLink,
      })
      .select()
      .single()

    if (docError) {
      console.error('Database insert error:', docError)
      return NextResponse.json({ 
        error: `Failed to save document metadata: ${docError.message}` 
      }, { status: 500 })
    }

    console.log('💾 Document metadata saved to database:', docData.id)

    // Fire-and-forget processing via Supabase Edge Function (best-effort)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const projectRef = new URL(supabaseUrl).host.split('.')[0]
      const fnUrl = `https://${projectRef}.functions.supabase.co/process-document`
      // Do not await; background trigger
      fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          document_id: docData.id,
          storage_key: fileName
        })
      }).catch(() => {})
    } catch (e) {
      // Ignore function trigger errors; the upload succeeded
      console.warn('Could not trigger process-document function', e)
    }

    return NextResponse.json({ 
      data: { 
        ...docData, 
        storage_key: fileName,
        uploaded_to_drive: !!driveFileId,
        drive_link: driveWebViewLink,
      } 
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
}

