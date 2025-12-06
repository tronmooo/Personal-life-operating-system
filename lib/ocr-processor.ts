/**
 * OCR Processing Utility
 * Extracts text from images and documents
 */

export interface OCRResult {
  text: string
  confidence: number
  language: string
}

export interface ExtractedMetadata {
  documentName?: string
  documentDescription?: string
  issueDate?: string // ISO date format YYYY-MM-DD
  expirationDate?: string // ISO date format YYYY-MM-DD
  documentType?: string
  documentSubtype?: string
  issuingOrganization?: string
  holderName?: string
  identificationNumbers?: string[]
  keyDates?: Array<{label: string, date: string}>
  additionalInfo?: string
  
  // Category-specific fields (Insurance)
  coverageAmount?: string
  premium?: string
  effectiveDate?: string
  
  // Category-specific fields (ID & Licenses)
  idType?: string
  
  // Category-specific fields (Property)
  address?: string
  parcelNumber?: string
  mortgageNumber?: string
  
  // Category-specific fields (Legal)
  partyA?: string
  partyB?: string
  caseNumberExt?: string
  
  // Category-specific fields (Medical)
  patientName?: string
  providerName?: string
  testDate?: string
  
  // Category-specific fields (Financial & Tax)
  taxYear?: string
  formType?: string
  
  // Category-specific fields (Vehicle)
  vin?: string
  plate?: string
  registrationDate?: string
  
  // Category-specific fields (Education)
  school?: string
  credential?: string
  graduationDate?: string
  
  // Category-specific fields (Estate Planning)
  attorney?: string
  instrumentType?: string
  signedDate?: string
}

/**
 * Process an image file and extract text using OCR
 * Uses Tesseract.js for client-side OCR processing
 */
export async function extractTextFromImage(file: File): Promise<OCRResult> {
  try {
    // Check if Tesseract is available
    if (typeof window === 'undefined') {
      throw new Error('OCR processing must run in browser')
    }

    // Dynamic import of Tesseract.js
    const Tesseract = await import('tesseract.js')
    
    const result = await Tesseract.recognize(
      file,
      'eng', // Language
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      }
    )

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      language: 'eng'
    }
  } catch (error) {
    console.error('OCR processing failed:', error)
    throw new Error('Failed to extract text from image')
  }
}

/**
 * Process a PDF file and extract text
 * For PDFs, we'll use PDF.js or convert to images first
 */
export async function extractTextFromPDF(file: File): Promise<OCRResult> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('PDF extraction must run in the browser environment')
    }

    const pdfjsLib: any = await import('pdfjs-dist')

    // Set the worker source to CDN
    if (pdfjsLib?.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, useWorkerFetch: false }).promise

    let extractedText = ''

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()

      const pageText = textContent.items
        .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ')

      extractedText += `${pageText}\n`
    }

    const cleanedText = extractedText.trim()

    return {
      text: cleanedText,
      confidence: cleanedText ? 0.95 : 0,
      language: 'eng'
    }
  } catch (error) {
    console.error('PDF processing failed:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Main function to process any document type
 */
export async function processDocument(file: File): Promise<OCRResult> {
  const fileType = file.type.toLowerCase()

  if (fileType.includes('pdf')) {
    return extractTextFromPDF(file)
  } else if (fileType.includes('image')) {
    return extractTextFromImage(file)
  } else {
    throw new Error('Unsupported file type. Please upload an image or PDF.')
  }
}

/**
 * Extract structured metadata from OCR text using AI
 * Extracts: Document Name, Description, and Issue Date
 */
export async function extractStructuredMetadata(ocrText: string): Promise<ExtractedMetadata> {
  try {
    const openaiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    
    if (!openaiKey) {
      console.warn('OpenAI API key not configured, skipping structured extraction')
      return {}
    }

    const prompt = `You are extracting metadata from a scanned document. Extract EVERY piece of information you can find.

Document Text:
"""
${ocrText.substring(0, 3000)} 
"""

Extract ALL of the following (include any you find, omit those you don't):

1. **documentName**: The main title/name of the document
   - Examples: "Auto Insurance Policy", "John Doe's Passport", "Property Lease Agreement", "Medical Record"

2. **documentDescription**: A detailed description of what this document is and what it contains
   - Include: document type, issuing organization, purpose, key details
   - Be thorough! Include names, addresses, policy numbers, account numbers if visible

3. **issueDate**: When was this document issued/created/effective? (YYYY-MM-DD format)
   - Look for: "Issue Date", "Effective Date", "Date of Issue", "Issued", "Created"

4. **expirationDate**: When does this expire? (YYYY-MM-DD format) 
   - Look for: "Expiration Date", "Expires", "Valid Until", "Expiry", "End Date"

5. **documentType**: Category of document
   - Examples: "Insurance", "Passport", "License", "Medical", "Legal", "Financial", "Lease"

6. **issuingOrganization**: Who issued this document?
   - Company name, government agency, hospital, etc.

7. **holderName**: Who is this document for?
   - Full name of the person/entity this document belongs to

8. **identificationNumbers**: Any ID numbers, policy numbers, account numbers, etc.
   - Format as array of strings

9. **keyDates**: Any other important dates mentioned
   - Format as array of objects: [{"label": "...", "date": "YYYY-MM-DD"}]

10. **additionalInfo**: Any other critical information (addresses, phone numbers, amounts, etc.)

11. **CATEGORY-SPECIFIC FIELDS** (extract if applicable):
    - Insurance: coverageAmount, premium, effectiveDate
    - ID/License: idType (Passport, Driver's License, etc.)
    - Property: address, parcelNumber, mortgageNumber
    - Legal: partyA, partyB, caseNumberExt
    - Medical: patientName, providerName, testDate
    - Financial/Tax: taxYear, formType (W-2, 1099, etc.)
    - Vehicle: vin, plate, registrationDate
    - Education: school, credential, graduationDate
    - Estate: attorney, instrumentType, signedDate

Return ONLY valid JSON (no markdown), include ALL fields you can extract:
{
  "documentName": "...",
  "documentDescription": "...",
  "issueDate": "YYYY-MM-DD",
  "expirationDate": "YYYY-MM-DD",
  "documentType": "...",
  "issuingOrganization": "...",
  "holderName": "...",
  "identificationNumbers": ["..."],
  "keyDates": [{"label": "...", "date": "..."}],
  "additionalInfo": "...",
  "coverageAmount": "...",
  "premium": "...",
  "effectiveDate": "YYYY-MM-DD",
  "idType": "...",
  "address": "...",
  "parcelNumber": "...",
  "mortgageNumber": "...",
  "partyA": "...",
  "partyB": "...",
  "caseNumberExt": "...",
  "patientName": "...",
  "providerName": "...",
  "testDate": "YYYY-MM-DD",
  "taxYear": "...",
  "formType": "...",
  "vin": "...",
  "plate": "...",
  "registrationDate": "YYYY-MM-DD",
  "school": "...",
  "credential": "...",
  "graduationDate": "YYYY-MM-DD",
  "attorney": "...",
  "instrumentType": "...",
  "signedDate": "YYYY-MM-DD"
}

Extract as much as you can. Be thorough!`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a document metadata extraction assistant. Extract structured information from OCR text and return ONLY valid JSON, no markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    // Parse JSON response (remove markdown code blocks if present)
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const extracted: ExtractedMetadata = JSON.parse(jsonStr)
    
    console.log('✨ Extracted metadata:', extracted)
    return extracted

  } catch (error) {
    console.error('AI extraction failed, falling back to regex:', error)
    // Fallback to regex-based extraction
    return extractMetadataRegex(ocrText)
  }
}

/**
 * Fallback regex-based metadata extraction
 */
function extractMetadataRegex(text: string): ExtractedMetadata {
  const metadata: ExtractedMetadata = {}
  
  // Extract policy/account numbers
  const policyMatch = text.match(/policy\s*(?:number|#|no\.?)[:\s]*([A-Z0-9\-]{6,})/i)
  if (policyMatch) {
    metadata.identificationNumbers = [policyMatch[1].trim()]
  }
  
  // Extract expiration date
  const expiryPatterns = [
    /exp(?:iration|iry|rative)?\s*date[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /expires?[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /valid\s*(?:through|until)[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i
  ]
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      metadata.expirationDate = match[1].replace(/\//g, '-')
      break
    }
  }
  
  // Extract effective/issue date
  const effectivePatterns = [
    /effective\s*date[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /issue\s*date[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i,
    /issued[:\s]*(\d{4}[-/]\d{2}[-/]\d{2})/i
  ]
  
  for (const pattern of effectivePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      metadata.issueDate = match[1].replace(/\//g, '-')
      metadata.effectiveDate = match[1].replace(/\//g, '-')
      break
    }
  }
  
  // Extract holder name (look for NAME: or HOLDER:)
  const nameMatch = text.match(/(?:holder|name|insured)[:\s]*([A-Z][A-Z\s]+(?:[A-Z][a-z]+)?)/i)
  if (nameMatch) {
    metadata.holderName = nameMatch[1].trim()
  }
  
  // Infer document type from keywords
  if (/insurance|policy/i.test(text)) {
    metadata.documentType = 'Insurance'
    if (/auto|vehicle|car/i.test(text)) {
      metadata.documentSubtype = 'Auto Insurance'
    } else if (/health|medical/i.test(text)) {
      metadata.documentSubtype = 'Health Insurance'
    } else if (/home|property/i.test(text)) {
      metadata.documentSubtype = 'Home Insurance'
    } else if (/life/i.test(text)) {
      metadata.documentSubtype = 'Life Insurance'
    }
  }
  
  // Extract issuing organization (look for company names)
  const orgMatch = text.match(/(?:company|carrier|provider|insurer)[:\s]*([A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp)?)/i)
  if (orgMatch) {
    metadata.issuingOrganization = orgMatch[1].trim()
  }
  
  // Set document name
  if (metadata.documentType) {
    metadata.documentName = metadata.documentSubtype || metadata.documentType
  }
  
  console.log('📝 Regex extracted metadata:', metadata)
  return metadata
}

/**
 * Save extracted text to document metadata
 * NOTE: This function is DEPRECATED. 
 * Instead, save OCR results directly to document metadata via DataProvider:
 * 
 * await updateData(domain, documentId, {
 *   metadata: {
 *     ...existingMetadata,
 *     ocrText: ocrResult.text,
 *     ocrConfidence: ocrResult.confidence,
 *     ocrExtractedAt: new Date().toISOString()
 *   }
 * })
 * 
 * @deprecated Use DataProvider updateData() instead
 */
export function saveExtractedText(documentId: string, ocrResult: OCRResult) {
  console.warn('saveExtractedText is deprecated. Save OCR results to document metadata via DataProvider.')
  // No-op - calling code should use DataProvider
}

/**
 * Retrieve extracted text for a document
 * NOTE: This function is DEPRECATED.
 * Instead, read OCR text from document metadata via DataProvider:
 * 
 * const doc = getData(domain).find(d => d.id === documentId)
 * const ocrText = doc?.metadata?.ocrText
 * 
 * @deprecated Use DataProvider getData() instead
 */
export function getExtractedText(documentId: string): string | null {
  console.warn('getExtractedText is deprecated. Read OCR text from document metadata via DataProvider.')
  return null
}

