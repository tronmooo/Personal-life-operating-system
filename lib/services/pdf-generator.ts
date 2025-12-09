/**
 * PDF Generator Service
 * Generates PDFs from charts, data summaries, and visualizations
 */

import { Domain, DOMAIN_CONFIGS } from '@/types/domains'

// ============================================================================
// TYPES
// ============================================================================

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar'
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
  config?: {
    height?: number
    colors?: string[]
    showLegend?: boolean
    showGrid?: boolean
  }
}

export interface TableData {
  title: string
  headers: string[]
  rows: (string | number)[][]
  footer?: string[]
}

export interface SummaryStats {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
}

export interface PDFSection {
  type: 'header' | 'text' | 'chart' | 'table' | 'stats' | 'spacer' | 'divider'
  content: string | ChartData | TableData | SummaryStats[]
  style?: Record<string, string>
}

export interface PDFGenerateRequest {
  title: string
  subtitle?: string
  sections: PDFSection[]
  options?: {
    pageSize?: 'A4' | 'Letter' | 'Legal'
    orientation?: 'portrait' | 'landscape'
    header?: string
    footer?: string
    watermark?: string
    includeTimestamp?: boolean
  }
}

export interface PDFGenerateResult {
  html: string
  filename: string
}

// ============================================================================
// PDF GENERATOR CLASS
// ============================================================================

export class PDFGenerator {
  /**
   * Generate PDF HTML from structured request
   */
  generatePDF(request: PDFGenerateRequest): PDFGenerateResult {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${request.title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.pdf`

    const sectionsHtml = request.sections.map(section => this.renderSection(section)).join('\n')

    const html = this.wrapInDocument({
      title: request.title,
      subtitle: request.subtitle,
      content: sectionsHtml,
      options: request.options
    })

    return { html, filename }
  }

  /**
   * Generate PDF from domain data with auto-visualization
   */
  generateDomainReport(options: {
    domain: Domain
    entries: any[]
    includeCharts?: boolean
    includeSummary?: boolean
    title?: string
  }): PDFGenerateResult {
    const domainConfig = DOMAIN_CONFIGS[options.domain]
    const domainName = domainConfig?.name || options.domain
    const sections: PDFSection[] = []

    // Add summary stats if requested
    if (options.includeSummary !== false) {
      const stats = this.calculateDomainStats(options.domain, options.entries)
      if (stats.length > 0) {
        sections.push({
          type: 'stats',
          content: stats
        })
        sections.push({ type: 'spacer', content: '' })
      }
    }

    // Add chart if requested and applicable
    if (options.includeCharts !== false && options.entries.length > 1) {
      const chartData = this.generateDomainChart(options.domain, options.entries)
      if (chartData) {
        sections.push({
          type: 'chart',
          content: chartData
        })
        sections.push({ type: 'spacer', content: '' })
      }
    }

    // Add data table
    const tableData = this.entriesToTable(options.entries)
    sections.push({
      type: 'table',
      content: tableData
    })

    return this.generatePDF({
      title: options.title || `${domainName} Report`,
      subtitle: `${options.entries.length} entries`,
      sections,
      options: {
        includeTimestamp: true
      }
    })
  }

  /**
   * Generate PDF from chart visualization
   */
  generateChartPDF(chartData: ChartData, options?: {
    title?: string
    description?: string
    includeData?: boolean
  }): PDFGenerateResult {
    const sections: PDFSection[] = []

    if (options?.description) {
      sections.push({
        type: 'text',
        content: options.description
      })
      sections.push({ type: 'spacer', content: '' })
    }

    sections.push({
      type: 'chart',
      content: chartData
    })

    if (options?.includeData && chartData.data) {
      sections.push({ type: 'divider', content: '' })
      sections.push({
        type: 'text',
        content: '**Raw Data**'
      })
      
      // Convert chart data to table
      const tableData = this.chartDataToTable(chartData)
      sections.push({
        type: 'table',
        content: tableData
      })
    }

    return this.generatePDF({
      title: options?.title || chartData.title,
      sections,
      options: {
        includeTimestamp: true
      }
    })
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private renderSection(section: PDFSection): string {
    switch (section.type) {
      case 'header':
        return `<h2 style="color: #1f2937; margin: 20px 0;">${section.content}</h2>`

      case 'text':
        const text = String(section.content)
        const htmlText = text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n/g, '<br>')
        return `<p style="color: #4b5563; margin: 15px 0;">${htmlText}</p>`

      case 'stats':
        return this.renderStats(section.content as SummaryStats[])

      case 'chart':
        return this.renderChart(section.content as ChartData)

      case 'table':
        return this.renderTable(section.content as TableData)

      case 'spacer':
        return '<div style="height: 20px;"></div>'

      case 'divider':
        return '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">'

      default:
        return ''
    }
  }

  private renderStats(stats: SummaryStats[]): string {
    return `
      <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
        ${stats.map(stat => `
          <div style="flex: 1; min-width: 150px; background: #f3f4f6; padding: 20px; border-radius: 8px;">
            <div style="color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">
              ${stat.label}
            </div>
            <div style="font-size: 24px; font-weight: bold; color: #1f2937;">
              ${stat.value}
            </div>
            ${stat.change !== undefined ? `
              <div style="font-size: 12px; color: ${stat.change >= 0 ? '#10b981' : '#ef4444'}; margin-top: 5px;">
                ${stat.change >= 0 ? '↑' : '↓'} ${Math.abs(stat.change)}% ${stat.changeLabel || ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `
  }

  private renderChart(chartData: ChartData): string {
    // Generate SVG-based chart for PDF
    const width = 700
    const height = chartData.config?.height || 300
    const padding = 50
    const colors = chartData.config?.colors || ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

    let svg = ''

    switch (chartData.type) {
      case 'bar':
        svg = this.generateBarChartSVG(chartData.data, width, height, padding, colors)
        break
      case 'line':
        svg = this.generateLineChartSVG(chartData.data, width, height, padding, colors)
        break
      case 'pie':
        svg = this.generatePieChartSVG(chartData.data, width, height, colors)
        break
      default:
        // Fallback to data table
        return this.renderTable(this.chartDataToTable(chartData))
    }

    return `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">${chartData.title}</h3>
        <div style="background: #fafafa; border-radius: 8px; padding: 20px; overflow-x: auto;">
          ${svg}
        </div>
        ${chartData.xAxis || chartData.yAxis ? `
          <div style="display: flex; justify-content: space-between; color: #6b7280; font-size: 12px; margin-top: 10px;">
            ${chartData.xAxis ? `<span>X: ${chartData.xAxis}</span>` : ''}
            ${chartData.yAxis ? `<span>Y: ${chartData.yAxis}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  private generateBarChartSVG(data: any[], width: number, height: number, padding: number, colors: string[]): string {
    if (!data || data.length === 0) return '<p>No data</p>'

    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    const barWidth = Math.min(60, chartWidth / data.length - 10)
    const maxValue = Math.max(...data.map(d => d.value || d.amount || 0))

    const bars = data.map((d, i) => {
      const value = d.value || d.amount || 0
      const barHeight = (value / maxValue) * chartHeight
      const x = padding + (i * (chartWidth / data.length)) + (chartWidth / data.length - barWidth) / 2
      const y = padding + chartHeight - barHeight
      const color = colors[i % colors.length]
      const label = d.label || d.name || d.date || `Item ${i + 1}`

      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>
        <text x="${x + barWidth / 2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#6b7280">${label.substring(0, 10)}</text>
        <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#1f2937">${value}</text>
      `
    }).join('')

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        ${bars}
      </svg>
    `
  }

  private generateLineChartSVG(data: any[], width: number, height: number, padding: number, colors: string[]): string {
    if (!data || data.length === 0) return '<p>No data</p>'

    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    const maxValue = Math.max(...data.map(d => d.value || d.amount || 0))
    const minValue = Math.min(...data.map(d => d.value || d.amount || 0))
    const range = maxValue - minValue || 1

    const points = data.map((d, i) => {
      const value = d.value || d.amount || 0
      const x = padding + (i / (data.length - 1 || 1)) * chartWidth
      const y = padding + chartHeight - ((value - minValue) / range) * chartHeight
      return { x, y, value, label: d.label || d.date || `Point ${i + 1}` }
    })

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    
    const circles = points.map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="${colors[0]}" stroke="white" stroke-width="2"/>
    `).join('')

    const labels = points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 5) === 0)
      .map(p => `
        <text x="${p.x}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#6b7280">${p.label.substring(0, 8)}</text>
      `).join('')

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <path d="${pathD}" fill="none" stroke="${colors[0]}" stroke-width="2"/>
        ${circles}
        ${labels}
      </svg>
    `
  }

  private generatePieChartSVG(data: any[], width: number, height: number, colors: string[]): string {
    if (!data || data.length === 0) return '<p>No data</p>'

    const cx = width / 2
    const cy = height / 2
    const radius = Math.min(width, height) / 2 - 60
    const total = data.reduce((sum, d) => sum + (d.value || d.amount || 0), 0)

    let currentAngle = -Math.PI / 2
    const slices = data.map((d, i) => {
      const value = d.value || d.amount || 0
      const angle = (value / total) * Math.PI * 2
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle

      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy + radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy + radius * Math.sin(endAngle)

      const largeArc = angle > Math.PI ? 1 : 0
      const color = colors[i % colors.length]
      const label = d.label || d.name || `Item ${i + 1}`
      const percentage = ((value / total) * 100).toFixed(1)

      // Label position
      const labelAngle = startAngle + angle / 2
      const labelRadius = radius + 30
      const lx = cx + labelRadius * Math.cos(labelAngle)
      const ly = cy + labelRadius * Math.sin(labelAngle)

      return `
        <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}"/>
        <text x="${lx}" y="${ly}" text-anchor="middle" font-size="10" fill="#1f2937">${label} (${percentage}%)</text>
      `
    }).join('')

    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        ${slices}
      </svg>
    `
  }

  private renderTable(tableData: TableData): string {
    return `
      <div style="margin: 20px 0;">
        ${tableData.title ? `<h3 style="color: #1f2937; margin-bottom: 15px;">${tableData.title}</h3>` : ''}
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #f3f4f6;">
              ${tableData.headers.map(h => `
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">
                  ${h}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableData.rows.map((row, i) => `
              <tr style="${i % 2 === 1 ? 'background: #f9fafb;' : ''}">
                ${row.map(cell => `
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
                    ${cell}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
          ${tableData.footer ? `
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: 600;">
                ${tableData.footer.map(f => `
                  <td style="padding: 12px; border-top: 2px solid #e5e7eb; color: #1f2937;">
                    ${f}
                  </td>
                `).join('')}
              </tr>
            </tfoot>
          ` : ''}
        </table>
      </div>
    `
  }

  private wrapInDocument(options: {
    title: string
    subtitle?: string
    content: string
    options?: PDFGenerateRequest['options']
  }): string {
    const pageSize = options.options?.pageSize || 'A4'
    const orientation = options.options?.orientation || 'portrait'
    const timestamp = options.options?.includeTimestamp !== false ? new Date().toLocaleString() : ''

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${options.title}</title>
  <style>
    @page {
      size: ${pageSize} ${orientation};
      margin: 2cm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .document-header {
      text-align: center;
      border-bottom: 3px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    
    .document-header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    
    .document-header .subtitle {
      color: #6b7280;
      font-size: 16px;
      margin-top: 8px;
    }
    
    .document-header .timestamp {
      color: #9ca3af;
      font-size: 12px;
      margin-top: 8px;
    }
    
    .content {
      min-height: calc(100vh - 200px);
    }
    
    .document-footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 11px;
    }
    
    ${options.options?.watermark ? `
      .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 80px;
        color: rgba(0, 0, 0, 0.05);
        z-index: -1;
        white-space: nowrap;
        pointer-events: none;
      }
    ` : ''}
    
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  ${options.options?.watermark ? `<div class="watermark">${options.options.watermark}</div>` : ''}
  
  <div class="document-header">
    <h1>${options.title}</h1>
    ${options.subtitle ? `<div class="subtitle">${options.subtitle}</div>` : ''}
    ${timestamp ? `<div class="timestamp">Generated: ${timestamp}</div>` : ''}
  </div>
  
  <div class="content">
    ${options.content}
  </div>
  
  <div class="document-footer">
    ${options.options?.footer || 'Generated by LifeHub'}
  </div>
</body>
</html>
    `.trim()
  }

  private calculateDomainStats(domain: Domain, entries: any[]): SummaryStats[] {
    const stats: SummaryStats[] = []

    stats.push({
      label: 'Total Entries',
      value: entries.length
    })

    switch (domain) {
      case 'financial':
        const expenses = entries.filter(e => e.metadata?.type === 'expense')
        const income = entries.filter(e => e.metadata?.type === 'income')
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.metadata?.amount || 0), 0)
        const totalIncome = income.reduce((sum, e) => sum + (e.metadata?.amount || 0), 0)
        
        stats.push({ label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}` })
        stats.push({ label: 'Total Income', value: `$${totalIncome.toFixed(2)}` })
        stats.push({ label: 'Net', value: `$${(totalIncome - totalExpenses).toFixed(2)}` })
        break

      case 'health':
        const weights = entries.filter(e => e.metadata?.weight).map(e => e.metadata.weight)
        if (weights.length > 0) {
          stats.push({ label: 'Latest Weight', value: `${weights[0]} lbs` })
          stats.push({ label: 'Average', value: `${(weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)} lbs` })
        }
        break

      case 'fitness':
        const workouts = entries.filter(e => e.metadata?.duration)
        const totalMinutes = workouts.reduce((sum, e) => sum + (e.metadata?.duration || 0), 0)
        stats.push({ label: 'Total Workouts', value: workouts.length })
        stats.push({ label: 'Total Minutes', value: totalMinutes })
        break
    }

    return stats
  }

  private generateDomainChart(domain: Domain, entries: any[]): ChartData | null {
    // Sort by date
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    switch (domain) {
      case 'financial':
        const expensesByDate = sortedEntries
          .filter(e => e.metadata?.type === 'expense')
          .slice(-10)
          .map(e => ({
            date: new Date(e.created_at).toLocaleDateString(),
            value: e.metadata?.amount || 0,
            label: e.title
          }))

        if (expensesByDate.length > 1) {
          return {
            type: 'bar',
            title: 'Recent Expenses',
            data: expensesByDate
          }
        }
        break

      case 'health':
        const weightData = sortedEntries
          .filter(e => e.metadata?.weight)
          .slice(-10)
          .map(e => ({
            date: new Date(e.created_at).toLocaleDateString(),
            value: e.metadata.weight,
            label: new Date(e.created_at).toLocaleDateString()
          }))

        if (weightData.length > 1) {
          return {
            type: 'line',
            title: 'Weight Trend',
            data: weightData,
            yAxis: 'Weight (lbs)'
          }
        }
        break

      case 'fitness':
        const workoutData = sortedEntries
          .filter(e => e.metadata?.duration)
          .slice(-10)
          .map(e => ({
            date: new Date(e.created_at).toLocaleDateString(),
            value: e.metadata.duration,
            label: e.title || e.metadata?.exercise || 'Workout'
          }))

        if (workoutData.length > 1) {
          return {
            type: 'bar',
            title: 'Recent Workouts',
            data: workoutData,
            yAxis: 'Duration (min)'
          }
        }
        break
    }

    return null
  }

  private entriesToTable(entries: any[]): TableData {
    const headers = ['#', 'Title', 'Date', 'Details']
    const rows = entries.slice(0, 50).map((entry, i) => {
      const metadata = entry.metadata || {}
      const details = Object.entries(metadata)
        .filter(([_, v]) => v !== null && v !== undefined && v !== '')
        .slice(0, 3)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')

      return [
        i + 1,
        entry.title || 'Untitled',
        new Date(entry.created_at).toLocaleDateString(),
        details.substring(0, 50) + (details.length > 50 ? '...' : '')
      ]
    })

    return {
      title: 'Data Entries',
      headers,
      rows
    }
  }

  private chartDataToTable(chartData: ChartData): TableData {
    const headers = ['Label', 'Value']
    const rows = chartData.data.map(d => [
      d.label || d.name || d.date || '-',
      d.value || d.amount || 0
    ])

    return {
      title: `${chartData.title} - Data`,
      headers,
      rows
    }
  }
}

// Export singleton
export const pdfGenerator = new PDFGenerator()














