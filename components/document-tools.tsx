'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Download, Upload, Trash2, FolderOpen, FileText, 
  Filter, Tag, Calendar, TrendingUp, Archive
} from 'lucide-react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Badge } from '@/components/ui/badge'

interface DocumentToolsProps {
  domainId: string
  documents: any[]
  onRefresh: () => void
}

export function DocumentTools({ domainId, documents, onRefresh }: DocumentToolsProps) {
  const [isExporting, setIsExporting] = useState(false)
  const supabase = createClientComponentClient()

  // Export all documents as JSON
  const exportDocuments = () => {
    setIsExporting(true)
    try {
      const exportData = {
        domain: domainId,
        exportDate: new Date().toISOString(),
        documentCount: documents.length,
        documents: documents.map(doc => ({
          name: doc.name,
          type: doc.documentType,
          uploadDate: doc.uploadDate,
          expirationDate: doc.expirationDate,
          ocrText: doc.fullText,
          extractedData: {
            policyNumber: doc.policyNumber,
            accountNumber: doc.accountNumber,
            amount: doc.amount,
          }
        }))
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `documents-${domainId}-${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  // Export OCR text report
  const exportOCRReport = () => {
    const report = documents.map(doc => ({
      'Document Name': doc.name,
      'Document Type': doc.documentType || 'Unknown',
      'Upload Date': doc.uploadDate?.toLocaleDateString(),
      'Expiration Date': doc.expirationDate?.toLocaleDateString() || 'N/A',
      'OCR Confidence': doc.ocrConfidence ? `${Math.round(doc.ocrConfidence)}%` : 'N/A',
      'Policy Number': doc.policyNumber || 'N/A',
      'Account Number': doc.accountNumber || 'N/A',
      'Amount': doc.amount ? `$${doc.amount.toLocaleString()}` : 'N/A',
      'Extracted Text': doc.fullText?.substring(0, 200) || 'N/A'
    }))

    const csvContent = convertToCSV(report)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `ocr-report-${domainId}-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Delete all documents
  const deleteAllDocuments = async () => {
    if (!confirm(`Are you sure you want to delete all ${documents.length} documents? This cannot be undone.`)) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('user_id', user.id)
        .eq('domain_id', domainId)

      if (error) {
        console.error('Error deleting documents:', error)
        alert('Failed to delete documents')
        return
      }

      alert('All documents deleted successfully')
      onRefresh()
    } catch (error) {
      console.error('Failed to delete documents:', error)
    }
  }

  // Statistics
  const stats = {
    total: documents.length,
    withOCR: documents.filter(d => d.fullText && d.fullText.length > 0).length,
    expiring: documents.filter(d => {
      if (!d.expirationDate) return false
      const daysUntil = Math.ceil((d.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 30
    }).length,
    withPolicyNumbers: documents.filter(d => d.policyNumber).length,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Document Tools & Stats
        </CardTitle>
        <CardDescription>
          Manage and analyze your documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Documents</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{stats.withOCR}</div>
            <div className="text-xs text-muted-foreground">OCR Processed</div>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
            <div className="text-xs text-muted-foreground">Expiring Soon</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.withPolicyNumbers}</div>
            <div className="text-xs text-muted-foreground">With Policy #</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="text-sm font-medium mb-2">Quick Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={exportDocuments}
              disabled={isExporting || documents.length === 0}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={exportOCRReport}
              disabled={documents.length === 0}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <Button
            variant="destructive"
            onClick={deleteAllDocuments}
            disabled={documents.length === 0}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Documents
          </Button>
        </div>

        {/* Document Type Breakdown */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Document Types</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(documents.map(d => d.documentType).filter(Boolean))).map(type => {
                const count = documents.filter(d => d.documentType === type).length
                return (
                  <Badge key={type} variant="secondary" className="capitalize">
                    {type?.replace(/_/g, ' ')}: {count}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to convert JSON to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        const escaped = String(value).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(',')
    )
  ]

  return csvRows.join('\n')
}






























