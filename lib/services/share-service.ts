/**
 * Universal Share Service
 * Handles document/data sharing via email, SMS, and file generation
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Domain } from '@/types/domains'

// ============================================================================
// TYPES
// ============================================================================

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  relationship?: string
  source: 'relationships' | 'contacts'
}

export interface ShareTarget {
  contact?: Contact
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
}

export interface DocumentToShare {
  id: string
  name: string
  type: 'document' | 'data_export' | 'chart' | 'summary' | 'generated_pdf'
  file_url?: string
  file_data?: string // base64
  mime_type?: string
  domain?: Domain
  metadata?: Record<string, any>
}

export interface ShareRequest {
  targets: ShareTarget[]
  documents?: DocumentToShare[]
  data_query?: {
    domain: Domain
    entry_ids?: string[]
    date_range?: { start: string; end: string }
    format: 'pdf' | 'csv' | 'json' | 'summary'
    include_charts?: boolean
  }
  message: string
  subject?: string
  schedule_time?: string // ISO date for delayed send
}

export interface ShareResult {
  success: boolean
  sent_count: number
  failed_count: number
  details: {
    recipient: string
    method: 'email' | 'sms'
    status: 'sent' | 'failed'
    error?: string
  }[]
  share_link?: string
  generated_files?: string[]
}

export interface ContactSearchResult {
  contacts: Contact[]
  total: number
}

// ============================================================================
// SHARE SERVICE CLASS
// ============================================================================

export class ShareService {
  private supabase: SupabaseClient
  private userId: string

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase
    this.userId = userId
  }

  // ==========================================================================
  // CONTACT LOOKUP
  // ==========================================================================

  /**
   * Search contacts across relationships and contacts tables
   */
  async searchContacts(query: string): Promise<ContactSearchResult> {
    const contacts: Contact[] = []
    const lowerQuery = query.toLowerCase()

    // Search relationships table
    const { data: relationships } = await this.supabase
      .from('relationships')
      .select('id, name, email, phone, relationship')
      .eq('userId', this.userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,relationship.ilike.%${query}%`)
      .limit(20)

    if (relationships) {
      contacts.push(...relationships.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email || undefined,
        phone: r.phone || undefined,
        relationship: r.relationship,
        source: 'relationships' as const
      })))
    }

    // Search contacts table (for AI calling assistant)
    const { data: aiContacts } = await this.supabase
      .from('contacts')
      .select('id, name, email, phone_number, company_name')
      .eq('user_id', this.userId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
      .limit(20)

    if (aiContacts) {
      contacts.push(...aiContacts.map(c => ({
        id: c.id,
        name: c.company_name ? `${c.name} (${c.company_name})` : c.name,
        email: c.email || undefined,
        phone: c.phone_number || undefined,
        source: 'contacts' as const
      })))
    }

    // Deduplicate by name (prefer relationships entry)
    const seen = new Map<string, Contact>()
    contacts.forEach(c => {
      const key = c.name.toLowerCase()
      if (!seen.has(key) || c.source === 'relationships') {
        seen.set(key, c)
      }
    })

    return {
      contacts: Array.from(seen.values()),
      total: seen.size
    }
  }

  /**
   * Find contact by name (fuzzy match)
   */
  async findContactByName(name: string): Promise<Contact | null> {
    const result = await this.searchContacts(name)
    
    // Try exact match first
    const exactMatch = result.contacts.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    )
    if (exactMatch) return exactMatch

    // Try partial match
    const partialMatch = result.contacts.find(
      c => c.name.toLowerCase().includes(name.toLowerCase()) ||
           name.toLowerCase().includes(c.name.toLowerCase())
    )
    return partialMatch || null
  }

  /**
   * Get contact by relationship type (e.g., "doctor", "brother", "mom")
   */
  async findContactByRelationship(relationshipType: string): Promise<Contact | null> {
    const lowerType = relationshipType.toLowerCase()
    
    // Map common relationship terms
    const relationshipMap: Record<string, string[]> = {
      'doctor': ['doctor', 'physician', 'dr', 'healthcare'],
      'brother': ['brother', 'sibling', 'family'],
      'sister': ['sister', 'sibling', 'family'],
      'mom': ['mom', 'mother', 'parent', 'family'],
      'dad': ['dad', 'father', 'parent', 'family'],
      'wife': ['wife', 'spouse', 'partner'],
      'husband': ['husband', 'spouse', 'partner'],
      'boss': ['boss', 'manager', 'supervisor', 'colleague'],
      'accountant': ['accountant', 'cpa', 'tax', 'financial advisor'],
      'lawyer': ['lawyer', 'attorney', 'legal'],
      'dentist': ['dentist', 'dental'],
      'therapist': ['therapist', 'counselor', 'psychologist'],
      'mechanic': ['mechanic', 'auto', 'car'],
      'vet': ['vet', 'veterinarian', 'animal'],
    }

    const searchTerms = relationshipMap[lowerType] || [lowerType]

    for (const term of searchTerms) {
      const { data } = await this.supabase
        .from('relationships')
        .select('id, name, email, phone, relationship, notes')
        .eq('userId', this.userId)
        .or(`relationship.ilike.%${term}%,notes.ilike.%${term}%,name.ilike.%${term}%`)
        .limit(1)
        .single()

      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          relationship: data.relationship,
          source: 'relationships'
        }
      }
    }

    // Also check contacts table
    for (const term of searchTerms) {
      const { data } = await this.supabase
        .from('contacts')
        .select('id, name, email, phone_number, company_name, notes')
        .eq('user_id', this.userId)
        .or(`name.ilike.%${term}%,company_name.ilike.%${term}%,notes.ilike.%${term}%`)
        .limit(1)
        .single()

      if (data) {
        return {
          id: data.id,
          name: data.company_name ? `${data.name} (${data.company_name})` : data.name,
          email: data.email || undefined,
          phone: data.phone_number || undefined,
          source: 'contacts'
        }
      }
    }

    return null
  }

  // ==========================================================================
  // DOCUMENT RETRIEVAL
  // ==========================================================================

  /**
   * Get documents by type or domain
   */
  async getDocuments(options: {
    domain?: Domain
    document_type?: string
    search_query?: string
    limit?: number
  }): Promise<DocumentToShare[]> {
    let query = this.supabase
      .from('documents')
      .select('id, document_name, document_type, file_url, file_path, mime_type, domain, metadata')
      .eq('user_id', this.userId)

    if (options.domain) {
      query = query.eq('domain', options.domain)
    }

    if (options.document_type) {
      query = query.ilike('document_type', `%${options.document_type}%`)
    }

    if (options.search_query) {
      query = query.or(
        `document_name.ilike.%${options.search_query}%,` +
        `ocr_text.ilike.%${options.search_query}%`
      )
    }

    const { data } = await query
      .order('uploaded_at', { ascending: false })
      .limit(options.limit || 10)

    if (!data) return []

    return data.map(d => ({
      id: d.id,
      name: d.document_name,
      type: 'document',
      file_url: d.file_url || d.file_path,
      mime_type: d.mime_type,
      domain: d.domain as Domain,
      metadata: d.metadata
    }))
  }

  /**
   * Find document by description (using AI-like matching)
   */
  async findDocumentByDescription(description: string): Promise<DocumentToShare | null> {
    const lowerDesc = description.toLowerCase()
    
    // Map common document descriptions to search terms
    const documentMap: Record<string, { domain?: Domain; type?: string; keywords: string[] }> = {
      'medical record': { domain: 'health', keywords: ['medical', 'health', 'record', 'report'] },
      'insurance card': { domain: 'insurance', keywords: ['insurance', 'card', 'policy'] },
      'car registration': { domain: 'vehicles', keywords: ['registration', 'vehicle', 'dmv', 'car'] },
      'vehicle registration': { domain: 'vehicles', keywords: ['registration', 'vehicle', 'dmv'] },
      'drivers license': { domain: 'digital', keywords: ['license', 'driver', 'id'] },
      'passport': { domain: 'digital', keywords: ['passport', 'travel'] },
      'tax return': { domain: 'financial', keywords: ['tax', 'return', 'irs', '1040'] },
      'bank statement': { domain: 'financial', keywords: ['bank', 'statement', 'account'] },
      'prescription': { domain: 'health', keywords: ['prescription', 'rx', 'medication'] },
      'pet record': { domain: 'pets', keywords: ['pet', 'vet', 'vaccination', 'animal'] },
      'lease': { domain: 'home', keywords: ['lease', 'rental', 'apartment'] },
      'mortgage': { domain: 'home', keywords: ['mortgage', 'loan', 'house'] },
      'receipt': { domain: 'financial', keywords: ['receipt', 'purchase', 'expense'] },
    }

    // Find matching document type
    let searchConfig: { domain?: Domain; type?: string; keywords: string[] } | null = null
    for (const [key, config] of Object.entries(documentMap)) {
      if (lowerDesc.includes(key) || config.keywords.some(k => lowerDesc.includes(k))) {
        searchConfig = config
        break
      }
    }

    // Search documents
    const documents = await this.getDocuments({
      domain: searchConfig?.domain,
      search_query: searchConfig?.keywords?.[0] || description,
      limit: 5
    })

    // Return best match
    return documents[0] || null
  }

  // ==========================================================================
  // DATA EXPORT
  // ==========================================================================

  /**
   * Export domain data in specified format
   */
  async exportDomainData(options: {
    domain: Domain
    entry_ids?: string[]
    date_range?: { start: string; end: string }
    format: 'pdf' | 'csv' | 'json' | 'summary'
    include_charts?: boolean
  }): Promise<{ content: string; filename: string; mime_type: string }> {
    // Build query
    let query = this.supabase
      .from('domain_entries')
      .select('*')
      .eq('user_id', this.userId)
      .eq('domain', options.domain)

    if (options.entry_ids && options.entry_ids.length > 0) {
      query = query.in('id', options.entry_ids)
    }

    if (options.date_range) {
      query = query
        .gte('created_at', options.date_range.start)
        .lte('created_at', options.date_range.end)
    }

    const { data: entries } = await query.order('created_at', { ascending: false })

    if (!entries || entries.length === 0) {
      throw new Error(`No ${options.domain} data found`)
    }

    // Export based on format
    switch (options.format) {
      case 'json':
        return {
          content: JSON.stringify(entries, null, 2),
          filename: `${options.domain}-export.json`,
          mime_type: 'application/json'
        }

      case 'csv':
        const csvContent = this.entriesToCSV(entries)
        return {
          content: csvContent,
          filename: `${options.domain}-export.csv`,
          mime_type: 'text/csv'
        }

      case 'summary':
        const summary = this.generateSummary(entries, options.domain)
        return {
          content: summary,
          filename: `${options.domain}-summary.txt`,
          mime_type: 'text/plain'
        }

      case 'pdf':
        // Return HTML that can be converted to PDF
        const html = this.generatePDFHTML(entries, options.domain)
        return {
          content: html,
          filename: `${options.domain}-report.html`,
          mime_type: 'text/html'
        }

      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }
  }

  private entriesToCSV(entries: any[]): string {
    if (entries.length === 0) return ''

    // Flatten metadata into columns
    const flatEntries = entries.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || '',
      created_at: e.created_at,
      ...e.metadata
    }))

    // Get all unique keys
    const allKeys = Array.from(new Set(flatEntries.flatMap(e => Object.keys(e))))

    // Build CSV
    const header = allKeys.join(',')
    const rows = flatEntries.map(entry =>
      allKeys.map(key => {
        const value = entry[key]
        if (value === null || value === undefined) return ''
        const str = String(value)
        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
      }).join(',')
    )

    return [header, ...rows].join('\n')
  }

  private generateSummary(entries: any[], domain: Domain): string {
    const lines: string[] = []
    lines.push(`=== ${domain.toUpperCase()} SUMMARY ===`)
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(`Total Entries: ${entries.length}`)
    lines.push('')

    // Domain-specific summaries
    if (domain === 'financial') {
      const expenses = entries.filter(e => e.metadata?.type === 'expense')
      const income = entries.filter(e => e.metadata?.type === 'income')
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.metadata?.amount || 0), 0)
      const totalIncome = income.reduce((sum, e) => sum + (e.metadata?.amount || 0), 0)
      lines.push(`Total Expenses: $${totalExpenses.toFixed(2)}`)
      lines.push(`Total Income: $${totalIncome.toFixed(2)}`)
      lines.push(`Net: $${(totalIncome - totalExpenses).toFixed(2)}`)
    } else if (domain === 'health') {
      const weights = entries.filter(e => e.metadata?.weight)
      if (weights.length > 0) {
        const latestWeight = weights[0].metadata.weight
        lines.push(`Latest Weight: ${latestWeight} ${weights[0].metadata?.unit || 'lbs'}`)
      }
    }

    lines.push('')
    lines.push('--- ENTRIES ---')
    entries.slice(0, 20).forEach((e, i) => {
      lines.push(`${i + 1}. ${e.title} (${new Date(e.created_at).toLocaleDateString()})`)
    })

    if (entries.length > 20) {
      lines.push(`... and ${entries.length - 20} more entries`)
    }

    return lines.join('\n')
  }

  private generatePDFHTML(entries: any[], domain: Domain): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${domain} Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; }
    .entry { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .entry h3 { margin: 0 0 10px 0; color: #1f2937; }
    .entry-meta { color: #6b7280; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    td { padding: 5px 10px; border-bottom: 1px solid #e5e7eb; }
    td:first-child { font-weight: bold; color: #4b5563; width: 150px; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 ${domain.charAt(0).toUpperCase() + domain.slice(1)} Report</h1>
  <div class="meta">
    <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
    <strong>Total Entries:</strong> ${entries.length}
  </div>
  
  ${entries.map((entry, index) => `
    <div class="entry">
      <h3>${index + 1}. ${entry.title || 'Untitled'}</h3>
      ${entry.description ? `<p>${entry.description}</p>` : ''}
      ${entry.metadata ? `
        <table>
          ${Object.entries(entry.metadata)
            .filter(([_, v]) => v !== null && v !== undefined && v !== '')
            .map(([key, value]) => `
              <tr>
                <td>${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}</td>
                <td>${typeof value === 'object' ? JSON.stringify(value) : value}</td>
              </tr>
            `).join('')}
        </table>
      ` : ''}
      <div class="entry-meta">Created: ${new Date(entry.created_at).toLocaleString()}</div>
    </div>
  `).join('')}
  
  <div class="footer">
    Generated by LifeHub • ${new Date().toLocaleDateString()}
  </div>
</body>
</html>
    `.trim()
  }

  // ==========================================================================
  // SEND OPERATIONS
  // ==========================================================================

  /**
   * Send content via email
   */
  async sendEmail(options: {
    to: string | string[]
    subject: string
    message: string
    attachments?: { filename: string; content: string; mime_type: string }[]
    share_link_id?: string
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/share/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        message: options.message,
        share_link_id: options.share_link_id,
        attachments: options.attachments?.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.mime_type
        }))
      })
    })

    const data = await response.json()
    return {
      success: data.success || false,
      message: data.message || data.error || 'Unknown error'
    }
  }

  /**
   * Send content via SMS
   */
  async sendSMS(options: {
    to: string | string[]
    message: string
    include_link?: boolean
    share_link_id?: string
    document_urls?: string[]
  }): Promise<{ success: boolean; message: string }> {
    const response = await fetch('/api/share/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    })

    const data = await response.json()
    return {
      success: data.success || false,
      message: data.message || data.error || 'Unknown error'
    }
  }

  /**
   * Execute a complete share request
   */
  async executeShare(request: ShareRequest): Promise<ShareResult> {
    const details: ShareResult['details'] = []
    let generatedFiles: string[] = []

    // Generate any needed exports
    if (request.data_query) {
      try {
        const exported = await this.exportDomainData(request.data_query)
        generatedFiles.push(exported.filename)
        
        // Store in temp storage or include as attachment
        if (!request.documents) request.documents = []
        request.documents.push({
          id: `export-${Date.now()}`,
          name: exported.filename,
          type: 'data_export',
          file_data: Buffer.from(exported.content).toString('base64'),
          mime_type: exported.mime_type
        })
      } catch (error: any) {
        console.error('Export failed:', error)
      }
    }

    // Send to each target
    for (const target of request.targets) {
      const contact = target.contact
      
      // Send via email
      if ((target.method === 'email' || target.method === 'both') && (target.email || contact?.email)) {
        const recipientEmail = target.email || contact!.email!
        try {
          const result = await this.sendEmail({
            to: recipientEmail,
            subject: request.subject || `Shared from LifeHub`,
            message: request.message,
            attachments: request.documents?.map(d => ({
              filename: d.name,
              content: d.file_data || '',
              mime_type: d.mime_type || 'application/octet-stream'
            }))
          })
          
          details.push({
            recipient: recipientEmail,
            method: 'email',
            status: result.success ? 'sent' : 'failed',
            error: result.success ? undefined : result.message
          })
        } catch (error: any) {
          details.push({
            recipient: recipientEmail,
            method: 'email',
            status: 'failed',
            error: error.message
          })
        }
      }

      // Send via SMS
      if ((target.method === 'sms' || target.method === 'both') && (target.phone || contact?.phone)) {
        const recipientPhone = target.phone || contact!.phone!
        try {
          const result = await this.sendSMS({
            to: recipientPhone,
            message: request.message,
            document_urls: request.documents?.filter(d => d.file_url).map(d => d.file_url!)
          })
          
          details.push({
            recipient: recipientPhone,
            method: 'sms',
            status: result.success ? 'sent' : 'failed',
            error: result.success ? undefined : result.message
          })
        } catch (error: any) {
          details.push({
            recipient: recipientPhone,
            method: 'sms',
            status: 'failed',
            error: error.message
          })
        }
      }
    }

    const sent = details.filter(d => d.status === 'sent').length
    const failed = details.filter(d => d.status === 'failed').length

    return {
      success: sent > 0,
      sent_count: sent,
      failed_count: failed,
      details,
      generated_files: generatedFiles.length > 0 ? generatedFiles : undefined
    }
  }
}

/**
 * Create share service instance
 */
export function createShareService(supabase: SupabaseClient, userId: string): ShareService {
  return new ShareService(supabase, userId)
}

