/**
 * Gmail API Integration for Smart Email Parsing
 * 
 * Fetches and parses emails from Gmail with AI classification
 */

import { google } from 'googleapis'
import { emailClassifier } from '../ai/email-classifier'
import type { EmailMessage, ClassifiedEmail } from '../types/email-types'

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

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100
      })

      console.log('📧 Gmail API response received, messages:', response.data.messages?.length || 0)

      const messages = response.data.messages || []
      
      // Fetch full message details for each
      const emailPromises = messages.map((msg: any) => this.getEmailDetails(msg.id))
      const emails = await Promise.all(emailPromises)
      
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
   * Get full email details including body
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
      
      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date: new Date(dateStr),
        snippet,
        body,
        labels: message.labelIds || []
      }
    } catch (error) {
      console.error(`Error fetching email ${messageId}:`, error)
      return null
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
}

// Helper function to create parser with session token
export function createGmailParser(accessToken?: string): GmailParser {
  return new GmailParser(accessToken)
}















