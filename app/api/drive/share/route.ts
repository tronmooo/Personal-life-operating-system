import { NextRequest, NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { GoogleDriveService } from '@/lib/integrations/google-drive'

/**
 * POST /api/drive/share
 * Share a file with a specific email or get shareable link
 */
export async function POST(request: NextRequest) {
  try {
    // Get Google tokens from Supabase user_settings
    const tokens = await getGoogleTokens()

    if (!tokens || !tokens.accessToken) {
      return NextResponse.json({ 
        error: 'No Google Drive access. Please sign out and sign in again with Google.',
        needsReauth: true 
      }, { status: 401 })
    }

    const { fileId, email, role = 'reader', anyoneWithLink = false } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    const driveService = new GoogleDriveService(
      tokens.accessToken,
      tokens.refreshToken || ''
    )

    if (anyoneWithLink) {
      // Create shareable link
      const link = await driveService.createShareableLink(fileId)
      return NextResponse.json({ link })
    } else if (email) {
      // Share with specific email
      await driveService.shareWithEmail(fileId, email, role)
      return NextResponse.json({ success: true, sharedWith: email })
    } else {
      return NextResponse.json({ error: 'Provide either email or anyoneWithLink' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Share error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to share file' },
      { status: 500 }
    )
  }
}
































