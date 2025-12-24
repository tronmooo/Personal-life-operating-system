import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function extractWithGemini(base64Image: string, mimeType: string, prompt: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY
  if (!geminiKey) return null

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2000,
            topP: 0.95,
            topK: 40
          }
        }),
        signal: AbortSignal.timeout(30000)
      }
    )

    if (response.ok) {
      const data = await response.json()
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    }
    console.warn('⚠️ Gemini OCR failed:', response.status)
  } catch (error) {
    console.warn('⚠️ Gemini OCR request failed:', error)
  }
  return null
}

async function extractWithOpenAI(imageUrl: string, prompt: string): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }],
        max_tokens: 1500
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (response.ok) {
      const data = await response.json()
      return data.choices?.[0]?.message?.content || null
    }
  } catch (error) {
    console.warn('⚠️ OpenAI OCR request failed:', error)
  }
  return null
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string || 'receipt'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const mimeType = file.type || 'image/jpeg'
    const imageUrl = `data:${mimeType};base64,${base64Image}`

    const prompt = getPromptForDocumentType(documentType)

    // Try Gemini first (better for OCR), then OpenAI as fallback
    let extractedText = await extractWithGemini(base64Image, mimeType, prompt)
    let source = 'gemini'
    
    if (!extractedText) {
      extractedText = await extractWithOpenAI(imageUrl, prompt)
      source = 'openai'
    }

    if (!extractedText) {
      return NextResponse.json(
        { error: 'No AI API keys configured. Please set GEMINI_API_KEY or OPENAI_API_KEY.' },
        { status: 500 }
      )
    }
    
    // Try to parse JSON if the response is structured
    let extractedData = {}
    try {
      // Look for JSON in the response
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      }
    } catch (e) {
      // If parsing fails, return the raw text
      extractedData = { rawText: extractedText }
    }

    return NextResponse.json({
      text: extractedText,
      data: extractedData,
      source,
      success: true
    })
  } catch (error: any) {
    console.error('❌ Exception in POST /api/ai-tools/ocr:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process image' },
      { status: 500 }
    )
  }
}

function getPromptForDocumentType(documentType: string): string {
  const prompts: Record<string, string> = {
    receipt: `Extract all information from this receipt and return it as JSON with the following structure:
{
  "merchant_name": "store name",
  "amount": 0.00,
  "date": "YYYY-MM-DD",
  "category": "category (e.g., groceries, gas, dining)",
  "items": [{"name": "item", "price": 0.00}],
  "tax": 0.00,
  "tip": 0.00
}`,
    'w2': `Extract all information from this W-2 form and return it as JSON with the following structure:
{
  "employer_name": "",
  "employer_ein": "",
  "employee_name": "",
  "employee_ssn": "",
  "wages": 0.00,
  "federal_tax_withheld": 0.00,
  "social_security_wages": 0.00,
  "medicare_wages": 0.00,
  "year": 2024
}`,
    contract: `Analyze this contract and extract key information in JSON format:
{
  "contract_type": "",
  "parties": ["party 1", "party 2"],
  "effective_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "key_terms": ["term 1", "term 2"],
  "obligations": ["obligation 1"],
  "payment_terms": "",
  "risks": ["potential risk 1"]
}`,
    form: `Extract all form fields and their values from this document as JSON:
{
  "form_title": "",
  "fields": [
    {"label": "field name", "value": "extracted value"}
  ]
}`,
    document: `Extract the text content and key information from this document as JSON:
{
  "title": "",
  "date": "YYYY-MM-DD",
  "summary": "brief summary",
  "key_points": ["point 1", "point 2"],
  "full_text": "complete text content"
}`
  }

  return prompts[documentType] || prompts.document
}
