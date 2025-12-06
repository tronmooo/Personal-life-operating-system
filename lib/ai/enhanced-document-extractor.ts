/**
 * Enhanced AI-powered Document Data Extraction
 * Extracts ALL possible fields with confidence scores
 */

import { OpenAIService } from '@/lib/external-apis/openai-service'
import { DocumentType } from './document-classifier'
import { parseAIResponse } from './json-parser'

export interface ExtractedField {
  value: any
  confidence: number
  fieldType: 'text' | 'date' | 'number' | 'currency' | 'phone' | 'email' | 'address'
  label: string
}

export interface EnhancedExtractedData {
  fields: Record<string, ExtractedField>
  documentTitle: string
  summary: string
  allDatesFound: string[]
  allNumbersFound: string[]
  allNamesFound: string[]
}

export class EnhancedDocumentExtractor {
  private openai: OpenAIService

  constructor() {
    this.openai = new OpenAIService()
  }

  /**
   * Extract ALL possible fields from document with confidence scores
   */
  async extractAllFields(text: string, documentType: DocumentType): Promise<EnhancedExtractedData> {
    console.log(`📊 Enhanced extraction for ${documentType}...`)

    const extractors: Record<DocumentType, (text: string) => Promise<EnhancedExtractedData>> = {
      receipt: this.extractReceiptFields.bind(this),
      insurance_card: this.extractInsuranceFields.bind(this),
      prescription: this.extractPrescriptionFields.bind(this),
      vehicle_registration: this.extractVehicleFields.bind(this),
      bill_invoice: this.extractBillFields.bind(this),
      medical_record: this.extractMedicalFields.bind(this),
      unknown: this.extractGenericFields.bind(this),
    }

    const extractor = extractors[documentType] || this.extractGenericFields.bind(this)
    return await extractor(text)
  }

  /**
   * Extract comprehensive insurance document fields
   */
  private async extractInsuranceFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `You are an expert at extracting ALL possible information from insurance documents. Extract EVERY field you can find.

Document text:
${text.substring(0, 3000)}

Extract ALL of these fields if present (with confidence 0-1):

POLICY INFORMATION:
- policyNumber (any policy/certificate number)
- policyType (Auto, Home, Health, Life, etc.)
- groupNumber (if group policy)
- memberId (member/subscriber ID)
- certificateNumber (if different from policy)

DATES (use ISO format YYYY-MM-DD):
- effectiveDate (start date)
- expirationDate (end date)
- renewalDate (renewal date)
- issueDate (when issued)
- birthDate (if beneficiary info present)

COMPANY/PROVIDER:
- provider (insurance company name)
- providerAddress (full address if present)
- providerPhone (phone number)
- providerWebsite (if present)
- agentName (insurance agent name)
- agentPhone (agent phone)
- agentEmail (agent email)

PERSONAL INFORMATION:
- subscriberName (policy holder name)
- beneficiaryName (covered person)
- dependentNames (array of dependent names)
- dateOfBirth (subscriber DOB)
- ssn (last 4 digits only if present)
- address (subscriber address)

COVERAGE DETAILS:
- coverageType (PPO, HMO, etc.)
- planName (plan name/tier)
- deductible (deductible amount)
- deductibleMet (amount already met)
- copay (copay amount)
- coinsurance (coinsurance percentage)
- outOfPocketMax (max out of pocket)
- outOfPocketMet (amount met)
- premium (monthly/annual premium)
- coverageAmount (total coverage limit)

FINANCIAL:
- annualPremium (yearly cost)
- monthlyPremium (monthly cost)
- claimLimit (per claim limit)
- lifetimeBenefit (lifetime max)

CONTACT INFORMATION:
- claimsPhone (claims department)
- customerServicePhone
- emergencyPhone
- providerSearchWebsite

ANY OTHER FIELDS found in the document

Response format (ONLY valid JSON):
{
  "fields": {
    "policyNumber": {
      "value": "ABC-123-456",
      "confidence": 0.95,
      "fieldType": "text",
      "label": "Policy Number"
    },
    "effectiveDate": {
      "value": "2024-01-01",
      "confidence": 0.90,
      "fieldType": "date",
      "label": "Effective Date"
    },
    // ... all other fields found
  },
  "documentTitle": "Blue Cross Blue Shield Health Insurance Card",
  "summary": "Health insurance policy for John Doe, active through 2025",
  "allDatesFound": ["2024-01-01", "2025-12-31"],
  "allNumbersFound": ["ABC-123-456", "555-1234"],
  "allNamesFound": ["John Doe", "Blue Cross"]
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert data extraction AI. Extract ALL possible fields with confidence scores. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from insurance document`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Insurance extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive receipt fields
   */
  private async extractReceiptFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `Extract ALL information from this receipt:

${text.substring(0, 3000)}

Extract EVERYTHING:

MERCHANT INFO:
- vendor (store/restaurant name)
- vendorAddress
- vendorPhone
- storeNumber
- cashierName
- registerId

TRANSACTION:
- date (ISO format)
- time (if present)
- transactionNumber
- confirmationNumber
- receiptNumber

FINANCIAL:
- subtotal
- tax
- total
- tip (if present)
- discounts (if any)
- rewards (points/savings)
- changeGiven

ITEMS:
- items (array of item names)
- itemPrices (array of prices)
- itemQuantities (array of quantities)

PAYMENT:
- paymentMethod (Cash, Credit, Debit, etc.)
- cardType (Visa, MC, etc.)
- cardLastFour
- authorizationCode

CATEGORY:
- category (Groceries, Dining, Gas, Shopping, Entertainment, Healthcare, Other)
- subcategory (if applicable)

ANY OTHER FIELDS

Response as JSON with fields object containing confidence scores.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract ALL receipt fields with confidence scores. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from receipt`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Receipt extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive prescription fields
   */
  private async extractPrescriptionFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `Extract ALL information from this prescription:

${text.substring(0, 3000)}

Extract EVERYTHING:

MEDICATION:
- medicationName (generic and brand names)
- dosage
- strength
- form (tablet, capsule, liquid, etc.)
- instructions (how to take)
- quantity
- refills (number remaining)
- daysSupply

PRESCRIBER:
- prescriberName (doctor name)
- prescriberPhone
- prescriberAddress
- prescriberNPI (if present)
- prescriberDEA (if present)

PHARMACY:
- pharmacyName
- pharmacyAddress
- pharmacyPhone
- pharmacistName (if present)

PATIENT:
- patientName
- patientDateOfBirth
- patientAddress

DATES:
- datePrescribed (written date)
- dateFilled
- expirationDate
- refillByDate

PRESCRIPTION INFO:
- rxNumber (prescription number)
- ndc (national drug code)
- lotNumber
- price
- copay
- insuranceCovered

ANY OTHER FIELDS

Response as JSON with fields object.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract ALL prescription fields with confidence scores. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from prescription`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Prescription extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive vehicle document fields
   */
  private async extractVehicleFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `Extract ALL information from this vehicle document:

${text.substring(0, 3000)}

Extract EVERYTHING:

VEHICLE:
- make
- model
- year
- color
- vin (vehicle identification number)
- licensePlate
- bodyType
- engineSize
- fuelType
- transmission

REGISTRATION:
- registrationNumber
- registrationState
- expirationDate
- renewalDate
- issueDate
- plateType
- vehicleClass

OWNER:
- ownerName
- ownerAddress
- coOwnerName (if applicable)
- lienholder (if applicable)

FEES & TAXES:
- registrationFee
- plateFee
- countyTax
- stateTax
- totalFees

INSPECTION:
- inspectionDate
- inspectionStation
- inspectionNumber
- emissionsTest (pass/fail)
- safetyInspection (pass/fail)

INSURANCE:
- insuranceCompany (if present)
- policyNumber (if present)
- insuranceExpiration

ODOMETER:
- odometerReading
- odometerDate

ANY OTHER FIELDS

Response as JSON with fields object.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract ALL vehicle document fields with confidence scores. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from vehicle document`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Vehicle extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive bill/invoice fields
   */
  private async extractBillFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `Extract ALL information from this bill/invoice:

${text.substring(0, 3000)}

Extract EVERYTHING:

COMPANY:
- company (biller name)
- companyAddress
- companyPhone
- companyWebsite
- customerServicePhone

ACCOUNT:
- accountNumber
- accountName
- accountType
- customerId

BILLING:
- billNumber
- invoiceNumber
- billDate
- dueDate
- servicePeriodStart
- servicePeriodEnd

AMOUNTS:
- previousBalance
- currentCharges
- payments (if any)
- adjustments
- totalDue
- amountDue
- minimumPayment
- latePaymentFee

BREAKDOWN:
- billType (Electricity, Water, Gas, Internet, Phone, Credit Card, etc.)
- serviceCharges
- usageCharges
- taxes
- fees
- discounts

USAGE (if utility):
- currentReading
- previousReading
- usage
- usageUnits (kWh, gallons, GB, etc.)

PAYMENT:
- paymentDueDate
- paymentMethods
- autopay (yes/no if mentioned)
- lateFeeAmount
- lateFeeDate

ANY OTHER FIELDS

Response as JSON with fields object.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract ALL bill/invoice fields with confidence scores. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from bill`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Bill extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive medical record fields
   */
  private async extractMedicalFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `Extract ALL information from this medical record:

${text.substring(0, 3000)}

Extract EVERYTHING:

PROVIDER:
- provider (doctor/facility name)
- providerAddress
- providerPhone
- facilityName
- departmentName

PATIENT:
- patientName
- patientDOB
- patientMRN (medical record number)
- patientPhone
- patientAddress

VISIT:
- visitDate
- visitTime
- visitType (checkup, followup, etc.)
- reasonForVisit
- chiefComplaint

VITALS:
- bloodPressure
- heartRate
- temperature
- weight
- height
- bmi
- oxygenSaturation

DIAGNOSIS:
- diagnosis
- diagnosisCodes (ICD codes)
- conditions
- symptoms

TESTS:
- testsOrdered (array)
- testResults (array)
- labResults (array)
- imagingResults

TREATMENT:
- prescriptionsMedications (array)
- procedures
- treatment Plan
- recommendations

FOLLOW UP:
- followUpDate
- followUpInstructions
- referrals

NOTES:
- providerNotes
- patientInstructions
- restrictions

ANY OTHER FIELDS

Response as JSON with fields object.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Extract ALL medical record fields with confidence scores. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from medical record`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Medical record extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract generic document fields
   */
  private async extractGenericFields(text: string): Promise<EnhancedExtractedData> {
    return {
      fields: {
        extractedText: {
          value: text.substring(0, 500),
          confidence: 1.0,
          fieldType: 'text',
          label: 'Extracted Text',
        },
      },
      documentTitle: 'Unknown Document',
      summary: 'Document type not recognized. Please review and categorize manually.',
      allDatesFound: [],
      allNumbersFound: [],
      allNamesFound: [],
    }
  }

  /**
   * Ensure response has required fields
   */
  private ensureValidResponse(data: any): EnhancedExtractedData {
    return {
      fields: data.fields || {},
      documentTitle: data.documentTitle || 'Document',
      summary: data.summary || 'Extracted data from document',
      allDatesFound: data.allDatesFound || [],
      allNumbersFound: data.allNumbersFound || [],
      allNamesFound: data.allNamesFound || [],
    }
  }

  /**
   * Get empty response for errors
   */
  private getEmptyResponse(): EnhancedExtractedData {
    return {
      fields: {},
      documentTitle: 'Error',
      summary: 'Failed to extract data. Please try again or enter manually.',
      allDatesFound: [],
      allNumbersFound: [],
      allNamesFound: [],
    }
  }
}




















