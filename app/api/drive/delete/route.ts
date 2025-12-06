import { NextRequest, NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-load Supabase client to prevent build-time errors
let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required Supabase environment variables')
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabase
}

/**
 * DELETE /api/drive/delete
 * Delete a file from Google Drive and remove metadata from Supabase
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get Google tokens from Supabase user_settings
    const tokens = await getGoogleTokens()

    if (!tokens || !tokens.accessToken) {
      return NextResponse.json({ 
        error: 'No Google Drive access. Please sign out and sign in again with Google.',
        needsReauth: true 
      }, { status: 401 })
    }

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
    }

    const driveService = new GoogleDriveService(
      tokens.accessToken,
      tokens.refreshToken || ''
    )

    // Delete from Google Drive
    await driveService.deleteFile(fileId)

    // Delete metadata from Supabase
    await getSupabase().from('documents').delete().eq('drive_file_id', fileId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}
































