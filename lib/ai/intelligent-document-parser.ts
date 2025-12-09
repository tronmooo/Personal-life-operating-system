/**
 * Intelligent Document Parser
 * 
 * AI-powered document parsing that automatically:
 * - Extracts text from images/PDFs using OCR
 * - Identifies document type (bill, receipt, invoice, prescription, etc.)
 * - Extracts key fields (amount, date, vendor, etc.)
 * - Auto-categorizes into correct domain
 * - Populates form fields automatically
 * 
 * @example
 * ```tsx
 * const parser = new IntelligentDocumentParser()
 * const result = await parser.parseDocument(file)
 * // result contains: type, domain, extractedData, confidence
 * ```
 */

import OpenAI from 'openai'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Domain, DOMAIN_CONFIGS } from '@/types/domains'
import Tesseract from 'tesseract.js'

// Initialize AI client
const openai = new OpenAI({ 
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For client-side use
})

export type DocumentType =
  | 'receipt'
  | 'invoice'
  | 'bill'
  | 'prescription'
  | 'medical_record'
  | 'insurance_policy'
  | 'insurance_claim'
  | 'vehicle_registration'
  | 'service_record'
  | 'contract'
  | 'tax_document'
  | 'bank_statement'
  | 'pay_stub'
  | 'identification'
  | 'other'

export interface ParsedDocument {
  type: DocumentType
  confidence: number // 0-1
  suggestedDomain: Domain | null
  extractedData: {
    // Common fields
    title?: string
    date?: string
    amount?: number
    currency?: string
    vendor?: string
    description?: string
    
    // Receipt/Invoice specific
    items?: Array<{
      name: string
      quantity?: number
      price?: number
    }>
    tax?: number
    subtotal?: number
    total?: number
    paymentMethod?: string
    
    // Medical specific
    doctorName?: string
    facilityName?: string
    diagnosis?: string
    medications?: string[]
    dosage?: string
    
    // Insurance specific
    policyNumber?: string
    provider?: string
    coverage?: string
    claimNumber?: string
    
    // Vehicle specific
    make?: string
    model?: string
    year?: number
    vin?: string
    licensePlate?: string
    
    // Dates
    dueDate?: string
    expiryDate?: string
    issueDate?: string
    serviceDate?: string
    
    // Other
    [key: string]: any
  }
  rawText: string
  metadata?: Record<string, any>
}

export class IntelligentDocumentParser {
  private supabase = createClientComponentClient()

  /**
   * Main parsing method
   */
  async parseDocument(file: File): Promise<ParsedDocument> {
    try {
      // Step 1: Extract text from document
      const rawText = await this.extractText(file)

      if (!rawText || rawText.trim().length < 10) {
        throw new Error('Could not extract sufficient text from document')
      }

      // Step 2: Use AI to analyze and extract structured data
      const parsed = await this.aiParse(rawText, file.type)

      // Step 3: Post-process and validate
      const validated = this.validateAndEnhance(parsed, rawText)

      return validated
    } catch (error) {
      console.error('Document parsing error:', error)
      throw error
    }
  }

  /**
   * Extract text using OCR (for images) or direct extraction (for PDFs)
   */
  private async extractText(file: File): Promise<string> {
    const fileType = file.type

    if (fileType.startsWith('image/')) {
      // Use Tesseract OCR for images
      return await this.ocrImage(file)
    } else if (fileType === 'application/pdf') {
      // For PDFs, you'd use a PDF parser library
      // For now, we'll use OCR on the first page
      return await this.ocrImage(file)
    } else if (fileType.startsWith('text/')) {
      // Plain text file
      return await file.text()
    } else {
      throw new Error('Unsupported file type')
    }
  }

  /**
   * OCR using Tesseract.js
   */
  private async ocrImage(file: File): Promise<string> {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => console.log('OCR Progress:', m),
    })
    return text
  }

  /**
   * AI-powered parsing using GPT-4 Vision or GPT-4
   */
  private async aiParse(rawText: string, fileType: string): Promise<ParsedDocument> {
    const prompt = this.buildParsingPrompt(rawText)

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert document analyzer. Your job is to analyze documents and extract structured information.
            
            You must respond with ONLY a valid JSON object in this exact format:
            {
              "type": "receipt|invoice|bill|prescription|medical_record|insurance_policy|insurance_claim|vehicle_registration|service_record|contract|tax_document|bank_statement|pay_stub|identification|other",
              "confidence": 0.0-1.0,
              "suggestedDomain": "financial|health|insurance|vehicles|home|appliances|pets|legal|education|travel|career|relationships|digital|mindfulness|fitness|nutrition|routines|social|entertainment|hobbies|miscellaneous|null",
              "extractedData": {
                "title": "string",
                "date": "YYYY-MM-DD",
                "amount": number,
                "currency": "USD",
                "vendor": "string",
                "description": "string",
                ... (other relevant fields)
              }
            }
            
            Extract all relevant information you can find. Be precise with dates and amounts.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Low temperature for consistent extraction
      })

      const aiResponse = response.choices[0].message.content
      if (!aiResponse) {
        throw new Error('No response from AI')
      }

      const parsed = JSON.parse(aiResponse) as ParsedDocument
      parsed.rawText = rawText

      return parsed
    } catch (error) {
      console.error('AI parsing error:', error)
      
      // Fallback to rule-based parsing
      return this.ruleBasedParse(rawText)
    }
  }

  /**
   * Build parsing prompt
   */
  private buildParsingPrompt(rawText: string): string {
    return `Analyze this document and extract structured information:

${rawText}

Identify:
1. Document type (receipt, invoice, bill, prescription, etc.)
2. Suggested domain in LifeHub (financial, health, insurance, vehicles, etc.)
3. All relevant fields (date, amount, vendor, items, etc.)
4. Your confidence level (0-1)

Return the information as JSON.`
  }

  /**
   * Rule-based parsing fallback
   */
  private ruleBasedParse(rawText: string): ParsedDocument {
    const result: ParsedDocument = {
      type: 'other',
      confidence: 0.3,
      suggestedDomain: null,
      extractedData: {},
      rawText,
    }

    const lowerText = rawText.toLowerCase()

    // Detect document type by keywords
    if (lowerText.includes('receipt') || lowerText.includes('purchase')) {
      result.type = 'receipt'
      result.suggestedDomain = 'financial'
    } else if (lowerText.includes('invoice')) {
      result.type = 'invoice'
      result.suggestedDomain = 'financial'
    } else if (lowerText.includes('prescription') || lowerText.includes('rx')) {
      result.type = 'prescription'
      result.suggestedDomain = 'health'
    } else if (lowerText.includes('insurance') && lowerText.includes('policy')) {
      result.type = 'insurance_policy'
      result.suggestedDomain = 'insurance'
    } else if (lowerText.includes('insurance') && lowerText.includes('claim')) {
      result.type = 'insurance_claim'
      result.suggestedDomain = 'insurance'
    } else if (lowerText.includes('vehicle') || lowerText.includes('registration')) {
      result.type = 'vehicle_registration'
      result.suggestedDomain = 'vehicles'
    }

    // Extract date patterns
    const dateRegex = /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g
    const dates = rawText.match(dateRegex)
    if (dates && dates.length > 0) {
      result.extractedData.date = dates[0]
    }

    // Extract amount patterns
    const amountRegex = /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g
    const amounts = rawText.match(amountRegex)
    if (amounts && amounts.length > 0) {
      const amountStr = amounts[amounts.length - 1].replace(/[\$,]/g, '')
      result.extractedData.amount = parseFloat(amountStr)
      result.extractedData.currency = 'USD'
    }

    // Extract phone numbers (for vendor contact)
    const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g
    const phones = rawText.match(phoneRegex)
    if (phones && phones.length > 0) {
      result.extractedData.phone = phones[0]
    }

    // Extract email (for vendor contact)
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const emails = rawText.match(emailRegex)
    if (emails && emails.length > 0) {
      result.extractedData.email = emails[0]
    }

    // Generate title from first line or vendor name
    const lines = rawText.split('\n').filter(l => l.trim().length > 0)
    if (lines.length > 0) {
      result.extractedData.title = lines[0].trim().substring(0, 100)
    }

    result.confidence = 0.4 // Rule-based parsing has lower confidence

    return result
  }

  /**
   * Validate and enhance parsed data
   */
  private validateAndEnhance(parsed: ParsedDocument, rawText: string): ParsedDocument {
    // Ensure confidence is between 0 and 1
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence))

    // Validate domain
    if (parsed.suggestedDomain && !DOMAIN_CONFIGS[parsed.suggestedDomain]) {
      parsed.suggestedDomain = null
    }

    // Generate title if missing
    if (!parsed.extractedData.title) {
      parsed.extractedData.title = `${parsed.type} - ${new Date().toLocaleDateString()}`
    }

    // Format dates consistently
    if (parsed.extractedData.date) {
      try {
        const date = new Date(parsed.extractedData.date)
        if (!isNaN(date.getTime())) {
          parsed.extractedData.date = date.toISOString().split('T')[0]
        }
      } catch (e) {
        // Keep original if parsing fails
      }
    }

    // Add metadata
    parsed.metadata = {
      parsedAt: new Date().toISOString(),
      textLength: rawText.length,
      aiParsed: parsed.confidence > 0.5,
    }

    return parsed
  }

  /**
   * Auto-categorize and create domain entry
   */
  async autoCreateEntry(
    userId: string,
    parsed: ParsedDocument,
    documentId?: string
  ) {
    if (!parsed.suggestedDomain) {
      throw new Error('No domain suggested for this document')
    }

    const domain = parsed.suggestedDomain
    const metadata = {
      ...parsed.extractedData,
      documentType: parsed.type,
      parsingConfidence: parsed.confidence,
      documentId: documentId || null,
    }

    // Create domain entry
    const { data, error } = await this.supabase
      .from('domain_entries')
      .insert({
        user_id: userId,
        domain,
        title: parsed.extractedData.title || `${parsed.type} - ${new Date().toLocaleDateString()}`,
        description: parsed.extractedData.description || parsed.rawText.substring(0, 500),
        metadata,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Batch parse multiple documents
   */
  async parseMultiple(files: File[]): Promise<ParsedDocument[]> {
    const results: ParsedDocument[] = []
    
    for (const file of files) {
      try {
        const parsed = await this.parseDocument(file)
        results.push(parsed)
      } catch (error) {
        console.error(`Failed to parse ${file.name}:`, error)
        results.push({
          type: 'other',
          confidence: 0,
          suggestedDomain: null,
          extractedData: {
            title: file.name,
            error: String(error),
          },
          rawText: '',
        })
      }
    }

    return results
  }
}

/**
 * Helper to get document type icon
 */
export function getDocumentTypeIcon(type: DocumentType): string {
  const icons: Record<DocumentType, string> = {
    receipt: '🧾',
    invoice: '📄',
    bill: '💵',
    prescription: '💊',
    medical_record: '🏥',
    insurance_policy: '🛡️',
    insurance_claim: '📋',
    vehicle_registration: '🚗',
    service_record: '🔧',
    contract: '📑',
    tax_document: '📊',
    bank_statement: '🏦',
    pay_stub: '💰',
    identification: '🆔',
    other: '📄',
  }
  return icons[type] || '📄'
}

/**
 * Helper to get document type color
 */
export function getDocumentTypeColor(type: DocumentType): string {
  const colors: Record<DocumentType, string> = {
    receipt: 'blue',
    invoice: 'purple',
    bill: 'orange',
    prescription: 'green',
    medical_record: 'teal',
    insurance_policy: 'indigo',
    insurance_claim: 'pink',
    vehicle_registration: 'cyan',
    service_record: 'violet',
    contract: 'fuchsia',
    tax_document: 'rose',
    bank_statement: 'sky',
    pay_stub: 'emerald',
    identification: 'amber',
    other: 'gray',
  }
  return colors[type] || 'gray'
}


































