/**
 * POST /api/receipts/process
 * Complete receipt processing workflow:
 * 1. Upload file to Google Drive (optional)
 * 2. OCR extraction using GPT-4 Vision
 * 3. Store receipt data in receipts table
 * 4. Store document metadata in documents table
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, getSupabaseAdmin } from '@/lib/supabase/server'
import { getGoogleTokens } from '@/lib/auth/get-google-tokens'
import { getValidGoogleToken } from '@/lib/auth/refresh-google-token'
import { GoogleDriveService } from '@/lib/integrations/google-drive'
import { getOpenAI } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const maxDuration = 60

interface ReceiptData {
  merchant_name: string | null
  amount: number | null
  date: string | null
  category: string | null
  items: Array<{ name: string; price: number; quantity?: number }> | null
  tax: number | null
  tip: number | null
  receipt_number: string | null
  payment_method: string | null
  card_last_four: string | null
  subtotal: number | null
  vendor_address: string | null
  time: string | null
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧾 Receipt processing request received')

    // Authenticate user
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadToDrive = formData.get('uploadToDrive') === 'true'
    const notes = formData.get('notes') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log(`📤 Processing receipt: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Convert file to base64 for OCR
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageUrl = `data:${file.type};base64,${base64Image}`

    // Step 1: OCR Extraction using GPT-4 Vision
    console.log('🔍 Running OCR extraction...')
    const receiptData = await extractReceiptData(imageUrl)
    console.log('✅ OCR extraction complete:', {
      merchant: receiptData.merchant_name,
      amount: receiptData.amount,
      date: receiptData.date,
      confidence: receiptData.confidence
    })

    // Step 2: Upload to Google Drive (optional)
    let driveData = null
    if (uploadToDrive) {
      try {
        const tokens = await getGoogleTokens()
        
        if (tokens.accessToken) {
          const validToken = await getValidGoogleToken(
            tokens.accessToken,
            tokens.refreshToken || undefined,
            user.id
          )

          if (validToken) {
            const driveService = new GoogleDriveService(validToken, tokens.refreshToken || undefined)
            
            // Generate filename
            const dateStr = receiptData.date || new Date().toISOString().split('T')[0]
            const merchant = receiptData.merchant_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'receipt'
            const fileName = `${dateStr}_${merchant}_receipt${getExtension(file.type)}`

            const driveFile = await driveService.uploadFile({
              file: buffer,
              fileName,
              mimeType: file.type,
              domainFolder: 'financial',
              extractedText: JSON.stringify(receiptData)
            })

            driveData = {
              fileId: driveFile.id,
              webViewLink: driveFile.webViewLink,
              webContentLink: driveFile.webContentLink,
              thumbnailLink: driveFile.thumbnailLink,
              fileName: driveFile.name,
              size: driveFile.size,
              createdTime: driveFile.createdTime
            }
            console.log('✅ Uploaded to Google Drive:', driveFile.webViewLink)
          }
        }
      } catch (driveError: any) {
        console.warn('⚠️ Drive upload failed (continuing without):', driveError.message)
      }
    }

    // Step 3: Store in database
    const adminClient = getSupabaseAdmin()

    // Insert into receipts table
    const { data: receiptRecord, error: receiptError } = await adminClient
      .from('receipts')
      .insert({
        user_id: user.id,
        merchant_name: receiptData.merchant_name,
        amount: receiptData.amount,
        date: receiptData.date,
        category: receiptData.category,
        items: receiptData.items ? JSON.stringify(receiptData.items) : null,
        tax: receiptData.tax,
        tip: receiptData.tip,
        image_url: driveData?.webViewLink || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (receiptError) {
      console.error('❌ Failed to store receipt:', receiptError)
      return NextResponse.json({
        success: false,
        error: 'Failed to store receipt in database',
        details: receiptError.message,
        extractedData: receiptData
      }, { status: 500 })
    }

    console.log('✅ Receipt stored in database:', receiptRecord.id)

    // Insert into documents table for unified document management
    let documentRecord = null
    if (driveData) {
      const { data: docData, error: docError } = await adminClient
        .from('documents')
        .insert({
          user_id: user.id,
          domain: 'financial',
          document_name: driveData.fileName,
          document_description: `Receipt from ${receiptData.merchant_name || 'Unknown'} - $${receiptData.amount || 'Unknown'}`,
          document_type: 'Receipt',
          file_name: driveData.fileName,
          mime_type: file.type,
          file_size: driveData.size || String(file.size),
          drive_file_id: driveData.fileId,
          web_view_link: driveData.webViewLink,
          web_content_link: driveData.webContentLink,
          thumbnail_link: driveData.thumbnailLink,
          ocr_processed: true,
          ocr_text: JSON.stringify(receiptData),
          extracted_data: {
            ...receiptData,
            receipt_id: receiptRecord.id
          },
          amount: receiptData.amount,
          metadata: {
            uploadedAt: new Date().toISOString(),
            originalFileName: file.name,
            driveCreatedTime: driveData.createdTime,
            receiptId: receiptRecord.id,
            merchant: receiptData.merchant_name,
            category: receiptData.category
          }
        })
        .select()
        .single()

      if (docError) {
        console.warn('⚠️ Failed to store document metadata:', docError.message)
      } else {
        documentRecord = docData
        console.log('✅ Document metadata stored:', documentRecord.id)
      }
    }

    // Also insert into finance_transactions for financial tracking
    if (receiptData.amount) {
      try {
        await adminClient
          .from('finance_transactions')
          .insert({
            user_id: user.id,
            type: 'expense',
            category: receiptData.category || 'Other',
            amount: Math.abs(receiptData.amount),
            description: `Receipt: ${receiptData.merchant_name || file.name}`,
            merchant: receiptData.merchant_name,
            date: receiptData.date || new Date().toISOString().split('T')[0],
            receipt_url: driveData?.webViewLink || null,
            metadata: {
              receiptId: receiptRecord.id,
              items: receiptData.items,
              tax: receiptData.tax,
              tip: receiptData.tip,
              confidence: receiptData.confidence
            }
          })
        console.log('✅ Financial transaction created')
      } catch (txError) {
        console.warn('⚠️ Failed to create financial transaction:', txError)
      }
    }

    return NextResponse.json({
      success: true,
      receipt: {
        id: receiptRecord.id,
        merchant_name: receiptData.merchant_name,
        amount: receiptData.amount,
        date: receiptData.date,
        category: receiptData.category,
        items: receiptData.items,
        tax: receiptData.tax,
        tip: receiptData.tip,
        receipt_number: receiptData.receipt_number,
        confidence: receiptData.confidence
      },
      document: documentRecord ? {
        id: documentRecord.id,
        drive_file_id: driveData?.fileId,
        web_view_link: driveData?.webViewLink
      } : null,
      drive: driveData
    })

  } catch (error: any) {
    console.error('❌ Receipt processing error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process receipt',
      details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    }, { status: 500 })
  }
}

async function extractReceiptData(imageUrl: string): Promise<ReceiptData> {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract ALL information from this receipt image. Return ONLY valid JSON with no additional text:

{
  "merchant_name": "Store or restaurant name exactly as shown",
  "vendor_address": "Full address if visible, null otherwise",
  "date": "YYYY-MM-DD format, null if not found",
  "time": "HH:MM format if visible, null otherwise",
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "amount": 0.00,
  "payment_method": "Cash/Credit/Debit/null",
  "card_last_four": "Last 4 digits if visible, null otherwise",
  "items": [
    {"name": "Item name", "price": 0.00, "quantity": 1}
  ],
  "category": "One of: Groceries, Dining, Shopping, Gas, Entertainment, Healthcare, Travel, Utilities, Other",
  "receipt_number": "Receipt/transaction number if visible, null otherwise",
  "confidence": 0.95
}

Rules:
- amount should be the TOTAL (including tax and tip)
- Use null for any field not found
- category should be inferred from the merchant/items
- confidence should be 0.0-1.0 based on image clarity
- Extract ALL line items if visible`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    })

    const content = response.choices[0]?.message?.content || '{}'
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        merchant_name: parsed.merchant_name || null,
        amount: parseFloat(parsed.amount) || parseFloat(parsed.total) || null,
        date: parsed.date || null,
        category: parsed.category || 'Other',
        items: Array.isArray(parsed.items) ? parsed.items : null,
        tax: parseFloat(parsed.tax) || null,
        tip: parseFloat(parsed.tip) || null,
        receipt_number: parsed.receipt_number || parsed.transactionNumber || null,
        payment_method: parsed.payment_method || parsed.paymentMethod || null,
        card_last_four: parsed.card_last_four || parsed.cardLastFour || null,
        subtotal: parseFloat(parsed.subtotal) || null,
        vendor_address: parsed.vendor_address || parsed.vendorAddress || null,
        time: parsed.time || null,
        confidence: parseFloat(parsed.confidence) || 0.5
      }
    }

    return {
      merchant_name: null,
      amount: null,
      date: null,
      category: 'Other',
      items: null,
      tax: null,
      tip: null,
      receipt_number: null,
      payment_method: null,
      card_last_four: null,
      subtotal: null,
      vendor_address: null,
      time: null,
      confidence: 0.3
    }
  } catch (error) {
    console.error('OCR extraction failed:', error)
    return {
      merchant_name: null,
      amount: null,
      date: null,
      category: 'Other',
      items: null,
      tax: null,
      tip: null,
      receipt_number: null,
      payment_method: null,
      card_last_four: null,
      subtotal: null,
      vendor_address: null,
      time: null,
      confidence: 0
    }
  }
}

function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'application/pdf': '.pdf'
  }
  return extensions[mimeType] || ''
}

