/**
 * AI Email Classifier using OpenAI GPT-4
 * 
 * Detects email types and extracts structured data
 */

import { OpenAIService } from '../external-apis/openai-service'
import type {
  EmailClassification,
  EmailMessage,
  ClassifiedEmail,
  ExtractedData,
  BillExtraction,
  AppointmentExtraction,
  ServiceReminderExtraction,
  ReceiptExtraction,
  InsuranceExtraction
} from '../types/email-types'

export class EmailClassifier {
  private openai: OpenAIService

  constructor() {
    this.openai = new OpenAIService()
  }

  /**
   * Classify and extract data from an email
   */
  async classifyEmail(email: EmailMessage): Promise<ClassifiedEmail | null> {
    try {
      console.log('🤖 Classifying email:', email.subject)
      
      const prompt = this.buildClassificationPrompt(email)
      
      const response = await this.openai.chatCompletion({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert email classifier that identifies and extracts information from emails.
Your task is to:
1. Classify the email into one of these categories: bill, appointment, service_reminder, receipt, insurance, other
2. Extract relevant structured data based on the classification
3. Generate a natural language suggestion for the user
4. Determine which domain this should be added to

Always respond with valid JSON only. No additional text.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        console.log('⚠️ No content in OpenAI response for email:', email.subject)
        return null
      }

      // Parse the JSON response
      const parsed = JSON.parse(content)
      console.log('✅ Classified email as:', parsed.classification)
      
      return {
        emailId: email.id,
        subject: email.subject,
        from: email.from,
        date: email.date,
        classification: parsed.classification,
        confidence: parsed.confidence,
        extractedData: parsed.extractedData,
        suggestionText: parsed.suggestionText,
        targetDomain: parsed.targetDomain
      }
    } catch (error: any) {
      console.error('❌ Error classifying email:', email.subject, error?.message)
      return null
    }
  }

  /**
   * Classify multiple emails in batch
   */
  async classifyBatch(emails: EmailMessage[]): Promise<ClassifiedEmail[]> {
    const results = await Promise.all(
      emails.map(email => this.classifyEmail(email))
    )
    return results.filter((r): r is ClassifiedEmail => r !== null && r.classification !== 'other')
  }

  /**
   * Build the classification prompt
   */
  private buildClassificationPrompt(email: EmailMessage): string {
    return `Analyze this email and extract relevant information:

Subject: ${email.subject}
From: ${email.from}
Date: ${email.date.toISOString()}
Body: ${email.body.substring(0, 2000)}

Classify this email and extract structured data. Respond with JSON in this exact format:

For BILLS/UTILITIES:
{
  "classification": "bill",
  "confidence": 0.95,
  "extractedData": {
    "companyName": "Electric Company",
    "amount": 150.00,
    "dueDate": "2025-10-20",
    "accountNumber": "123456"
  },
  "suggestionText": "Add $150 electric bill due Oct 20 to Utilities?",
  "targetDomain": "utilities"
}

For APPOINTMENTS:
{
  "classification": "appointment",
  "confidence": 0.90,
  "extractedData": {
    "provider": "Dr. Smith",
    "type": "Annual Checkup",
    "date": "2025-10-25",
    "time": "2:00 PM",
    "location": "Main Street Clinic",
    "address": "123 Main St"
  },
  "suggestionText": "Add Dr. Smith appointment Oct 25 at 2pm to Health?",
  "targetDomain": "health"
}

For SERVICE REMINDERS:
{
  "classification": "service_reminder",
  "confidence": 0.85,
  "extractedData": {
    "vehicle": "Honda Civic",
    "serviceType": "Oil Change",
    "recommendedDate": "2025-11-01",
    "provider": "AutoCare Plus"
  },
  "suggestionText": "Schedule oil change for Honda Civic?",
  "targetDomain": "vehicles"
}

For RECEIPTS/PURCHASES:
{
  "classification": "receipt",
  "confidence": 0.92,
  "extractedData": {
    "vendor": "Target",
    "amount": 89.50,
    "date": "2025-10-15",
    "category": "Shopping"
  },
  "suggestionText": "Log $89.50 Target purchase to Finance?",
  "targetDomain": "finance"
}

For INSURANCE:
{
  "classification": "insurance",
  "confidence": 0.88,
  "extractedData": {
    "provider": "State Farm",
    "policyType": "Auto",
    "premium": 125.00,
    "renewalDate": "2025-12-01",
    "policyNumber": "POL-123456"
  },
  "suggestionText": "Update auto insurance premium to $125/mo?",
  "targetDomain": "insurance"
}

For OTHER (non-actionable):
{
  "classification": "other",
  "confidence": 0.60,
  "extractedData": null,
  "suggestionText": "",
  "targetDomain": ""
}

Rules:
- Use ONLY these classifications: bill, appointment, service_reminder, receipt, insurance, other
- Extract dates in ISO format (YYYY-MM-DD)
- Extract amounts as numbers without currency symbols
- Be conservative with confidence scores (< 0.7 = other)
- suggestionText should be natural, actionable, and specific
- targetDomain should be: utilities, health, vehicles, finance, insurance, home, or empty for "other"
- Return ONLY valid JSON, no markdown or extra text
`
  }

  /**
   * Check if OpenAI is configured
   */
  isConfigured(): boolean {
    return this.openai.isConfigured()
  }
}

// Export singleton instance
export const emailClassifier = new EmailClassifier()






























