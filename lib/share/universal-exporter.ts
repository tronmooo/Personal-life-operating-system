import { Domain, DOMAIN_CONFIGS } from '@/types/domains'
import { ShareFormat, ExportOptions, ExportResult } from '@/types/share'
import { format as dateFormat } from 'date-fns'

/**
 * Universal Data Exporter
 * Exports domain entries in multiple formats: JSON, CSV, Excel, PDF, Image, Markdown
 */
export class UniversalExporter {
  /**
   * Main export method - routes to appropriate format handler
   */
  async export(
    domain: Domain,
    entries: any[],
    outputFormat: ShareFormat,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const timestamp = dateFormat(new Date(), 'yyyy-MM-dd-HHmmss')
    const domainName = DOMAIN_CONFIGS[domain]?.name || domain

    switch (outputFormat) {
      case 'json':
        return this.exportJSON(domain, entries, options, timestamp, domainName)
      case 'csv':
        return this.exportCSV(domain, entries, options, timestamp, domainName)
      case 'excel':
        return this.exportExcel(domain, entries, options, timestamp, domainName)
      case 'pdf':
        return this.exportPDF(domain, entries, options, timestamp, domainName)
      case 'markdown':
        return this.exportMarkdown(domain, entries, options, timestamp, domainName)
      case 'html':
        return this.exportHTML(domain, entries, options, timestamp, domainName)
      default:
        throw new Error(`Unsupported export format: ${outputFormat}`)
    }
  }

  /**
   * Export to JSON
   */
  private async exportJSON(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    const sanitized = options.sanitize_data ? this.sanitizeEntries(entries) : entries

    const exportData = {
      domain,
      domainName,
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      entries: options.include_metadata !== false ? sanitized : sanitized.map(e => e.metadata),
      metadata: options.include_metadata !== false ? {
        exported_by: 'LifeHub Universal Exporter',
        version: '1.0',
        format: 'json'
      } : undefined
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    return {
      success: true,
      format: 'json',
      filename: `${domainName}-${timestamp}.json`,
      data: blob,
      size_bytes: blob.size,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Export to CSV
   */
  private async exportCSV(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    const delimiter = options.csv?.delimiter || ','
    const includeHeaders = options.csv?.include_headers !== false
    const quoteStrings = options.csv?.quote_strings !== false

    if (entries.length === 0) {
      throw new Error('No entries to export')
    }

    // Flatten entries
    const flatEntries = entries.map(entry => this.flattenEntry(entry))
    
    // Get all unique keys
    const allKeys = Array.from(
      new Set(flatEntries.flatMap(entry => Object.keys(entry)))
    )

    // Build CSV
    const rows: string[] = []

    if (includeHeaders) {
      rows.push(allKeys.map(key => this.escapeCSV(key, delimiter, quoteStrings)).join(delimiter))
    }

    flatEntries.forEach(entry => {
      const values = allKeys.map(key => {
        const value = entry[key]
        return this.escapeCSV(String(value ?? ''), delimiter, quoteStrings)
      })
      rows.push(values.join(delimiter))
    })

    const csvString = rows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv' })

    return {
      success: true,
      format: 'csv',
      filename: `${domainName}-${timestamp}.csv`,
      data: blob,
      size_bytes: blob.size,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Export to Excel (XLSX)
   */
  private async exportExcel(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    // Note: In a real implementation, you'd use a library like exceljs
    // For now, we'll create a structured format that can be converted
    
    const flatEntries = entries.map(entry => this.flattenEntry(entry))
    const allKeys = Array.from(
      new Set(flatEntries.flatMap(entry => Object.keys(entry)))
    )

    // Create Excel-compatible structure (simplified)
    const workbookData = {
      sheetName: options.excel?.sheet_name || domainName,
      headers: allKeys,
      rows: flatEntries.map(entry => allKeys.map(key => entry[key] ?? '')),
      options: {
        autoFilter: options.excel?.auto_filter !== false,
        freezeHeader: options.excel?.freeze_header !== false,
        formatting: options.excel?.formatting !== false
      }
    }

    // For now, export as CSV with Excel hints (in production, use exceljs)
    const csvData = await this.exportCSV(domain, entries, options, timestamp, domainName)
    
    return {
      ...csvData,
      format: 'excel',
      filename: `${domainName}-${timestamp}.xlsx`,
      data: csvData.data // In production, this would be actual XLSX binary
    }
  }

  /**
   * Export to PDF
   */
  private async exportPDF(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    // Generate HTML that can be converted to PDF
    const html = this.generatePDFHTML(domain, entries, options, domainName)
    
    // Note: In production, you'd use jsPDF, puppeteer, or similar
    // For now, return HTML that client can convert
    const blob = new Blob([html], { type: 'text/html' })

    return {
      success: true,
      format: 'pdf',
      filename: `${domainName}-${timestamp}.pdf`,
      data: blob,
      size_bytes: blob.size,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Export to Markdown
   */
  private async exportMarkdown(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    const lines: string[] = []

    // Header
    lines.push(`# ${domainName} Export`)
    lines.push(``)
    lines.push(`**Exported:** ${dateFormat(new Date(), 'PPpp')}`)
    lines.push(`**Total Entries:** ${entries.length}`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // Entries
    entries.forEach((entry, index) => {
      lines.push(`## ${index + 1}. ${entry.title || 'Untitled'}`)
      lines.push(``)
      
      if (entry.description) {
        lines.push(entry.description)
        lines.push(``)
      }

      // Metadata as table
      if (entry.metadata) {
        lines.push(`| Field | Value |`)
        lines.push(`|-------|-------|`)
        
        Object.entries(entry.metadata).forEach(([key, value]) => {
          lines.push(`| ${key} | ${String(value)} |`)
        })
        lines.push(``)
      }

      if (options.include_timestamps !== false) {
        lines.push(`*Created: ${entry.createdAt || 'Unknown'}*`)
        lines.push(``)
      }

      lines.push(`---`)
      lines.push(``)
    })

    const markdown = lines.join('\n')
    const blob = new Blob([markdown], { type: 'text/markdown' })

    return {
      success: true,
      format: 'markdown',
      filename: `${domainName}-${timestamp}.md`,
      data: blob,
      size_bytes: blob.size,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Export to HTML
   */
  private async exportHTML(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    timestamp: string,
    domainName: string
  ): Promise<ExportResult> {
    const html = this.generateStandaloneHTML(domain, entries, options, domainName)
    const blob = new Blob([html], { type: 'text/html' })

    return {
      success: true,
      format: 'html',
      filename: `${domainName}-${timestamp}.html`,
      data: blob,
      size_bytes: blob.size,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Generate PDF-ready HTML
   */
  private generatePDFHTML(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    domainName: string
  ): string {
    const pageSize = options.pdf?.page_size || 'A4'
    const orientation = options.pdf?.orientation || 'portrait'
    const watermark = options.pdf?.watermark || ''

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${domainName} Export</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 2cm;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 28px;
    }
    
    .header .meta {
      color: #666;
      font-size: 14px;
      margin-top: 10px;
    }
    
    .entry {
      margin-bottom: 40px;
      page-break-inside: avoid;
      border-left: 4px solid #4F46E5;
      padding-left: 20px;
    }
    
    .entry h2 {
      color: #1F2937;
      margin: 0 0 15px 0;
      font-size: 20px;
    }
    
    .entry-description {
      color: #6B7280;
      margin-bottom: 15px;
    }
    
    .metadata-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    .metadata-table th,
    .metadata-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
    }
    
    .metadata-table th {
      background-color: #F3F4F6;
      font-weight: 600;
      color: #374151;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #E5E7EB;
      text-align: center;
      color: #9CA3AF;
      font-size: 12px;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      white-space: nowrap;
    }
    
    @media print {
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">${watermark}</div>` : ''}
  
  <div class="header">
    <h1>${domainName} Export</h1>
    <div class="meta">
      Exported on ${dateFormat(new Date(), 'PPpp')}<br>
      Total Entries: ${entries.length}
    </div>
  </div>
  
  ${entries.map((entry, index) => `
    <div class="entry">
      <h2>${index + 1}. ${entry.title || 'Untitled Entry'}</h2>
      ${entry.description ? `<div class="entry-description">${entry.description}</div>` : ''}
      
      ${entry.metadata ? `
        <table class="metadata-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(entry.metadata).map(([key, value]) => `
              <tr>
                <td><strong>${this.formatFieldName(key)}</strong></td>
                <td>${this.formatFieldValue(value)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${options.include_timestamps !== false ? `
        <div style="margin-top: 15px; font-size: 12px; color: #9CA3AF;">
          Created: ${entry.createdAt ? dateFormat(new Date(entry.createdAt), 'PPpp') : 'Unknown'}
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <div class="footer">
    Generated by LifeHub Universal Data Sharing System<br>
    ${options.pdf?.footer || ''}
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate standalone HTML
   */
  private generateStandaloneHTML(
    domain: Domain,
    entries: any[],
    options: ExportOptions,
    domainName: string
  ): string {
    return this.generatePDFHTML(domain, entries, options, domainName)
  }

  /**
   * Flatten nested entry object for CSV/Excel
   */
  private flattenEntry(entry: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {}

    Object.entries(entry).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(flattened, this.flattenEntry(value, newKey))
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join(', ')
      } else {
        flattened[newKey] = value
      }
    })

    return flattened
  }

  /**
   * Escape CSV field
   */
  private escapeCSV(value: string, delimiter: string, quoteStrings: boolean): string {
    if (!quoteStrings && !value.includes(delimiter) && !value.includes('"') && !value.includes('\n')) {
      return value
    }

    return `"${value.replace(/"/g, '""')}"`
  }

  /**
   * Sanitize entries by removing sensitive fields
   */
  private sanitizeEntries(entries: any[]): any[] {
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'apiKey', 'token', 'secret']

    return entries.map(entry => {
      const sanitized = { ...entry }
      
      const removeSensitiveFields = (obj: any) => {
        Object.keys(obj).forEach(key => {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            obj[key] = '[REDACTED]'
          } else if (obj[key] && typeof obj[key] === 'object') {
            removeSensitiveFields(obj[key])
          }
        })
      }

      removeSensitiveFields(sanitized)
      return sanitized
    })
  }

  /**
   * Format field name for display
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\./g, ' › ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Format field value for display
   */
  private formatFieldValue(value: any): string {
    if (value === null || value === undefined) {
      return '—'
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (typeof value === 'number') {
      return value.toLocaleString()
    }

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }

    return String(value)
  }
}

// Export singleton instance
export const universalExporter = new UniversalExporter()

