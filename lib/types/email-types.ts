/**
 * Types for Gmail Smart Parsing Integration
 */

export type EmailClassification = 
  | 'bill'
  | 'appointment'
  | 'service_reminder'
  | 'receipt'
  | 'insurance'
  | 'other'

export type EmailSuggestionStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'ignored'

export interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  date: Date
  snippet: string
  body: string
  labels: string[]
}

export interface BillExtraction {
  companyName: string
  amount: number
  dueDate: Date
  accountNumber?: string
  referenceNumber?: string
}

export interface AppointmentExtraction {
  provider: string
  type: string
  date: Date
  time: string
  location?: string
  address?: string
  phoneNumber?: string
  confirmationNumber?: string
}

export interface ServiceReminderExtraction {
  vehicle?: string
  serviceType: string
  recommendedDate?: Date
  provider?: string
  mileage?: number
}

export interface ReceiptExtraction {
  vendor: string
  amount: number
  date: Date
  items?: string[]
  category?: string
  paymentMethod?: string
}

export interface InsuranceExtraction {
  provider: string
  policyType: string
  policyNumber?: string
  premium?: number
  renewalDate?: Date
  effectiveDate?: Date
  coverageAmount?: number
}

export type ExtractedData = 
  | BillExtraction
  | AppointmentExtraction
  | ServiceReminderExtraction
  | ReceiptExtraction
  | InsuranceExtraction

export interface ClassifiedEmail {
  emailId: string
  subject: string
  from: string
  date: Date
  classification: EmailClassification
  confidence: number
  extractedData: ExtractedData | null
  suggestionText: string
  targetDomain: string
}

export interface ProcessedEmail {
  id: string
  userId: string
  emailId: string
  emailSubject: string
  emailFrom: string
  emailDate: Date
  classification: EmailClassification
  extractedData: ExtractedData
  suggestionText: string
  status: EmailSuggestionStatus
  domainAddedTo?: string
  itemId?: string
  processedAt: Date
  actionTakenAt?: Date
}

export interface EmailSuggestion extends ProcessedEmail {
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  onIgnore: () => Promise<void>
}






























