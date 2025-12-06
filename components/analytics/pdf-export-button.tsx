'use client'

import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface PDFExportButtonProps {
  analyticsData: any
  fileName?: string
}

export function PDFExportButton({ analyticsData, fileName }: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const exportToPDF = async () => {
    setIsExporting(true)
    try {
      // Dynamic import for client-side only libraries
      const jsPDF = (await import('jspdf')).default
      const html2canvas = (await import('html2canvas')).default

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      let yPosition = margin

      // Title
      pdf.setFontSize(24)
      pdf.setTextColor(120, 53, 246) // Purple
      pdf.text('LifeHub Analytics Report', margin, yPosition)
      yPosition += 10

      // Date
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition)
      yPosition += 15

      // Overall Score
      if (analyticsData.overallScore !== undefined) {
        pdf.setFontSize(16)
        pdf.setTextColor(0, 0, 0)
        pdf.text('Overall Life Score', margin, yPosition)
        yPosition += 8
        
        pdf.setFontSize(36)
        pdf.setTextColor(120, 53, 246)
        pdf.text(`${analyticsData.overallScore}/100`, margin, yPosition)
        yPosition += 15
      }

      // Key Metrics
      pdf.setFontSize(14)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Key Metrics', margin, yPosition)
      yPosition += 8

      const metrics = [
        { label: 'Financial Health', value: analyticsData.financialHealth },
        { label: 'Life Balance', value: analyticsData.lifeBalance },
        { label: 'Productivity', value: analyticsData.productivity },
        { label: 'Wellbeing', value: analyticsData.wellbeing },
        { label: 'Goal Progress', value: analyticsData.goalProgress },
      ]

      pdf.setFontSize(10)
      metrics.forEach(metric => {
        if (yPosition > pageHeight - margin - 10) {
          pdf.addPage()
          yPosition = margin
        }
        
        pdf.setTextColor(100, 100, 100)
        pdf.text(metric.label, margin, yPosition)
        pdf.setTextColor(0, 0, 0)
        pdf.text(`${metric.value || 0}`, pageWidth - margin - 20, yPosition)
        
        // Progress bar
        const barWidth = pageWidth - margin * 2
        const barHeight = 4
        const progress = (metric.value || 0) / 100
        
        pdf.setFillColor(230, 230, 230)
        pdf.rect(margin, yPosition + 2, barWidth, barHeight, 'F')
        
        pdf.setFillColor(120, 53, 246)
        pdf.rect(margin, yPosition + 2, barWidth * progress, barHeight, 'F')
        
        yPosition += 12
      })

      // Active Domains
      if (analyticsData.activeDomains && analyticsData.activeDomains.length > 0) {
        yPosition += 10
        if (yPosition > pageHeight - margin - 30) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize(14)
        pdf.text('Active Domains', margin, yPosition)
        yPosition += 8

        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        const domainsText = analyticsData.activeDomains.join(', ')
        const splitDomains = pdf.splitTextToSize(domainsText, pageWidth - margin * 2)
        pdf.text(splitDomains, margin, yPosition)
        yPosition += splitDomains.length * 5 + 10
      }

      // Insights
      if (analyticsData.insights && analyticsData.insights.length > 0) {
        if (yPosition > pageHeight - margin - 40) {
          pdf.addPage()
          yPosition = margin
        }

        pdf.setFontSize(14)
        pdf.setTextColor(0, 0, 0)
        pdf.text('Key Insights', margin, yPosition)
        yPosition += 8

        analyticsData.insights.slice(0, 5).forEach((insight: any, index: number) => {
          if (yPosition > pageHeight - margin - 25) {
            pdf.addPage()
            yPosition = margin
          }

          pdf.setFontSize(10)
          pdf.setTextColor(120, 53, 246)
          pdf.text(`${index + 1}. ${insight.title}`, margin, yPosition)
          yPosition += 5

          pdf.setFontSize(9)
          pdf.setTextColor(100, 100, 100)
          const splitMessage = pdf.splitTextToSize(insight.message, pageWidth - margin * 2 - 5)
          pdf.text(splitMessage, margin + 5, yPosition)
          yPosition += splitMessage.length * 4 + 8
        })
      }

      // Footer
      const pageCount = (pdf as any).internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        )
        pdf.text('LifeHub Analytics', margin, pageHeight - 5)
      }

      // Save
      const finalFileName = fileName || `lifehub-analytics-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(finalFileName)

      toast({
        title: 'Export Successful',
        description: 'Your analytics report has been downloaded',
      })
    } catch (error) {
      console.error('PDF export error:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF report',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={exportToPDF}
      disabled={isExporting}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {isExporting ? 'Exporting...' : 'Export PDF'}
    </Button>
  )
}

