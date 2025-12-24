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
      // Finance
      receipt: this.extractReceiptFields.bind(this),
      bill_invoice: this.extractBillFields.bind(this),
      tax_document: (text) => this.extractUniversalEnhancedFields(text, 'tax_document'),
      bank_statement: (text) => this.extractUniversalEnhancedFields(text, 'bank_statement'),
      // Insurance
      insurance_card: this.extractInsuranceFields.bind(this),
      insurance_policy: (text) => this.extractUniversalEnhancedFields(text, 'insurance_policy'),
      // Health
      prescription: this.extractPrescriptionFields.bind(this),
      medical_record: this.extractMedicalFields.bind(this),
      vaccination_record: (text) => this.extractUniversalEnhancedFields(text, 'vaccination_record'),
      // Vehicles
      vehicle_registration: this.extractVehicleFields.bind(this),
      vehicle_title: (text) => this.extractUniversalEnhancedFields(text, 'vehicle_title'),
      // Legal / ID Documents
      drivers_license: this.extractDriversLicenseFields.bind(this),
      passport: this.extractPassportFields.bind(this),
      visa: (text) => this.extractUniversalEnhancedFields(text, 'visa'),
      green_card: (text) => this.extractUniversalEnhancedFields(text, 'green_card'),
      social_security_card: (text) => this.extractUniversalEnhancedFields(text, 'social_security_card'),
      birth_certificate: (text) => this.extractUniversalEnhancedFields(text, 'birth_certificate'),
      marriage_certificate: (text) => this.extractUniversalEnhancedFields(text, 'marriage_certificate'),
      military_document: (text) => this.extractUniversalEnhancedFields(text, 'military_document'),
      // Professional / Business
      professional_license: (text) => this.extractUniversalEnhancedFields(text, 'professional_license'),
      business_license: (text) => this.extractUniversalEnhancedFields(text, 'business_license'),
      certification: (text) => this.extractUniversalEnhancedFields(text, 'certification'),
      // Property / Home
      property_deed: (text) => this.extractUniversalEnhancedFields(text, 'property_deed'),
      lease_contract: (text) => this.extractUniversalEnhancedFields(text, 'lease_contract'),
      warranty: (text) => this.extractUniversalEnhancedFields(text, 'warranty'),
      // Education
      education_document: (text) => this.extractUniversalEnhancedFields(text, 'education_document'),
      // Pets
      pet_document: (text) => this.extractUniversalEnhancedFields(text, 'pet_document'),
      // Contracts
      contract: (text) => this.extractUniversalEnhancedFields(text, 'contract'),
      // Unknown
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
   * Extract comprehensive driver's license fields
   */
  private async extractDriversLicenseFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `You are an expert at extracting ALL possible information from driver's licenses. Extract EVERY field you can find.

CRITICAL: Pay special attention to dates. Driver's licenses show dates in various formats:
- MM/DD/YYYY (most common in US)
- MM-DD-YYYY
- MMDDYYYY (no separators)
- MM/DD/YY (2-digit year, assume 2000s)
- Labeled as: EXP, EXPIRES, 4d, DOB, DATE OF BIRTH, 4b, ISS, ISSUED, 4a

Document text:
${text.substring(0, 3000)}

Extract ALL of these fields if present (with confidence 0-1):

IDENTIFICATION:
- licenseNumber (driver's license number - often alphanumeric)
- documentNumber (if different from license number)
- state (issuing state abbreviation: CA, TX, NY, etc.)
- country (if not US)

PERSONAL INFORMATION:
- fullName (full legal name)
- firstName
- lastName
- middleName
- suffix (Jr, Sr, III, etc.)
- dateOfBirth (YYYY-MM-DD format) - CRITICAL, look for DOB, 4b, BORN
- sex (M/F)
- height (e.g., "5-10" or "5'10\"")
- weight (if present)
- eyeColor (BRN, BLU, GRN, HAZ, etc.)
- hairColor (if present)

ADDRESS:
- address (full street address)
- city
- stateAddress (residence state)
- zipCode

DATES (ALL in YYYY-MM-DD format):
- expirationDate - CRITICAL, look for: EXP, EXPIRES, 4d, VALID UNTIL
- issueDate - look for: ISS, ISSUED, 4a
- renewalDate (if shown)

LICENSE DETAILS:
- class (A, B, C, D, M, etc.)
- restrictions (corrective lenses, daylight only, etc.)
- endorsements (motorcycle M, commercial CDL, etc.)
- veteranStatus (if marked as veteran)
- organDonor (if organ donor)
- realId (if REAL ID compliant, star symbol)

Response format (ONLY valid JSON):
{
  "fields": {
    "licenseNumber": {
      "value": "D1234567",
      "confidence": 0.95,
      "fieldType": "text",
      "label": "License Number"
    },
    "expirationDate": {
      "value": "2028-05-15",
      "confidence": 0.95,
      "fieldType": "date",
      "label": "Expiration Date"
    },
    "dateOfBirth": {
      "value": "1990-03-20",
      "confidence": 0.95,
      "fieldType": "date",
      "label": "Date of Birth"
    }
  },
  "documentTitle": "California Driver License - John Doe",
  "summary": "California Class C driver's license for John Doe, expires 05/15/2028",
  "allDatesFound": ["2028-05-15", "1990-03-20", "2020-05-15"],
  "allNumbersFound": ["D1234567"],
  "allNamesFound": ["JOHN DOE"]
}

IMPORTANT: Convert ALL dates to ISO YYYY-MM-DD format:
- 01/15/28 or 01/15/2028 → 2028-01-15
- JAN 15 2028 → 2028-01-15
- For 2-digit years, assume 2000s for expiration dates and 1900s/2000s based on context for DOB`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert data extraction AI specializing in driver\'s licenses. Extract ALL fields with confidence scores. ALWAYS convert dates to ISO YYYY-MM-DD format. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from driver's license`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Driver\'s license extraction error:', error)
      return this.getEmptyResponse()
    }
  }

  /**
   * Extract comprehensive passport fields
   */
  private async extractPassportFields(text: string): Promise<EnhancedExtractedData> {
    const prompt = `You are an expert at extracting ALL possible information from passports. Extract EVERY field you can find.

Document text:
${text.substring(0, 3000)}

Extract ALL of these fields if present (with confidence 0-1):

IDENTIFICATION:
- passportNumber
- type (P for passport, etc.)
- countryCode (3-letter ISO code)

PERSONAL INFORMATION:
- fullName (full legal name)
- surname (family name)
- givenNames (first/middle names)
- nationality
- dateOfBirth (YYYY-MM-DD format)
- sex (M/F)
- placeOfBirth (city, country)

DATES (ALL in YYYY-MM-DD format):
- expirationDate - CRITICAL
- issueDate
- dateOfIssue

ISSUANCE:
- issuingAuthority
- placeOfIssue

MACHINE READABLE ZONE (MRZ):
- mrzLine1 (if visible)
- mrzLine2 (if visible)

Response format (ONLY valid JSON):
{
  "fields": {
    "passportNumber": {
      "value": "123456789",
      "confidence": 0.95,
      "fieldType": "text",
      "label": "Passport Number"
    },
    "expirationDate": {
      "value": "2030-05-15",
      "confidence": 0.95,
      "fieldType": "date",
      "label": "Expiration Date"
    }
  },
  "documentTitle": "US Passport - John Doe",
  "summary": "United States passport for John Doe, expires 05/15/2030",
  "allDatesFound": ["2030-05-15", "1990-03-20"],
  "allNumbersFound": ["123456789"],
  "allNamesFound": ["JOHN DOE"]
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert data extraction AI specializing in passport documents. Extract ALL fields with confidence scores. ALWAYS convert dates to ISO YYYY-MM-DD format. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Extracted ${Object.keys(data.fields || {}).length} fields from passport`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error('❌ Passport extraction error:', error)
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
   * Universal enhanced extractor for all document types
   * Extracts ALL possible fields with confidence scores
   */
  private async extractUniversalEnhancedFields(text: string, documentType: string): Promise<EnhancedExtractedData> {
    // Document-specific field definitions
    const documentFieldDefinitions: Record<string, string> = {
      // Finance
      tax_document: `TAX DOCUMENT FIELDS:
- formType (W-2, 1099, 1040, etc.)
- taxYear
- employerName, employerEIN
- employeeName, employeeSSN (last 4 only)
- wages, federalTaxWithheld, stateTaxWithheld
- socialSecurityWages, medicareWages`,
      
      bank_statement: `BANK STATEMENT FIELDS:
- bankName, accountNumber, accountType
- statementPeriodStart, statementPeriodEnd
- beginningBalance, endingBalance
- totalDeposits, totalWithdrawals
- interestEarned, feesCharged`,
      
      // Insurance
      insurance_policy: `INSURANCE POLICY FIELDS:
- policyNumber, groupNumber
- provider, policyType (Health, Auto, Home, Life)
- effectiveDate, expirationDate
- premium, deductible, coverageAmount
- holderName, beneficiaries`,
      
      // Health
      vaccination_record: `VACCINATION RECORD FIELDS:
- vaccineName (COVID-19, Flu, MMR, etc.)
- dateAdministered, doseNumber
- lotNumber, manufacturer
- administeredBy, location
- nextDoseDate (if booster needed)`,
      
      // Vehicles
      vehicle_title: `VEHICLE TITLE FIELDS:
- titleNumber, vin
- make, model, year, color
- ownerName, ownerAddress
- issueDate, lienholder
- odometerReading`,
      
      // Legal / ID
      visa: `VISA FIELDS:
- visaNumber, visaType (Tourist, Work, Student, etc.)
- fullName, nationality, dateOfBirth
- validFrom, validUntil (CRITICAL - expiration)
- entries (Single/Multiple)
- issuingCountry, issuingPost`,
      
      green_card: `GREEN CARD / PERMANENT RESIDENT CARD FIELDS:
- uscisNumber, categoryCode
- fullName, dateOfBirth
- countryOfBirth
- cardExpiresDate (CRITICAL - 10-year cards expire)
- residentSince`,
      
      social_security_card: `SOCIAL SECURITY CARD FIELDS:
- fullName
- socialSecurityNumber (extract last 4 only for privacy)
- cardType (original, replacement)`,
      
      birth_certificate: `BIRTH CERTIFICATE FIELDS:
- fullName, dateOfBirth, timeOfBirth
- placeOfBirth (city, county, state)
- certificateNumber, fileNumber
- motherName, fatherName
- dateIssued, issuingAuthority`,
      
      marriage_certificate: `MARRIAGE CERTIFICATE FIELDS:
- spouse1Name, spouse2Name
- marriageDate, marriageLocation
- certificateNumber
- officiantName
- dateIssued`,
      
      military_document: `MILITARY DOCUMENT FIELDS:
- serviceMemberName
- serviceNumber, dodIdNumber
- branch (Army, Navy, Air Force, Marines, Coast Guard)
- rank, grade
- dateOfService, dischargeDate
- dischargeType (Honorable, General, etc.)
- veteranStatus`,
      
      // Professional / Business
      professional_license: `PROFESSIONAL LICENSE FIELDS:
- licenseNumber, licenseType
- holderName
- issuingBoard, issuingState
- issueDate, expirationDate (CRITICAL)
- specialties, certifications
- disciplinaryActions`,
      
      business_license: `BUSINESS LICENSE FIELDS:
- businessName, dbaName
- licenseNumber, permitNumber
- businessType, industry
- ownerName
- issueDate, expirationDate (CRITICAL)
- businessAddress`,
      
      certification: `CERTIFICATION FIELDS:
- certificationName
- holderName
- issuingOrganization
- certificationNumber, credentialId
- issueDate, expirationDate (if applicable)
- continuingEducationRequired`,
      
      // Property / Home
      property_deed: `PROPERTY DEED FIELDS:
- propertyAddress
- parcelNumber, apn
- ownerName, previousOwner
- deedType (Warranty, Quitclaim, etc.)
- recordedDate, documentNumber
- legalDescription
- purchasePrice`,
      
      lease_contract: `LEASE/RENTAL AGREEMENT FIELDS:
- propertyAddress
- landlordName, landlordContact
- tenantName
- leaseStartDate, leaseEndDate (CRITICAL)
- monthlyRent, securityDeposit
- leaseTermMonths
- petPolicy, utilitiesIncluded`,
      
      warranty: `WARRANTY FIELDS:
- productName, manufacturer
- modelNumber, serialNumber
- purchaseDate
- warrantyStartDate, warrantyEndDate (CRITICAL)
- warrantyType (Limited, Extended, Lifetime)
- coverageDetails, exclusions`,
      
      // Education
      education_document: `EDUCATION DOCUMENT FIELDS:
- holderName
- institutionName, institutionLocation
- documentType (Diploma, Transcript, Certificate)
- degreeType (BS, BA, MS, PhD, etc.)
- fieldOfStudy, major, minor
- graduationDate, conferralDate
- honors, gpa`,
      
      // Pets
      pet_document: `PET DOCUMENT FIELDS:
- petName, species, breed
- color, dateOfBirth, sex
- licenseNumber, licenseExpiration (CRITICAL)
- microchipNumber
- rabiesTagNumber, rabiesVaccineDate
- veterinarianName, vetClinic
- ownerName, ownerAddress`,
      
      // Contracts
      contract: `CONTRACT FIELDS:
- contractTitle, contractType
- partyA, partyB
- effectiveDate, terminationDate (CRITICAL)
- contractValue, paymentTerms
- keyTerms, obligations
- signatures, witnessNames`,
    }

    const fieldDefinition = documentFieldDefinitions[documentType] || 'Extract ALL relevant fields including dates, numbers, names, and identifiers'

    const prompt = `You are an expert at extracting ALL possible information from ${documentType.replace(/_/g, ' ')} documents.

Document text:
${text.substring(0, 3000)}

${fieldDefinition}

CRITICAL INSTRUCTIONS:
1. Extract EVERY field you can find with confidence scores (0-1)
2. ALL dates must be in ISO format: YYYY-MM-DD
3. Pay special attention to EXPIRATION DATES, END DATES, VALID UNTIL dates
4. Include issue dates, effective dates, start dates
5. For 2-digit years: assume 2000s for future dates, contextual for past dates

Response format (ONLY valid JSON):
{
  "fields": {
    "fieldName": {
      "value": "extracted value",
      "confidence": 0.95,
      "fieldType": "text|date|number|currency|phone|email|address",
      "label": "Human Readable Label"
    }
  },
  "documentTitle": "Descriptive title of document",
  "summary": "Brief summary of what this document is",
  "allDatesFound": ["YYYY-MM-DD", ...],
  "allNumbersFound": ["...", ...],
  "allNamesFound": ["...", ...]
}`

    try {
      const response = await this.openai.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an expert data extraction AI. Extract ALL fields with confidence scores. Convert ALL dates to ISO YYYY-MM-DD format. Pay special attention to expiration dates. Respond with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
      })

      const data = parseAIResponse(response.choices[0].message.content)
      console.log(`✅ Enhanced extraction for ${documentType}: ${Object.keys(data.fields || {}).length} fields`)
      return this.ensureValidResponse(data)
    } catch (error) {
      console.error(`❌ Enhanced ${documentType} extraction error:`, error)
      return this.getEmptyResponse()
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




















