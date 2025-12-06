import { NextRequest, NextResponse } from 'next/server'
import { GenerateQRRequest, GenerateQRResponse } from '@/types/share'

/**
 * POST /api/share/qr
 * Generate QR code for a URL
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateQRRequest = await request.json()
    
    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const size = body.size || 256
    const format = body.format || 'png'

    // Use QR code generation service
    // For now, we'll use a public API (in production, use qrcode library)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(body.url)}&format=${format}`

    // Fetch QR code
    const response = await fetch(qrApiUrl)
    
    if (!response.ok) {
      throw new Error('Failed to generate QR code')
    }

    const buffer = await response.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:image/${format};base64,${base64}`

    const result: GenerateQRResponse = {
      success: true,
      qr_code: dataUrl,
      format
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Exception in POST /api/share/qr:', error)
    return NextResponse.json(
      { error: error.message || 'QR generation failed' },
      { status: 500 }
    )
  }
}

