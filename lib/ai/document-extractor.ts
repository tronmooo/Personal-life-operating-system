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

export interface DriversLicenseData extends ExtractedData {
  licenseNumber: string
  fullName: string
  dateOfBirth: string
  expirationDate: string
  issueDate?: string
  address?: string
  class?: string
  restrictions?: string
  endorsements?: string
  state?: string
  sex?: string
  height?: string
  eyeColor?: string
}

export interface PassportData extends ExtractedData {
  passportNumber: string
  fullName: string
  nationality: string
  dateOfBirth: string
  expirationDate: string
  issueDate?: string
  placeOfBirth?: string
  sex?: string
}

// Additional document type interfaces
export interface VisaData extends ExtractedData {
  visaNumber: string
  visaType: string
  fullName: string
  nationality: string
  validFrom: string
  validUntil: string
  entries: string // Single, Multiple
  issuingCountry?: string
}

export interface GreenCardData extends ExtractedData {
  uscisNumber: string
  fullName: string
  dateOfBirth: string
  countryOfBirth: string
  cardExpiresDate: string
  residentSince?: string
  category?: string
}

export interface TaxDocumentData extends ExtractedData {
  formType: string // W-2, 1099, etc.
  taxYear: string
  employerName?: string
  employerEIN?: string
  employeeName?: string
  employeeSSN?: string // last 4 only
  wages?: number
  taxWithheld?: number
}

export interface ProfessionalLicenseData extends ExtractedData {
  licenseNumber: string
  licenseType: string // Medical, Law, CPA, etc.
  holderName: string
  issuingBoard: string
  issueDate: string
  expirationDate: string
  state?: string
  specialties?: string[]
}

export interface WarrantyData extends ExtractedData {
  productName: string
  manufacturer: string
  purchaseDate: string
  expirationDate: string
  warrantyType: string // Limited, Extended, etc.
  serialNumber?: string
  modelNumber?: string
  coverageDetails?: string
}

export interface LeaseContractData extends ExtractedData {
  propertyAddress: string
  landlordName: string
  tenantName: string
  startDate: string
  endDate: string
  monthlyRent: number
  securityDeposit?: number
  leaseTermMonths?: number
}

export interface VaccinationData extends ExtractedData {
  vaccineName: string
  dateAdministered: string
  doseNumber?: string
  lotNumber?: string
  administeredBy?: string
  location?: string
  nextDoseDate?: string
}

export interface PetDocumentData extends ExtractedData {
  petName: string
  species: string
  breed?: string
  licenseNumber?: string
  expirationDate?: string
  vaccinationDate?: string
  rabiesTagNumber?: string
  microchipNumber?: string
  veterinarian?: string
}

export interface CertificationData extends ExtractedData {
  certificationName: string
  holderName: string
  issuingOrganization: string
  issueDate: string
  expirationDate?: string
  certificationNumber?: string
  credentialId?: string
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
      // Finance
      receipt: this.extractReceiptData.bind(this),
      bill_invoice: this.extractBillData.bind(this),
      tax_document: this.extractTaxDocumentData.bind(this),
      bank_statement: (text) => this.extractUniversalData(text, 'bank_statement'),
      // Insurance
      insurance_card: this.extractInsuranceData.bind(this),
      insurance_policy: (text) => this.extractUniversalData(text, 'insurance_policy'),
      // Health
      prescription: this.extractPrescriptionData.bind(this),
      medical_record: this.extractMedicalData.bind(this),
      vaccination_record: this.extractVaccinationData.bind(this),
      // Vehicles
      vehicle_registration: this.extractVehicleData.bind(this),
      vehicle_title: (text) => this.extractUniversalData(text, 'vehicle_title'),
      // Legal / ID Documents
      drivers_license: this.extractDriversLicenseData.bind(this),
      passport: this.extractPassportData.bind(this),
      visa: this.extractVisaData.bind(this),
      green_card: this.extractGreenCardData.bind(this),
      social_security_card: (text) => this.extractUniversalData(text, 'social_security_card'),
      birth_certificate: (text) => this.extractUniversalData(text, 'birth_certificate'),
      marriage_certificate: (text) => this.extractUniversalData(text, 'marriage_certificate'),
      military_document: (text) => this.extractUniversalData(text, 'military_document'),
      // Professional / Business
      professional_license: this.extractProfessionalLicenseData.bind(this),
      business_license: (text) => this.extractUniversalData(text, 'business_license'),
      certification: this.extractCertificationData.bind(this),
      // Property / Home
      property_deed: (text) => this.extractUniversalData(text, 'property_deed'),
      lease_contract: this.extractLeaseContractData.bind(this),
      warranty: this.extractWarrantyData.bind(this),
      // Education
      education_document: (text) => this.extractUniversalData(text, 'education_document'),
      // Pets
      pet_document: this.extractPetDocumentData.bind(this),
      // Contracts
      contract: (text) => this.extractUniversalData(text, 'contract'),
      // Unknown
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
   * Extract driver's license data
   */
  private async extractDriversLicenseData(text: string): Promise<DriversLicenseData> {
    const prompt = `Extract ALL data from this driver's license. Pay special attention to dates.

${text}

IMPORTANT DATE FORMATS on driver's licenses:
- US licenses often show dates as: MM/DD/YYYY, MM-DD-YYYY, or MMDDYYYY
- Some show: EXP 01/15/2028, or 4d. EXP 01-15-28
- DOB might be labeled as: DOB, DATE OF BIRTH, 4b, BORN
- Expiration might be labeled as: EXP, EXPIRES, EXPIRATION, 4d, VALID UNTIL

Extract:
- licenseNumber (DL number, often starts with state letter or has specific format)
- fullName (full legal name)
- dateOfBirth (ISO format YYYY-MM-DD) - REQUIRED
- expirationDate (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- issueDate (ISO format YYYY-MM-DD, when license was issued)
- address (full address if visible)
- class (license class: A, B, C, D, M, etc.)
- restrictions (any restrictions like "corrective lenses")
- endorsements (motorcycle, CDL, etc.)
- state (issuing state)
- sex (M/F)
- height (e.g., "5-10", "5'10\"")
- eyeColor (BRN, BLU, GRN, etc.)

For dates, convert any format to ISO YYYY-MM-DD:
- 01/15/28 → 2028-01-15 (assume 2000s for 2-digit years)
- 01-15-2028 → 2028-01-15
- JAN 15 2028 → 2028-01-15

Respond ONLY with JSON:
{
  "licenseNumber": "D1234567",
  "fullName": "JOHN DOE",
  "dateOfBirth": "1990-05-15",
  "expirationDate": "2028-05-15",
  "issueDate": "2020-05-15",
  "address": "123 MAIN ST, ANYTOWN, CA 90210",
  "class": "C",
  "restrictions": "CORRECTIVE LENSES",
  "endorsements": "M",
  "state": "CA",
  "sex": "M",
  "height": "5-10",
  "eyeColor": "BRN"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI specializing in driver\'s licenses. Extract ALL fields accurately, especially dates. Convert all dates to ISO YYYY-MM-DD format. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for accurate extraction
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted driver\'s license data:', data)
      return data
    } catch (error) {
      console.error('❌ Driver\'s license extraction error:', error)
      return {} as DriversLicenseData
    }
  }

  /**
   * Extract passport data
   */
  private async extractPassportData(text: string): Promise<PassportData> {
    const prompt = `Extract ALL data from this passport document:

${text}

Extract:
- passportNumber (passport number)
- fullName (full name as shown)
- nationality (country of citizenship)
- dateOfBirth (ISO format YYYY-MM-DD)
- expirationDate (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- issueDate (ISO format YYYY-MM-DD)
- placeOfBirth (city/country of birth)
- sex (M/F)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON:
{
  "passportNumber": "123456789",
  "fullName": "JOHN DOE",
  "nationality": "UNITED STATES",
  "dateOfBirth": "1990-05-15",
  "expirationDate": "2030-05-15",
  "issueDate": "2020-05-15",
  "placeOfBirth": "NEW YORK, USA",
  "sex": "M"
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction AI specializing in passport documents. Extract ALL fields accurately, especially expiration dates. Convert all dates to ISO YYYY-MM-DD format. Always respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted passport data:', data)
      return data
    } catch (error) {
      console.error('❌ Passport extraction error:', error)
      return {} as PassportData
    }
  }

  /**
   * Extract visa data
   */
  private async extractVisaData(text: string): Promise<VisaData> {
    const prompt = `Extract ALL data from this visa document:

${text}

Extract:
- visaNumber
- visaType (Tourist, Work, Student, etc.)
- fullName
- nationality
- validFrom (ISO format YYYY-MM-DD) - REQUIRED
- validUntil (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- entries (Single, Multiple, Unlimited)
- issuingCountry

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted visa data')
      return data
    } catch (error) {
      console.error('❌ Visa extraction error:', error)
      return {} as VisaData
    }
  }

  /**
   * Extract green card data
   */
  private async extractGreenCardData(text: string): Promise<GreenCardData> {
    const prompt = `Extract ALL data from this green card / permanent resident card:

${text}

Extract:
- uscisNumber (USCIS#)
- fullName
- dateOfBirth (ISO format YYYY-MM-DD)
- countryOfBirth
- cardExpiresDate (ISO format YYYY-MM-DD) - REQUIRED, look for "CARD EXPIRES" 
- residentSince (ISO format YYYY-MM-DD)
- category (employment-based, family-based, etc.)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted green card data')
      return data
    } catch (error) {
      console.error('❌ Green card extraction error:', error)
      return {} as GreenCardData
    }
  }

  /**
   * Extract tax document data
   */
  private async extractTaxDocumentData(text: string): Promise<TaxDocumentData> {
    const prompt = `Extract ALL data from this tax document:

${text}

Extract:
- formType (W-2, 1099-MISC, 1099-INT, 1040, etc.)
- taxYear (YYYY format)
- employerName
- employerEIN (EIN number)
- employeeName
- employeeSSN (last 4 digits only for privacy)
- wages (total wages/income)
- taxWithheld (federal tax withheld)

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields from tax documents. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted tax document data')
      return data
    } catch (error) {
      console.error('❌ Tax document extraction error:', error)
      return {} as TaxDocumentData
    }
  }

  /**
   * Extract professional license data
   */
  private async extractProfessionalLicenseData(text: string): Promise<ProfessionalLicenseData> {
    const prompt = `Extract ALL data from this professional license:

${text}

Extract:
- licenseNumber
- licenseType (Medical, Law, CPA, Nursing, Real Estate, etc.)
- holderName
- issuingBoard (State Board of Medicine, Bar Association, etc.)
- issueDate (ISO format YYYY-MM-DD)
- expirationDate (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- state
- specialties (array of specialties if applicable)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted professional license data')
      return data
    } catch (error) {
      console.error('❌ Professional license extraction error:', error)
      return {} as ProfessionalLicenseData
    }
  }

  /**
   * Extract warranty data
   */
  private async extractWarrantyData(text: string): Promise<WarrantyData> {
    const prompt = `Extract ALL data from this warranty document:

${text}

Extract:
- productName
- manufacturer
- purchaseDate (ISO format YYYY-MM-DD)
- expirationDate (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- warrantyType (Limited, Extended, Lifetime, etc.)
- serialNumber
- modelNumber
- coverageDetails (what's covered)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted warranty data')
      return data
    } catch (error) {
      console.error('❌ Warranty extraction error:', error)
      return {} as WarrantyData
    }
  }

  /**
   * Extract lease/contract data
   */
  private async extractLeaseContractData(text: string): Promise<LeaseContractData> {
    const prompt = `Extract ALL data from this lease/rental agreement:

${text}

Extract:
- propertyAddress
- landlordName
- tenantName
- startDate (ISO format YYYY-MM-DD)
- endDate (ISO format YYYY-MM-DD) - REQUIRED, this is critical
- monthlyRent (numeric)
- securityDeposit (numeric)
- leaseTermMonths (number of months)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially end dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted lease contract data')
      return data
    } catch (error) {
      console.error('❌ Lease contract extraction error:', error)
      return {} as LeaseContractData
    }
  }

  /**
   * Extract vaccination record data
   */
  private async extractVaccinationData(text: string): Promise<VaccinationData> {
    const prompt = `Extract ALL data from this vaccination/immunization record:

${text}

Extract:
- vaccineName (COVID-19, Flu, MMR, Tetanus, etc.)
- dateAdministered (ISO format YYYY-MM-DD)
- doseNumber (1st, 2nd, Booster, etc.)
- lotNumber
- administeredBy (provider/facility name)
- location
- nextDoseDate (ISO format YYYY-MM-DD if applicable)

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted vaccination data')
      return data
    } catch (error) {
      console.error('❌ Vaccination extraction error:', error)
      return {} as VaccinationData
    }
  }

  /**
   * Extract pet document data
   */
  private async extractPetDocumentData(text: string): Promise<PetDocumentData> {
    const prompt = `Extract ALL data from this pet document:

${text}

Extract:
- petName
- species (Dog, Cat, etc.)
- breed
- licenseNumber
- expirationDate (ISO format YYYY-MM-DD) - look for license expiration
- vaccinationDate (ISO format YYYY-MM-DD) - rabies/vaccination date
- rabiesTagNumber
- microchipNumber
- veterinarian

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted pet document data')
      return data
    } catch (error) {
      console.error('❌ Pet document extraction error:', error)
      return {} as PetDocumentData
    }
  }

  /**
   * Extract certification data
   */
  private async extractCertificationData(text: string): Promise<CertificationData> {
    const prompt = `Extract ALL data from this certification/credential:

${text}

Extract:
- certificationName (CPR, PMP, AWS, etc.)
- holderName
- issuingOrganization
- issueDate (ISO format YYYY-MM-DD)
- expirationDate (ISO format YYYY-MM-DD) - REQUIRED if certification expires
- certificationNumber
- credentialId

Convert any date format to ISO YYYY-MM-DD.

Respond ONLY with JSON.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially expiration dates. Convert dates to ISO format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log('✅ Extracted certification data')
      return data
    } catch (error) {
      console.error('❌ Certification extraction error:', error)
      return {} as CertificationData
    }
  }

  /**
   * Universal data extractor for document types without specialized extractors
   */
  private async extractUniversalData(text: string, documentType: string): Promise<ExtractedData> {
    const documentPrompts: Record<string, string> = {
      bank_statement: `Extract: accountNumber, bankName, statementDate, startDate, endDate, beginningBalance, endingBalance, totalDeposits, totalWithdrawals`,
      insurance_policy: `Extract: policyNumber, provider, policyType, effectiveDate, expirationDate, coverageAmount, premium, deductible, holderName`,
      vehicle_title: `Extract: titleNumber, vin, make, model, year, ownerName, issueDate, lienholder`,
      social_security_card: `Extract: fullName, socialSecurityNumber (last 4 only)`,
      birth_certificate: `Extract: fullName, dateOfBirth, placeOfBirth, certificateNumber, parentNames, dateIssued`,
      marriage_certificate: `Extract: spouse1Name, spouse2Name, marriageDate, location, certificateNumber, dateIssued`,
      military_document: `Extract: serviceMemberName, serviceNumber, branch, rank, dateOfService, dischargeDate, dischargeType`,
      business_license: `Extract: businessName, licenseNumber, licenseType, issueDate, expirationDate, state, businessAddress`,
      property_deed: `Extract: propertyAddress, ownerName, deedNumber, recordedDate, parcelNumber, legalDescription`,
      education_document: `Extract: holderName, institutionName, degreeType, fieldOfStudy, graduationDate, honors`,
      contract: `Extract: partyA, partyB, contractType, effectiveDate, endDate, keyTerms`,
    }

    const fieldsToExtract = documentPrompts[documentType] || 'Extract all relevant fields including any dates, numbers, and names'

    const prompt = `Extract ALL data from this ${documentType.replace(/_/g, ' ')}:

${text}

${fieldsToExtract}

IMPORTANT: 
- Convert ALL dates to ISO format YYYY-MM-DD
- Look for ANY expiration dates, end dates, or renewal dates
- Include issue dates, effective dates, and start dates

Respond ONLY with valid JSON containing all extracted fields.`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data extraction AI. Extract ALL fields, especially any dates. Convert dates to ISO YYYY-MM-DD format. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
      })
      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${documentType} data`)
      return data
    } catch (error) {
      console.error(`❌ ${documentType} extraction error:`, error)
      return {}
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

