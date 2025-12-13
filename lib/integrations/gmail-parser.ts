/**
 * Gmail API Integration for Smart Email Parsing
 * 
 * Fetches and parses emails from Gmail with AI classification
 * Enhanced with attachment extraction for receipts
 */

import { google } from 'googleapis'
import { emailClassifier } from '../ai/email-classifier'
import type { 
  EmailMessage, 
  ClassifiedEmail, 
  EmailAttachment,
  ComposeEmailRequest,
  ComposeEmailResponse
} from '../types/email-types'

// Receipt-related MIME types we want to extract
const RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'image/heic',
  'image/heif'
]

export class GmailParser {
  private gmail: any
  private auth: any

  constructor(accessToken?: string) {
    if (accessToken) {
      this.auth = new google.auth.OAuth2()
      this.auth.setCredentials({ access_token: accessToken })
      this.gmail = google.gmail({ version: 'v1', auth: this.auth })
    }
  }

  /**
   * Initialize with OAuth credentials
   */
  setAccessToken(accessToken: string) {
    this.auth = new google.auth.OAuth2()
    this.auth.setCredentials({ access_token: accessToken })
    this.gmail = google.gmail({ version: 'v1', auth: this.auth })
  }

  /**
   * Get recent emails from the last N days
   */
  async getRecentEmails(daysBack: number = 7): Promise<EmailMessage[]> {
    if (!this.gmail) {
      console.error('❌ Gmail API not initialized - no access token')
      throw new Error('Gmail API not initialized. Please provide access token.')
    }

    try {
      console.log('📧 Starting Gmail fetch...')
      
      // Calculate date for query
      const afterDate = new Date()
      afterDate.setDate(afterDate.getDate() - daysBack)
      const afterDateStr = Math.floor(afterDate.getTime() / 1000)

      // Query for recent emails including inbox and key Gmail smart categories
      // Explicitly include category:purchases so receipts are captured even if under Promotions
      const afterClause = `after:${afterDateStr}`
      const includeScope = `(in:inbox OR category:purchases OR category:travel OR category:finance OR category:updates)`
      const excludeScope = `-category:social -category:forums -category:spam`
      const query = `${afterClause} ${includeScope} ${excludeScope}`

      console.log('📧 Gmail query:', query)

      // Limit to 15 emails to avoid timeout (each email = Gmail API + OpenAI API call)
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 15
      })

      console.log('📧 Gmail API response received, messages:', response.data.messages?.length || 0)

      const messages = response.data.messages || []
      
      // Fetch full message details for each (process in chunks to avoid timeout)
      const emails: (EmailMessage | null)[] = []
      const chunkSize = 5
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize)
        const chunkResults = await Promise.all(
          chunk.map((msg: any) => this.getEmailDetails(msg.id))
        )
        emails.push(...chunkResults)
        console.log(`📧 Fetched ${Math.min(i + chunkSize, messages.length)}/${messages.length} email details`)
      }
      
      const validEmails = emails.filter((email): email is EmailMessage => email !== null)
      console.log('📧 Fetched', validEmails.length, 'valid emails')
      
      return validEmails
    } catch (error: any) {
      console.error('❌ Error fetching Gmail messages:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        errors: error?.errors,
        response: error?.response?.data
      })
      throw new Error('Failed to fetch emails from Gmail: ' + (error?.message || 'Unknown error'))
    }
  }

  /**
   * Get full email details including body and attachments
   */
  private async getEmailDetails(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      const message = response.data
      const headers = message.payload.headers
      
      const subject = this.getHeader(headers, 'Subject') || '(No Subject)'
      const from = this.getHeader(headers, 'From') || ''
      const to = this.getHeader(headers, 'To') || ''
      const dateStr = this.getHeader(headers, 'Date') || new Date().toISOString()
      
      const body = this.extractBody(message.payload)
      const snippet = message.snippet || ''
      
      // Extract attachment metadata (don't download data yet for performance)
      const attachments = this.extractAttachmentMetadata(message.payload, messageId)
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date: new Date(dateStr),
        snippet,
        body,
        labels: message.labelIds || [],
        attachments: attachments.length > 0 ? attachments : undefined
      }
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error)
      return null
    }
  }

  /**
   * Extract attachment metadata from email payload (without downloading data)
   */
  private extractAttachmentMetadata(payload: any, _messageId: string): EmailAttachment[] {
    const attachments: EmailAttachment[] = []
    
    const processPayload = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        // Check if it's a receipt-related file type
        const mimeType = part.mimeType?.toLowerCase() || ''
        const filename = part.filename?.toLowerCase() || ''
        
        const isReceiptType = RECEIPT_MIME_TYPES.some(type => mimeType.includes(type.split('/')[1]))
        const looksLikeReceipt = filename.includes('receipt') || 
                                 filename.includes('invoice') ||
                                 filename.includes('order') ||
                                 filename.includes('confirmation')
        
        if (isReceiptType || looksLikeReceipt) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType || 'application/octet-stream',
            size: part.body.size || 0
          })
        }
      }
      
      // Recursively check nested parts
      if (part.parts) {
        part.parts.forEach(processPayload)
      }
    }
    
    processPayload(payload)
    return attachments
  }

  /**
   * Download attachment data by ID
   */
  async getAttachmentData(messageId: string, attachmentId: string): Promise<string | null> {
    if (!this.gmail) return null
    
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      })
      
      // Gmail returns base64url encoded data, convert to standard base64
      const base64Data = response.data.data
        .replace(/-/g, '+')
        .replace(/_/g, '/')
      
      return base64Data
    } catch (error) {
      console.error(`Error fetching attachment ${attachmentId}:`, error)
      return null
    }
  }

  /**
   * Get all receipt attachments for an email with data
   */
  async getReceiptAttachments(messageId: string): Promise<EmailAttachment[]> {
    if (!this.gmail) return []
    
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })
      
      const attachments = this.extractAttachmentMetadata(response.data.payload, messageId)
      
      // Download data for each attachment
      const attachmentsWithData: EmailAttachment[] = []
      for (const att of attachments) {
        const data = await this.getAttachmentData(messageId, att.id)
        if (data) {
          attachmentsWithData.push({
            ...att,
            data
          })
        }
      }
      
      return attachmentsWithData
    } catch (error) {
      console.error(`Error getting receipt attachments for ${messageId}:`, error)
      return []
    }
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(payload: any): string {
    let body = ''

    if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    } else if (payload.parts) {
      // Multi-part email
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && !body && part.body.data) {
          // Fallback to HTML if no plain text
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
          body = this.stripHtml(html)
        } else if (part.parts) {
          // Nested parts
          body += this.extractBody(part)
        }
      }
    }

    return body
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Get header value by name
   */
  private getHeader(headers: any[], name: string): string | null {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
    return header ? header.value : null
  }

  /**
   * Parse and classify recent emails
   */
  async parseRecentEmails(daysBack: number = 7): Promise<ClassifiedEmail[]> {
    const emails = await this.getRecentEmails(daysBack)
    const classified = await emailClassifier.classifyBatch(emails)
    return classified
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (!this.gmail) return

    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
    } catch (error) {
      console.error(`Error marking email ${messageId} as read:`, error)
    }
  }

  /**
   * Add label to email
   */
  async addLabel(messageId: string, labelName: string): Promise<void> {
    if (!this.gmail) return

    try {
      // First, get or create the label
      const labelsResponse = await this.gmail.users.labels.list({ userId: 'me' })
      let label = labelsResponse.data.labels.find((l: any) => l.name === labelName)

      if (!label) {
        const createResponse = await this.gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show'
          }
        })
        label = createResponse.data
      }

      // Add label to message
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [label.id]
        }
      })
    } catch (error) {
      console.error(`Error adding label to email ${messageId}:`, error)
    }
  }

  /**
   * Check if parser is configured
   */
  isConfigured(): boolean {
    return !!this.gmail
  }

  /**
   * Send an email via Gmail API
   */
  async sendEmail(request: ComposeEmailRequest): Promise<ComposeEmailResponse> {
    if (!this.gmail) {
      return { success: false, error: 'Gmail API not initialized' }
    }

    try {
      // Build the email message
      const to = Array.isArray(request.to) ? request.to.join(', ') : request.to
      const cc = request.cc ? (Array.isArray(request.cc) ? request.cc.join(', ') : request.cc) : undefined
      const bcc = request.bcc ? (Array.isArray(request.bcc) ? request.bcc.join(', ') : request.bcc) : undefined

      // Create MIME message
      const emailLines = [
        `To: ${to}`,
        `Subject: ${request.subject}`,
        'MIME-Version: 1.0'
      ]

      if (cc) emailLines.push(`Cc: ${cc}`)
      if (bcc) emailLines.push(`Bcc: ${bcc}`)

      // Handle reply threading
      if (request.replyToMessageId) {
        emailLines.push(`In-Reply-To: ${request.replyToMessageId}`)
        emailLines.push(`References: ${request.replyToMessageId}`)
      }

      // Check if we have attachments
      if (request.attachments && request.attachments.length > 0) {
        const boundary = `boundary_${Date.now()}`
        emailLines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
        emailLines.push('')
        emailLines.push(`--${boundary}`)
        emailLines.push(`Content-Type: ${request.bodyType === 'html' ? 'text/html' : 'text/plain'}; charset=utf-8`)
        emailLines.push('')
        emailLines.push(request.body)
        
        // Add attachments
        for (const att of request.attachments) {
          emailLines.push(`--${boundary}`)
          emailLines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`)
          emailLines.push(`Content-Disposition: attachment; filename="${att.filename}"`)
          emailLines.push('Content-Transfer-Encoding: base64')
          emailLines.push('')
          emailLines.push(att.data)
        }
        emailLines.push(`--${boundary}--`)
      } else {
        emailLines.push(`Content-Type: ${request.bodyType === 'html' ? 'text/html' : 'text/plain'}; charset=utf-8`)
        emailLines.push('')
        emailLines.push(request.body)
      }

      const rawMessage = emailLines.join('\r\n')
      
      // Encode to base64url
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      // Send the email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: request.threadId
        }
      })

      console.log('✅ Email sent successfully:', response.data.id)
      
      return {
        success: true,
        messageId: response.data.id,
        threadId: response.data.threadId
      }
    } catch (error: any) {
      console.error('❌ Error sending email:', error?.message)
      return {
        success: false,
        error: error?.message || 'Failed to send email'
      }
    }
  }

  /**
   * Create a draft email (for preview before sending)
   */
  async createDraft(request: ComposeEmailRequest): Promise<ComposeEmailResponse> {
    if (!this.gmail) {
      return { success: false, error: 'Gmail API not initialized' }
    }

    try {
      const to = Array.isArray(request.to) ? request.to.join(', ') : request.to
      
      const emailLines = [
        `To: ${to}`,
        `Subject: ${request.subject}`,
        'MIME-Version: 1.0',
        `Content-Type: ${request.bodyType === 'html' ? 'text/html' : 'text/plain'}; charset=utf-8`,
        '',
        request.body
      ]

      const rawMessage = emailLines.join('\r\n')
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      const response = await this.gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
          message: {
            raw: encodedMessage,
            threadId: request.threadId
          }
        }
      })

      console.log('✅ Draft created:', response.data.id)
      
      return {
        success: true,
        messageId: response.data.id
      }
    } catch (error: any) {
      console.error('❌ Error creating draft:', error?.message)
      return {
        success: false,
        error: error?.message || 'Failed to create draft'
      }
    }
  }

  /**
   * Get user's email address
   */
  async getUserEmail(): Promise<string | null> {
    if (!this.gmail) return null
    
    try {
      const response = await this.gmail.users.getProfile({ userId: 'me' })
      return response.data.emailAddress
    } catch (error) {
      console.error('Error getting user email:', error)
      return null
    }
  }
}

// Helper function to create parser with session token
export function createGmailParser(accessToken?: string): GmailParser {
  return new GmailParser(accessToken)
}















