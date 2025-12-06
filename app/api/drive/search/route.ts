export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { GoogleDriveService } from '@/lib/integrations/google-drive'

/**
 * GET /api/drive/search?q=insurance
 * Search across all LifeHub documents
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
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
    }

    const driveService = new GoogleDriveService(
      tokens.accessToken,
      tokens.refreshToken || ''
    )

    const results = await driveService.searchDocuments(query)

    return NextResponse.json({
      query,
      results,
      count: results.length,
    })
  } catch (error: any) {
    console.error('Search error:', error.message)
    return NextResponse.json(
      { error: error.message || 'Failed to search documents' },
      { status: 500 }
    )
  }
}
