export interface SmartDocument {
  id: string
  name: string
  type: string
  size: number
  data: string // Base64
  uploadedAt: string
  domain: string
  itemId?: string
  url?: string // Public URL if stored externally
  metadata?: Record<string, any> // Generic metadata
  
  // OCR Results
  ocrProcessed: boolean
  ocrText?: string
  ocrConfidence?: number
  
  // Extracted Metadata
  extractedData: {
    documentType?: string // insurance_policy, bill, medical_record, etc.
    expirationDate?: string
    renewalDate?: string
    policyNumber?: string
    accountNumber?: string
    amount?: number
    currency?: string
    email?: string
    phone?: string
    dates?: string[]
    [key: string]: any
  }
  
  // User-editable notes
  notes?: string
  tags?: string[]
  
  // Reminder created
  reminderCreated?: boolean
  reminderId?: string
}

export interface DocumentUploadProgress {
  stage: 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'
  progress: number
  message: string
}







