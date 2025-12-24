/**
 * AI-powered Document Classification
 * Uses OpenAI to classify documents and suggest actions
 */

import { OpenAIService } from '@/lib/external-apis/openai-service'
import { parseAIResponse } from './json-parser'

export type DocumentType =
  // Finance
  | 'receipt'
  | 'bill_invoice'
  | 'tax_document'
  | 'bank_statement'
  // Insurance
  | 'insurance_card'
  | 'insurance_policy'
  // Health
  | 'prescription'
  | 'medical_record'
  | 'vaccination_record'
  // Vehicles
  | 'vehicle_registration'
  | 'vehicle_title'
  // Legal / ID Documents
  | 'drivers_license'
  | 'passport'
  | 'visa'
  | 'green_card'
  | 'social_security_card'
  | 'birth_certificate'
  | 'marriage_certificate'
  | 'military_document'
  // Professional / Business
  | 'professional_license'
  | 'business_license'
  | 'certification'
  // Property / Home
  | 'property_deed'
  | 'lease_contract'
  | 'warranty'
  // Education
  | 'education_document'
  // Pets
  | 'pet_document'
  // Contracts
  | 'contract'
  // Unknown
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

FINANCE DOCUMENTS:
1. **receipt** - Shopping receipts, purchase confirmations → Domain: "Finance"
2. **bill_invoice** - Utility bills, invoices, statements → Domain: "Finance"
3. **tax_document** - W-2, 1099, tax returns, IRS forms → Domain: "Finance" (Look for: tax year, W-2, 1099, SSN, EIN, wages)
4. **bank_statement** - Bank/credit card statements → Domain: "Finance"

INSURANCE DOCUMENTS:
5. **insurance_card** - Insurance ID cards (health, auto, home, life) → Domain: "Insurance"
6. **insurance_policy** - Full insurance policy documents, declarations pages → Domain: "Insurance"

HEALTH DOCUMENTS:
7. **prescription** - Medication prescriptions, pharmacy labels → Domain: "Health" (has refill expiration!)
8. **medical_record** - Lab results, doctor's notes, medical reports → Domain: "Health"
9. **vaccination_record** - Immunization records, vaccine cards, COVID cards → Domain: "Health" (has dates!)

VEHICLE DOCUMENTS:
10. **vehicle_registration** - Vehicle registration documents → Domain: "Vehicles" (has expiration!)
11. **vehicle_title** - Vehicle titles, certificates of ownership → Domain: "Vehicles"

LEGAL / ID DOCUMENTS (ALL have expiration dates!):
12. **drivers_license** - Driver's license, state ID → Domain: "Legal" (Look for: DRIVER LICENSE, DL, CLASS, EXP, DOB)
13. **passport** - Passport, travel document → Domain: "Legal" (Look for: PASSPORT, nationality, expiry)
14. **visa** - Travel visas, work visas → Domain: "Legal" (Look for: VISA, entry date, valid until, permitted stay)
15. **green_card** - Permanent resident card, I-551 → Domain: "Legal" (Look for: PERMANENT RESIDENT, I-551, card expires)
16. **social_security_card** - Social Security card → Domain: "Legal" (Look for: SOCIAL SECURITY, SSN)
17. **birth_certificate** - Birth certificate → Domain: "Legal" (Look for: CERTIFICATE OF BIRTH, date of birth)
18. **marriage_certificate** - Marriage/divorce certificates → Domain: "Legal"
19. **military_document** - Military IDs, DD-214, service records → Domain: "Legal"

PROFESSIONAL / BUSINESS (ALL have expiration dates!):
20. **professional_license** - Medical, law, CPA, nursing licenses → Domain: "Legal" (Look for: LICENSE, BOARD, expiration)
21. **business_license** - Business permits, licenses → Domain: "Legal" (Look for: BUSINESS LICENSE, permit, valid until)
22. **certification** - Professional certifications, credentials → Domain: "Education" (has expiration!)

PROPERTY / HOME:
23. **property_deed** - Property deeds, titles, mortgage docs → Domain: "Home"
24. **lease_contract** - Rental/lease agreements → Domain: "Home" (has end date!)
25. **warranty** - Product warranties, guarantees → Domain: "Home" (has expiration!)

EDUCATION:
26. **education_document** - Diplomas, transcripts, degrees, certificates → Domain: "Education"

PETS:
27. **pet_document** - Pet licenses, vaccination records, microchip docs → Domain: "Pets" (has expiration!)

CONTRACTS:
28. **contract** - General contracts, agreements → Domain: "Legal" (may have end date!)

29. **unknown** - Cannot be classified → Domain: "Documents"

IMPORTANT: Look for expiration dates on ALL documents. Many documents expire:
- Licenses (driver's, professional, business): EXPIRE
- Passports, visas, green cards: EXPIRE  
- Registrations: EXPIRE
- Warranties: EXPIRE
- Prescriptions: Have refill limits
- Leases/contracts: Have end dates
- Vaccinations: May need boosters

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
      // Finance
      receipt: '🧾 Shopping Receipt',
      bill_invoice: '📄 Bill/Invoice',
      tax_document: '📊 Tax Document',
      bank_statement: '🏦 Bank Statement',
      // Insurance
      insurance_card: '🏥 Insurance Card',
      insurance_policy: '📋 Insurance Policy',
      // Health
      prescription: '💊 Prescription',
      medical_record: '🏥 Medical Record',
      vaccination_record: '💉 Vaccination Record',
      // Vehicles
      vehicle_registration: '🚗 Vehicle Registration',
      vehicle_title: '📜 Vehicle Title',
      // Legal / ID
      drivers_license: '🪪 Driver\'s License',
      passport: '🛂 Passport',
      visa: '🛫 Visa',
      green_card: '🟢 Green Card',
      social_security_card: '🔢 Social Security Card',
      birth_certificate: '👶 Birth Certificate',
      marriage_certificate: '💒 Marriage Certificate',
      military_document: '🎖️ Military Document',
      // Professional / Business
      professional_license: '📜 Professional License',
      business_license: '🏢 Business License',
      certification: '🏅 Certification',
      // Property / Home
      property_deed: '🏠 Property Deed',
      lease_contract: '📝 Lease Agreement',
      warranty: '🛡️ Warranty',
      // Education
      education_document: '🎓 Education Document',
      // Pets
      pet_document: '🐾 Pet Document',
      // Contracts
      contract: '📑 Contract',
      // Unknown
      unknown: '📄 Document',
    }

    return descriptions[type] || '📄 Document'
  }

  /**
   * Get suggested icon for document type
   */
  getTypeIcon(type: DocumentType): string {
    const icons: Record<DocumentType, string> = {
      // Finance
      receipt: '🧾',
      bill_invoice: '📄',
      tax_document: '📊',
      bank_statement: '🏦',
      // Insurance
      insurance_card: '🏥',
      insurance_policy: '📋',
      // Health
      prescription: '💊',
      medical_record: '🏥',
      vaccination_record: '💉',
      // Vehicles
      vehicle_registration: '🚗',
      vehicle_title: '📜',
      // Legal / ID
      drivers_license: '🪪',
      passport: '🛂',
      visa: '🛫',
      green_card: '🟢',
      social_security_card: '🔢',
      birth_certificate: '👶',
      marriage_certificate: '💒',
      military_document: '🎖️',
      // Professional / Business
      professional_license: '📜',
      business_license: '🏢',
      certification: '🏅',
      // Property / Home
      property_deed: '🏠',
      lease_contract: '📝',
      warranty: '🛡️',
      // Education
      education_document: '🎓',
      // Pets
      pet_document: '🐾',
      // Contracts
      contract: '📑',
      // Unknown
      unknown: '📄',
    }

    return icons[type] || '📄'
  }
}

