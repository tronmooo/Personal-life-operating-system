/**
 * Document Classification API
 * Uses AI to classify and extract data from scanned documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { 
  buildClassificationPrompt, 
  classifyByKeywords,
  getScanOption,
  SCAN_OPTIONS,
  type ScanCategory,
  type SmartScanResult
} from '@/lib/ai/smart-document-classifier'

// ============================================
// POST: Classify Document
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      extractedText,      // OCR text from document
      imageBase64,        // Optional: image for vision AI
      scanMode,           // Optional: user-selected scan mode
      useAI = true        // Whether to use AI classification
    } = body

    if (!extractedText && !imageBase64) {
      return NextResponse.json({ 
        error: 'Either extractedText or imageBase64 is required' 
      }, { status: 400 })
    }

    console.log('📄 [CLASSIFY] Starting document classification...')
    console.log(`📄 [CLASSIFY] Scan mode: ${scanMode || 'auto'}, Use AI: ${useAI}`)

    // If user explicitly selected a scan mode, use that
    if (scanMode && scanMode !== 'general') {
      const option = getScanOption(scanMode as ScanCategory)
      if (option) {
        console.log(`✅ [CLASSIFY] Using user-selected mode: ${scanMode}`)
        
        // Still extract data if we have text
        let extractedData: Record<string, any> = {}
        if (extractedText && useAI) {
          extractedData = await extractDataForCategory(scanMode as ScanCategory, extractedText)
        }

        return NextResponse.json({
          success: true,
          documentType: scanMode,
          confidence: 100,
          reasoning: `User selected: ${option.label}`,
          extractedData,
          suggestedDomain: option.targetDomain,
          suggestedAction: `Save to ${option.targetDomain}`,
          option,
          isUserSelected: true
        })
      }
    }

    // Auto-classification
    let result: Partial<SmartScanResult>

    if (useAI && extractedText) {
      // Try AI classification first
      result = await classifyWithAI(extractedText)
    } else if (extractedText) {
      // Fallback to keyword-based classification
      const keywordResult = classifyByKeywords(extractedText)
      result = {
        documentType: keywordResult.type,
        confidence: keywordResult.confidence,
        reasoning: 'Classified using keyword matching',
        option: keywordResult.option,
        suggestedDomain: keywordResult.option.targetDomain,
        suggestedAction: `Save to ${keywordResult.option.targetDomain}`
      }
    } else {
      // No text, use general
      const generalOption = SCAN_OPTIONS.find(o => o.id === 'general')!
      result = {
        documentType: 'general',
        confidence: 50,
        reasoning: 'No text extracted, using general classification',
        option: generalOption,
        suggestedDomain: 'mindfulness'
      }
    }

    console.log(`✅ [CLASSIFY] Result: ${result.documentType} (${result.confidence}% confidence)`)

    return NextResponse.json({
      success: true,
      ...result,
      isUserSelected: false
    })

  } catch (error: any) {
    console.error('❌ [CLASSIFY] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ============================================
// AI CLASSIFICATION
// ============================================

async function classifyWithAI(extractedText: string): Promise<Partial<SmartScanResult>> {
  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!geminiKey && !openaiKey) {
    console.log('⚠️ [CLASSIFY] No AI keys, falling back to keyword matching')
    const keywordResult = classifyByKeywords(extractedText)
    return {
      documentType: keywordResult.type,
      confidence: keywordResult.confidence,
      reasoning: 'Classified using keyword matching (no AI keys configured)',
      option: keywordResult.option,
      suggestedDomain: keywordResult.option.targetDomain
    }
  }

  const prompt = buildClassificationPrompt(extractedText)

  try {
    let aiResponse: string | null = null

    // Try Gemini first
    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
        console.log('✅ [CLASSIFY] Gemini response received')
      }
    }

    // Fallback to OpenAI
    if (!aiResponse && openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a document classification expert. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      })

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.choices?.[0]?.message?.content
        console.log('✅ [CLASSIFY] OpenAI response received')
      }
    }

    if (aiResponse) {
      // Parse AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        const option = getScanOption(parsed.documentType as ScanCategory)
        
        return {
          documentType: parsed.documentType || 'general',
          confidence: parsed.confidence || 75,
          reasoning: parsed.reasoning || 'AI classification',
          extractedData: parsed.extractedData || {},
          suggestedDomain: option?.targetDomain || parsed.suggestedDomain || 'mindfulness',
          suggestedAction: parsed.suggestedAction || 'Review and save',
          option: option || SCAN_OPTIONS.find(o => o.id === 'general')!
        }
      }
    }

    // Fallback if AI failed
    console.log('⚠️ [CLASSIFY] AI response parsing failed, using keywords')
    const keywordResult = classifyByKeywords(extractedText)
    return {
      documentType: keywordResult.type,
      confidence: keywordResult.confidence,
      reasoning: 'Classified using keyword matching (AI parsing failed)',
      option: keywordResult.option,
      suggestedDomain: keywordResult.option.targetDomain
    }

  } catch (error: any) {
    console.error('❌ [CLASSIFY] AI error:', error.message)
    const keywordResult = classifyByKeywords(extractedText)
    return {
      documentType: keywordResult.type,
      confidence: keywordResult.confidence,
      reasoning: 'Classified using keyword matching (AI error)',
      option: keywordResult.option,
      suggestedDomain: keywordResult.option.targetDomain
    }
  }
}

// ============================================
// DATA EXTRACTION FOR SPECIFIC CATEGORIES
// ============================================

async function extractDataForCategory(
  category: ScanCategory, 
  text: string
): Promise<Record<string, any>> {
  const option = getScanOption(category)
  if (!option || option.extractionFields.length === 0) {
    return {}
  }

  const geminiKey = process.env.GEMINI_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY

  if (!geminiKey && !openaiKey) {
    return {}
  }

  const prompt = `Extract the following fields from this ${option.label}:
Fields to extract: ${option.extractionFields.join(', ')}

Text:
"""
${text}
"""

Return JSON with the extracted fields. Use null for fields not found.
Only return valid JSON, nothing else.`

  try {
    let aiResponse: string | null = null

    if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
          })
        }
      )

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
      }
    }

    if (!aiResponse && openaiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 500
        })
      })

      if (response.ok) {
        const data = await response.json()
        aiResponse = data.choices?.[0]?.message?.content
      }
    }

    if (aiResponse) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    return {}
  } catch (error) {
    console.error('Error extracting data:', error)
    return {}
  }
}

// ============================================
// GET: List available document types
// ============================================

export async function GET() {
  return NextResponse.json({
    documentTypes: SCAN_OPTIONS.map(opt => ({
      id: opt.id,
      label: opt.label,
      shortLabel: opt.shortLabel,
      icon: opt.icon,
      description: opt.description,
      targetDomain: opt.targetDomain,
      extractionFields: opt.extractionFields
    })),
    count: SCAN_OPTIONS.length
  })
}

