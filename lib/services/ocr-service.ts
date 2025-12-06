import Tesseract from 'tesseract.js'

// Dynamic PDF.js import to avoid SSR issues
let pdfjsLib: any = null

async function loadPdfJs() {
  if (typeof window === 'undefined') {
    throw new Error('PDF.js can only be loaded in browser')
  }
  
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }
  
  return pdfjsLib
}

export interface OCRResult {
  text: string
  confidence: number
  metadata: ExtractedMetadata
}

export interface ExtractedMetadata {
  dates: Date[]
  expirationDate?: Date
  renewalDate?: Date
  policyNumber?: string
  accountNumber?: string
  amount?: number
  currency?: string
  email?: string
  phone?: string
  name?: string
  address?: string
  [key: string]: any
}

/**
 * Main OCR Service - Extracts text from images and PDFs
 */
export class OCRService {
  /**
   * Extract text from an image file
   */
  static async extractTextFromImage(file: File): Promise<OCRResult> {
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      const text = result.data.text
      const confidence = result.data.confidence
      const metadata = this.parseText(text)

      return {
        text,
        confidence,
        metadata
      }
    } catch (error) {
      console.error('OCR Error:', error)
      throw new Error('Failed to extract text from image')
    }
  }

  /**
   * Extract text from a PDF file
   */
  static async extractTextFromPDF(file: File): Promise<OCRResult> {
    try {
      // Load PDF.js dynamically
      const pdfjs = await loadPdfJs()
      
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
      
      let fullText = ''
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        fullText += pageText + '\n'
      }

      const metadata = this.parseText(fullText)

      return {
        text: fullText,
        confidence: 95, // PDF text extraction is generally high confidence
        metadata
      }
    } catch (error) {
      console.error('PDF Extraction Error:', error)
      throw new Error('Failed to extract text from PDF')
    }
  }

  /**
   * Smart text parsing - extracts structured data from unstructured text
   */
  static parseText(text: string): ExtractedMetadata {
    const metadata: ExtractedMetadata = {
      dates: []
    }

    // Extract all dates
    const datePatterns = [
      /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g, // MM/DD/YYYY or DD/MM/YYYY
      /\b(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g, // YYYY-MM-DD
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi, // Month DD, YYYY
      /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi // DD Month YYYY
    ]

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const date = new Date(match)
          if (!isNaN(date.getTime())) {
            metadata.dates.push(date)
          }
        })
      }
    })

    // Find expiration/renewal dates
    const expirationPatterns = [
      /expir(?:ation|es|y)?\s+date[:\s]+([^\n]+)/i,
      /expir(?:ation|es|y)[:\s]+([^\n]+)/i,
      /valid\s+(?:until|thru|through)[:\s]+([^\n]+)/i,
      /end\s+date[:\s]+([^\n]+)/i
    ]

    for (const pattern of expirationPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const date = this.extractDateFromString(match[1])
        if (date) {
          metadata.expirationDate = date
          break
        }
      }
    }

    const renewalPatterns = [
      /renewal\s+date[:\s]+([^\n]+)/i,
      /renew(?:s|al)?\s+on[:\s]+([^\n]+)/i,
      /next\s+renewal[:\s]+([^\n]+)/i
    ]

    for (const pattern of renewalPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const date = this.extractDateFromString(match[1])
        if (date) {
          metadata.renewalDate = date
          break
        }
      }
    }

    // If no explicit expiration found but dates exist, use the latest future date
    if (!metadata.expirationDate && metadata.dates.length > 0) {
      const futureDates = metadata.dates.filter(d => d > new Date())
      if (futureDates.length > 0) {
        metadata.expirationDate = futureDates.sort((a, b) => a.getTime() - b.getTime())[0]
      }
    }

    // Extract policy/account numbers
    const policyPatterns = [
      /policy\s*(?:number|#|no\.?)[:\s]*([A-Z0-9\-]+)/i,
      /policy[:\s]*([A-Z0-9\-]{6,})/i
    ]

    for (const pattern of policyPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        metadata.policyNumber = match[1].trim()
        break
      }
    }

    const accountPatterns = [
      /account\s*(?:number|#|no\.?)[:\s]*([A-Z0-9\-]+)/i,
      /acct[:\s]*([A-Z0-9\-]{6,})/i
    ]

    for (const pattern of accountPatterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        metadata.accountNumber = match[1].trim()
        break
      }
    }

    // Extract amounts (currency)
    const amountPattern = /\$\s*([\d,]+\.?\d*)/g
    const amounts = text.match(amountPattern)
    if (amounts && amounts.length > 0) {
      // Get the largest amount (usually the most important)
      const numericAmounts = amounts.map(a => parseFloat(a.replace(/[$,]/g, '')))
      metadata.amount = Math.max(...numericAmounts)
      metadata.currency = 'USD'
    }

    // Extract email
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
    const emailMatch = text.match(emailPattern)
    if (emailMatch) {
      metadata.email = emailMatch[0]
    }

    // Extract phone
    const phonePattern = /\b(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/
    const phoneMatch = text.match(phonePattern)
    if (phoneMatch) {
      metadata.phone = phoneMatch[0]
    }

    return metadata
  }

  /**
   * Helper to extract date from a string
   */
  private static extractDateFromString(str: string): Date | null {
    const cleaned = str.trim().split(/[\n\r]/)[0] // Take first line
    const date = new Date(cleaned)
    return !isNaN(date.getTime()) ? date : null
  }

  /**
   * Main entry point - detects file type and routes to appropriate extractor
   */
  static async processDocument(file: File): Promise<OCRResult> {
    const fileType = file.type.toLowerCase()

    if (fileType === 'application/pdf') {
      return this.extractTextFromPDF(file)
    } else if (fileType.startsWith('image/')) {
      return this.extractTextFromImage(file)
    } else {
      throw new Error('Unsupported file type. Please upload PDF or image files.')
    }
  }

  /**
   * Analyze document type based on content
   */
  static analyzeDocumentType(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('insurance') && lowerText.includes('policy')) {
      return 'insurance_policy'
    }
    if (lowerText.includes('bill') || lowerText.includes('invoice')) {
      return 'bill'
    }
    if (lowerText.includes('statement') && lowerText.includes('balance')) {
      return 'financial_statement'
    }
    if (lowerText.includes('receipt')) {
      return 'receipt'
    }
    if (lowerText.includes('medical') || lowerText.includes('patient')) {
      return 'medical_record'
    }
    if (lowerText.includes('contract') || lowerText.includes('agreement')) {
      return 'contract'
    }
    if (lowerText.includes('warranty')) {
      return 'warranty'
    }
    
    return 'general'
  }
}







