/**
 * AI-powered Document Classification
 * Uses OpenAI to classify documents and suggest actions
 */

import { OpenAIService } from '@/lib/external-apis/openai-service'
import { parseAIResponse } from './json-parser'

export type DocumentType =
  | 'receipt'
  | 'insurance_card'
  | 'prescription'
  | 'vehicle_registration'
  | 'bill_invoice'
  | 'medical_record'
  | 'unknown'

export interface ClassificationResult {
  type: DocumentType
  confidence: number
  suggestedDomain: string
  suggestedAction: string
  reasoning: string
}

export class DocumentClassifier {
  private openai: OpenAIService

  constructor() {
    this.openai = new OpenAIService()
  }

  /**
   * Classify a document based on OCR text
   */
  async classifyDocument(extractedText: string): Promise<ClassificationResult> {
    console.log('🤖 Classifying document with AI...')

    const prompt = `You are a document classification expert. Analyze the following text extracted from a document and classify it.

Extracted Text:
"""
${extractedText.substring(0, 2000)}
"""

Classify this document into ONE of these types:
1. **receipt** - Shopping receipts, purchase confirmations → Domain: "Finance"
2. **insurance_card** - ANY insurance card (health, auto, home, life) → Domain: "Insurance" (ALWAYS use Insurance domain for ALL insurance cards)
3. **prescription** - Medication prescriptions or pharmacy labels → Domain: "Health"
4. **vehicle_registration** - Vehicle registration, title, or inspection documents → Domain: "Vehicles"
5. **bill_invoice** - Utility bills, invoices, statements → Domain: "Finance"
6. **medical_record** - Lab results, doctor's notes, medical reports → Domain: "Health"
7. **unknown** - Cannot be classified → Domain: "Documents"

IMPORTANT DOMAIN MAPPING:
- insurance_card (health/auto/home/life) → ALWAYS use "Insurance" domain
- receipt → "Finance"
- prescription → "Health"
- vehicle_registration → "Vehicles"
- bill_invoice → "Finance"
- medical_record → "Health"

Respond in JSON format:
{
  "type": "insurance_card",
  "confidence": 0.95,
  "suggestedDomain": "Insurance",
  "suggestedAction": "Add insurance policy to Insurance domain",
  "reasoning": "Contains policy number, provider, and coverage information"
}

IMPORTANT: Only respond with valid JSON, no additional text.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a document classification AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const result = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Document classified:', result.type)

      return {
        type: result.type || 'unknown',
        confidence: result.confidence || 0.5,
        suggestedDomain: result.suggestedDomain || 'Documents',
        suggestedAction: result.suggestedAction || 'Save document',
        reasoning: result.reasoning || 'Unable to determine',
      }
    } catch (error: any) {
      console.error('❌ Document classification error:', error)
      return {
        type: 'unknown',
        confidence: 0,
        suggestedDomain: 'Documents',
        suggestedAction: 'Save document',
        reasoning: 'Classification failed',
      }
    }
  }

  /**
   * Get a user-friendly description of the document type
   */
  getTypeDescription(type: DocumentType): string {
    const descriptions: Record<DocumentType, string> = {
      receipt: '🧾 Shopping Receipt',
      insurance_card: '🏥 Insurance Card',
      prescription: '💊 Prescription',
      vehicle_registration: '🚗 Vehicle Document',
      bill_invoice: '📄 Bill/Invoice',
      medical_record: '🏥 Medical Record',
      unknown: '📄 Document',
    }

    return descriptions[type] || '📄 Document'
  }

  /**
   * Get suggested icon for document type
   */
  getTypeIcon(type: DocumentType): string {
    const icons: Record<DocumentType, string> = {
      receipt: '🧾',
      insurance_card: '🏥',
      prescription: '💊',
      vehicle_registration: '🚗',
      bill_invoice: '📄',
      medical_record: '🏥',
      unknown: '📄',
    }

    return icons[type] || '📄'
  }
}

