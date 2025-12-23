import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { refreshGoogleToken } from '@/lib/auth/refresh-google-token'

// Sanitize filename to be Supabase-storage compatible (no spaces, special chars)
function sanitizeFileName(name: string): string {
  // Replace spaces with underscores, remove special chars except dots, dashes, underscores
  return name
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^\w\-_.]/g, '')      // Remove special characters except word chars, dash, dot, underscore
    .replace(/__+/g, '_')           // Collapse multiple underscores
}

// Sanitize a full path (preserves slashes for directory structure)
function sanitizePath(filePath: string): string {
  return filePath
    .split('/')
    .map(segment => sanitizeFileName(segment))
    .join('/')
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session for provider token
    const { data: { session } } = await supabase.auth.getSession()

    const form = await req.formData()
    const file = form.get('file') as File | null
    const path = form.get('path') as string | null // Optional custom path

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create unique file path with user ID - sanitize to remove spaces and special chars
    const fileExt = file.name.split('.').pop()
    const rawPath = path || `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const fileName = sanitizePath(rawPath)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { 
        contentType: file.type,
        upsert: false 
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    console.log('✅ File uploaded to Supabase Storage:', publicUrl)

    // **Also upload to Google Drive if user has Google OAuth token**
    let driveLink: string | null = null
    let driveFileId: string | null = null
    
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
      try {
        const driveService = new GoogleDriveService(
          googleAccessToken,
          googleRefreshToken || undefined
        )

        // Re-read the file for Drive upload
        const fileArrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(fileArrayBuffer)

        // Determine domain folder from path or default to 'photos'
        let domainFolder = 'photos'
        if (path) {
          if (path.includes('home-assets')) domainFolder = 'home'
          else if (path.includes('pets')) domainFolder = 'pets'
          else if (path.includes('vehicles')) domainFolder = 'vehicles'
          else if (path.includes('health')) domainFolder = 'health'
        }

        console.log('   Uploading to folder:', domainFolder)
        
        const driveFile = await driveService.uploadFile({
          file: fileBuffer,
          fileName: file.name,
          mimeType: file.type,
          domainFolder: domainFolder,
        })

        driveFileId = driveFile.id
        driveLink = driveFile.webViewLink || null
        console.log('✅ File also uploaded to Google Drive!')
        console.log('   Drive File ID:', driveFileId)
        console.log('   Drive Link:', driveLink)
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

              let domainFolder = 'photos'
              if (path) {
                if (path.includes('home-assets')) domainFolder = 'home'
                else if (path.includes('pets')) domainFolder = 'pets'
                else if (path.includes('vehicles')) domainFolder = 'vehicles'
                else if (path.includes('health')) domainFolder = 'health'
              }

              const driveFile = await driveService.uploadFile({
                file: fileBuffer,
                fileName: file.name,
                mimeType: file.type,
                domainFolder: domainFolder,
              })

              driveFileId = driveFile.id
              driveLink = driveFile.webViewLink || null
              console.log('✅ File uploaded to Google Drive after token refresh!')
            } catch (retryError: any) {
              console.error('⚠️ Google Drive upload failed after refresh:', retryError.message)
            }
          } else {
            console.error('⚠️ Token refresh failed:', refreshResult)
          }
        } else {
          // Don't fail the entire upload if Drive fails
          console.warn('⚠️ Google Drive upload failed (non-critical):', driveError.message)
        }
      }
    } else {
      console.log('ℹ️ No Google provider token available - skipping Google Drive upload')
      console.log('   Hint: Sign in with Google to enable automatic Drive backup')
    }

    return NextResponse.json({ 
      url: publicUrl,
      driveLink: driveLink,
      driveFileId: driveFileId,
      uploadedToDrive: !!driveLink,
    })
  } catch (e: any) {
    console.error('Upload failed:', e)
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
