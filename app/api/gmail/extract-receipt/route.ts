/**
 * POST /api/gmail/extract-receipt
 * Extract receipt data from email attachments using OCR
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { GmailParser } from '@/lib/integrations/gmail-parser'
import { OpenAIService } from '@/lib/external-apis/openai-service'

const openai = new OpenAIService()

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the session to access provider token
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 401 }
      )
    }

    const { messageId, attachmentId } = await request.json()

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }

    // Initialize Gmail parser
    const gmailParser = new GmailParser(session.provider_token)

    let attachmentData: string | null = null
    let mimeType = 'image/jpeg'

    if (attachmentId) {
      // Get specific attachment
      attachmentData = await gmailParser.getAttachmentData(messageId, attachmentId)
    } else {
      // Get first receipt attachment
      const attachments = await gmailParser.getReceiptAttachments(messageId)
      if (attachments.length > 0) {
        attachmentData = attachments[0].data || null
        mimeType = attachments[0].mimeType
      }
    }

    if (!attachmentData) {
      return NextResponse.json(
        { error: 'No receipt attachment found' },
        { status: 404 }
      )
    }

    // Process with OCR using GPT-4 Vision
    const ocrResult = await extractReceiptWithVision(attachmentData, mimeType)

    return NextResponse.json({
      success: true,
      data: ocrResult
    })
  } catch (error: any) {
    console.error('Exception in POST /api/gmail/extract-receipt:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function extractReceiptWithVision(base64Data: string, mimeType: string) {
  const imageUrl = `data:${mimeType};base64,${base64Data}`

  const response = await openai.chatCompletion({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Extract ALL information from this receipt image. Return JSON only:

{
  "vendor": "Store/Restaurant name",
  "vendorAddress": "Full address if visible",
  "date": "YYYY-MM-DD",
  "time": "HH:MM if visible",
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00,
  "paymentMethod": "Cash/Credit/Debit",
  "cardLastFour": "1234 if visible",
  "items": [
    {"name": "Item name", "price": 0.00, "quantity": 1}
  ],
  "category": "Groceries/Dining/Shopping/Gas/Entertainment/Healthcare/Other",
  "transactionNumber": "Receipt number if visible",
  "confidence": 0.95
}

Extract as much as possible. Use null for fields not found.`
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1500
  })

  const content = response.choices[0]?.message?.content || '{}'
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.error('Failed to parse OCR response:', e)
  }

  return { rawText: content, confidence: 0.5 }
}


