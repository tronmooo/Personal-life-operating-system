import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleDriveService } from '@/lib/integrations/google-drive'

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('file') as File | null
    const path = form.get('path') as string | null // Optional custom path

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Create unique file path with user ID
    const fileExt = file.name.split('.').pop()
    const fileName = path || `${session.user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

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

    // **NEW: Also upload to Google Drive if user has Google OAuth token**
    let driveLink: string | null = null
    let driveFileId: string | null = null
    
    if (session.provider_token) {
      console.log('🔑 Google provider token found - attempting Google Drive upload...')
      console.log('   Provider token exists:', session.provider_token.substring(0, 20) + '...')
      console.log('   GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID)
      console.log('   GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)
      try {
        const driveService = new GoogleDriveService(
          session.provider_token,
          session.provider_refresh_token || undefined
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
        // Don't fail the entire upload if Drive fails
        console.warn('⚠️ Google Drive upload failed (non-critical):', driveError.message)
      }
    } else {
      console.log('ℹ️ No Google provider token - skipping Google Drive upload')
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


