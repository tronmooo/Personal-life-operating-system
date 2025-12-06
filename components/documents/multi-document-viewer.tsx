'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  DollarSign,
  Hash,
  X,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'

interface Document {
  id: string
  file_name?: string
  document_name?: string
  domain?: string
  mime_type?: string
  file_url?: string
  web_view_link?: string
  web_content_link?: string
  file_data?: string
  extracted_data?: any
  ocr_text?: string
  extracted_text?: string
  notes?: string
  created_at?: string
  updated_at?: string
  expiration_date?: string
  policy_number?: string
  account_number?: string
  amount?: number
}

interface MultiDocumentViewerProps {
  documents: Document[] | null
  open: boolean
  onClose: () => void
}

export function MultiDocumentViewer({ documents, open, onClose }: MultiDocumentViewerProps) {
  const [activeTab, setActiveTab] = useState('0')

  if (!documents || documents.length === 0) {
    return null
  }

  const handleDownload = (doc: Document) => {
    const url = doc.web_content_link || doc.file_url
    if (url) {
      window.open(url, '_blank')
    } else if (doc.file_data) {
      // Download from base64 data
      const link = document.createElement('a')
      link.href = doc.file_data
      link.download = doc.file_name || doc.document_name || 'document'
      link.click()
    }
  }

  const getDocumentName = (doc: Document) => {
    return doc.document_name || doc.file_name || 'Untitled Document'
  }

  const isImage = (doc: Document) => {
    return doc.mime_type?.includes('image')
  }

  const isPDF = (doc: Document) => {
    return doc.mime_type?.includes('pdf')
  }

  const getPreviewUrl = (doc: Document) => {
    return doc.web_view_link || doc.file_url || doc.file_data
  }

  const renderExtractedFields = (doc: Document) => {
    const fields = []

    // Add structured fields
    if (doc.policy_number) {
      fields.push({ icon: Hash, label: 'Policy Number', value: doc.policy_number })
    }
    if (doc.account_number) {
      fields.push({ icon: Hash, label: 'Account Number', value: doc.account_number })
    }
    if (doc.amount) {
      fields.push({
        icon: DollarSign,
        label: 'Amount',
        value: `$${doc.amount.toFixed(2)}`,
      })
    }
    if (doc.expiration_date) {
      fields.push({
        icon: Calendar,
        label: 'Expiration',
        value: format(new Date(doc.expiration_date), 'MMM d, yyyy'),
      })
    }

    // Add fields from extracted_data JSONB
    if (doc.extracted_data && typeof doc.extracted_data === 'object') {
      Object.entries(doc.extracted_data).forEach(([key, value]) => {
        // Skip if already added above or if value is complex object
        if (
          ['policy_number', 'account_number', 'amount', 'expiration_date'].includes(key) ||
          typeof value === 'object'
        ) {
          return
        }

        // Format key as label
        const label = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())

        fields.push({
          icon: FileText,
          label,
          value: String(value),
        })
      })
    }

    return fields
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Documents ({documents.length})
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start overflow-x-auto flex-shrink-0">
            {documents.map((doc, index) => (
              <TabsTrigger key={doc.id} value={String(index)} className="flex-shrink-0">
                {isImage(doc) ? (
                  <ImageIcon className="h-4 w-4 mr-2" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                {getDocumentName(doc)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {documents.map((doc, index) => (
              <TabsContent key={doc.id} value={String(index)} className="space-y-4 mt-4">
                {/* Document Info Bar */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{doc.domain || 'General'}</Badge>
                    {doc.created_at && (
                      <span className="text-sm text-muted-foreground">
                        Uploaded {format(new Date(doc.created_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {getPreviewUrl(doc) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getPreviewUrl(doc), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    )}
                  </div>
                </div>

                {/* Document Preview */}
                <div className="rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-900">
                  {isImage(doc) && getPreviewUrl(doc) && (
                    <div className="p-4">
                      <img
                        src={getPreviewUrl(doc)!}
                        alt={getDocumentName(doc)}
                        className="w-full h-auto max-h-[500px] object-contain mx-auto"
                      />
                    </div>
                  )}
                  {isPDF(doc) && getPreviewUrl(doc) && (
                    <div className="w-full h-[500px]">
                      <iframe
                        src={getPreviewUrl(doc)!}
                        className="w-full h-full"
                        title={getDocumentName(doc)}
                      />
                    </div>
                  )}
                  {!isImage(doc) && !isPDF(doc) && (
                    <div className="p-8 text-center">
                      <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Preview not available for this file type
                      </p>
                      <Button onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download to View
                      </Button>
                    </div>
                  )}
                </div>

                {/* Extracted Fields */}
                {renderExtractedFields(doc).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Extracted Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderExtractedFields(doc).map((field, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-3 rounded-lg bg-accent"
                          >
                            <field.icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-muted-foreground">{field.label}</div>
                              <div className="text-sm font-medium truncate">{field.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {doc.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {doc.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* OCR Text (collapsed by default) */}
                {(doc.ocr_text || doc.extracted_text) && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      View Full Text (OCR)
                    </summary>
                    <Card className="mt-2">
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                          {doc.ocr_text || doc.extracted_text}
                        </p>
                      </CardContent>
                    </Card>
                  </details>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>

        {/* Footer with close button */}
        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            Viewing {parseInt(activeTab) + 1} of {documents.length}
          </span>
          <Button onClick={onClose} variant="outline">
            Close All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}




















