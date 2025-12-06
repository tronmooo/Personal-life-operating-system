import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { GoogleDriveService } from '@/lib/integrations/google-drive'

/**
 * POST /api/test-drive-direct
 * Direct test of Google Drive upload with detailed logging
 */
export async function POST(request: Request) {
  console.log('\n========================================')
  console.log('🧪 TESTING GOOGLE DRIVE UPLOAD DIRECTLY')
  console.log('========================================\n')

  try {
    // 1. Check environment variables
    console.log('1️⃣ Checking environment variables...')
    console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ MISSING')
    console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ MISSING')
    console.log('   NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ MISSING')
    
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
        error: 'Missing Google OAuth credentials in environment',
        details: {
          hasClientId: !!process.env.GOOGLE_CLIENT_ID,
          hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        }
      }, { status: 500 })
    }

    // 2. Check authentication
    console.log('\n2️⃣ Checking authentication...')
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.log('   ❌ Session error:', sessionError.message)
      return NextResponse.json({ error: 'Session error', details: sessionError.message }, { status: 401 })
    }

    if (!session) {
      console.log('   ❌ No active session')
      return NextResponse.json({ error: 'Not authenticated - please sign in' }, { status: 401 })
    }

    console.log('   ✅ Authenticated as:', session.user.email)
    console.log('   User ID:', session.user.id)
    console.log('   Provider:', session.user.app_metadata?.provider || 'unknown')

    // 3. Check provider token
    console.log('\n3️⃣ Checking Google provider token...')
    console.log('   Provider token:', session.provider_token ? '✅ EXISTS' : '❌ MISSING')
    console.log('   Refresh token:', session.provider_refresh_token ? '✅ EXISTS' : '❌ MISSING')
    
    if (!session.provider_token) {
      console.log('   ❌ No Google provider token - user must sign in with Google OAuth')
      return NextResponse.json({
        error: 'No Google access token',
        details: 'You must sign out and sign back in with Google to get Drive access',
        provider: session.user.app_metadata?.provider || 'unknown',
        isGoogleOAuth: session.user.app_metadata?.provider === 'google'
      }, { status: 401 })
    }

    console.log('   Token preview:', session.provider_token.substring(0, 20) + '...')

    // 4. Get file from form
    console.log('\n4️⃣ Getting file from request...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('   ❌ No file provided')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('   ✅ File received:', file.name)
    console.log('   File size:', (file.size / 1024).toFixed(2), 'KB')
    console.log('   File type:', file.type)

    // 5. Initialize Google Drive service
    console.log('\n5️⃣ Initializing Google Drive service...')
    const driveService = new GoogleDriveService(
      session.provider_token,
      session.provider_refresh_token || undefined
    )
    console.log('   ✅ GoogleDriveService created')

    // 6. Convert file to buffer
    console.log('\n6️⃣ Converting file to buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log('   ✅ Buffer created:', buffer.length, 'bytes')

    // 7. Upload to Google Drive
    console.log('\n7️⃣ Uploading to Google Drive...')
    console.log('   Folder: misc')
    console.log('   Filename:', file.name)
    console.log('   MIME type:', file.type)
    
    const driveFile = await driveService.uploadFile({
      file: buffer,
      fileName: file.name,
      mimeType: file.type,
      domainFolder: 'misc',
    })

    console.log('\n✅ ✅ ✅ SUCCESS! ✅ ✅ ✅')
    console.log('Drive File ID:', driveFile.id)
    console.log('Drive View Link:', driveFile.webViewLink)
    console.log('Drive Download Link:', driveFile.webContentLink)
    console.log('\n========================================\n')

    return NextResponse.json({
      success: true,
      message: 'File uploaded to Google Drive successfully!',
      file: {
        id: driveFile.id,
        name: driveFile.name,
        viewLink: driveFile.webViewLink,
        downloadLink: driveFile.webContentLink,
        thumbnailLink: driveFile.thumbnailLink,
      },
      checkDrive: 'https://drive.google.com - Look for LifeHub/Miscellaneous folder'
    })

  } catch (error: any) {
    console.error('\n❌ ❌ ❌ ERROR ❌ ❌ ❌')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('========================================\n')

    return NextResponse.json({
      error: 'Upload failed',
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
    }, { status: 500 })
  }
}







