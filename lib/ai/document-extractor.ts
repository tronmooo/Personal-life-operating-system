/**
 * AI-powered Document Data Extraction
 * Extracts structured data from different document types
 */

import { OpenAIService } from '@/lib/external-apis/openai-service'
import { DocumentType } from './document-classifier'
import { parseAIResponse } from './json-parser'

export interface ExtractedData {
  [key: string]: any
}

export interface ReceiptData extends ExtractedData {
  vendor: string
  date: string
  total: number
  items: string[]
  tax?: number
  category?: string
}

export interface InsuranceCardData extends ExtractedData {
  policyNumber: string
  provider: string
  coverageType: string
  effectiveDate: string
  expirationDate: string
  memberId?: string
}

export interface PrescriptionData extends ExtractedData {
  medicationName: string
  dosage: string
  prescriber: string
  pharmacy?: string
  refills?: number
  dateFilled?: string
  expirationDate?: string
}

export interface VehicleRegistrationData extends ExtractedData {
  make: string
  model: string
  year: number
  vin: string
  licensePlate?: string
  expirationDate: string
}

export interface BillInvoiceData extends ExtractedData {
  company: string
  accountNumber: string
  amount: number
  dueDate: string
  billType: string
}

export interface MedicalRecordData extends ExtractedData {
  provider: string
  date: string
  diagnosis?: string
  notes?: string
  testResults?: string[]
}

export class DocumentExtractor {
  private openai: OpenAIService

  constructor() {
    this.openai = new OpenAIService()
  }

  /**
   * Extract structured data based on document type
   */
  async extractData(text: string, documentType: DocumentType): Promise<ExtractedData> {
    console.log(`📊 Extracting data for ${documentType}...`)

    const extractors: Record<DocumentType, (text: string) => Promise<ExtractedData>> = {
      receipt: this.extractReceiptData.bind(this),
      insurance_card: this.extractInsuranceData.bind(this),
      prescription: this.extractPrescriptionData.bind(this),
      vehicle_registration: this.extractVehicleData.bind(this),
      bill_invoice: this.extractBillData.bind(this),
      medical_record: this.extractMedicalData.bind(this),
      unknown: this.extractGenericData.bind(this),
    }

    const extractor = extractors[documentType] || this.extractGenericData.bind(this)
    return await extractor(text)
  }

  /**
   * Extract receipt data
   */
  private async extractReceiptData(text: string): Promise<ReceiptData> {
    const prompt = `Extract structured data from this receipt:

${text}

Extract:
- vendor (store/restaurant name)
- date (ISO format YYYY-MM-DD)
- total (numeric value)
- items (array of item names)
- tax (numeric value if found)
- category (Food, Gas, Shopping, Entertainment, or Other)

Respond ONLY with JSON:
{
  "vendor": "Target",
  "date": "2025-01-15",
  "total": 89.50,
  "items": ["Groceries", "Household items"],
  "tax": 7.16,
  "category": "Shopping"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted receipt data')
      return data
    } catch (error) {
      console.error('❌ Receipt extraction error:', error)
      return {} as ReceiptData
    }
  }

  /**
   * Extract insurance card data
   */
  private async extractInsuranceData(text: string): Promise<InsuranceCardData> {
    const prompt = `Extract structured data from this insurance card:

${text}

Extract:
- policyNumber
- provider (insurance company name)
- coverageType (Health, Auto, Home, Life)
- effectiveDate (ISO format)
- expirationDate (ISO format)
- memberId (if found)

Respond ONLY with JSON:
{
  "policyNumber": "ABC123456",
  "provider": "Blue Cross",
  "coverageType": "Health",
  "effectiveDate": "2024-01-01",
  "expirationDate": "2025-12-31",
  "memberId": "12345678"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted insurance data')
      return data
    } catch (error) {
      console.error('❌ Insurance extraction error:', error)
      return {} as InsuranceCardData
    }
  }

  /**
   * Extract prescription data
   */
  private async extractPrescriptionData(text: string): Promise<PrescriptionData> {
    const prompt = `Extract structured data from this prescription:

${text}

Extract:
- medicationName
- dosage (e.g., "500mg", "2 tablets")
- prescriber (doctor name)
- pharmacy (if found)
- refills (number, if found)
- dateFilled (ISO format, if found)
- expirationDate (ISO format, if found)

Respond ONLY with JSON:
{
  "medicationName": "Amoxicillin",
  "dosage": "500mg",
  "prescriber": "Dr. Smith",
  "pharmacy": "CVS Pharmacy",
  "refills": 2,
  "dateFilled": "2025-01-15",
  "expirationDate": "2026-01-15"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted prescription data')
      return data
    } catch (error) {
      console.error('❌ Prescription extraction error:', error)
      return {} as PrescriptionData
    }
  }

  /**
   * Extract vehicle registration data
   */
  private async extractVehicleData(text: string): Promise<VehicleRegistrationData> {
    const prompt = `Extract structured data from this vehicle document:

${text}

Extract:
- make
- model
- year (numeric)
- vin (Vehicle Identification Number)
- licensePlate (if found)
- expirationDate (ISO format)

Respond ONLY with JSON:
{
  "make": "Honda",
  "model": "Civic",
  "year": 2020,
  "vin": "1HGBH41JXMN109186",
  "licensePlate": "ABC123",
  "expirationDate": "2026-03-15"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted vehicle data')
      return data
    } catch (error) {
      console.error('❌ Vehicle extraction error:', error)
      return {} as VehicleRegistrationData
    }
  }

  /**
   * Extract bill/invoice data
   */
  private async extractBillData(text: string): Promise<BillInvoiceData> {
    const prompt = `Extract structured data from this bill/invoice:

${text}

Extract:
- company (biller name)
- accountNumber
- amount (numeric)
- dueDate (ISO format)
- billType (Electricity, Water, Gas, Internet, Phone, Credit Card, etc.)

Respond ONLY with JSON:
{
  "company": "Electric Company",
  "accountNumber": "1234567890",
  "amount": 150.00,
  "dueDate": "2025-02-01",
  "billType": "Electricity"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted bill data')
      return data
    } catch (error) {
      console.error('❌ Bill extraction error:', error)
      return {} as BillInvoiceData
    }
  }

  /**
   * Extract medical record data
   */
  private async extractMedicalData(text: string): Promise<MedicalRecordData> {
    const prompt = `Extract structured data from this medical record:

${text}

Extract:
- provider (doctor/facility name)
- date (ISO format)
- diagnosis (if found)
- notes (summary)
- testResults (array of test names/results if found)

Respond ONLY with JSON:
{
  "provider": "Dr. Johnson",
  "date": "2025-01-15",
  "diagnosis": "Annual checkup",
  "notes": "Patient in good health",
  "testResults": ["Blood pressure: 120/80", "Cholesterol: Normal"]
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted medical data')
      return data
    } catch (error) {
      console.error('❌ Medical extraction error:', error)
      return {} as MedicalRecordData
    }
  }

  /**
   * Extract generic document data
   */
  private async extractGenericData(text: string): Promise<ExtractedData> {
    return {
      extractedText: text.substring(0, 500),
      note: 'Document type not recognized. Manual entry required.',
    }
  }
}

