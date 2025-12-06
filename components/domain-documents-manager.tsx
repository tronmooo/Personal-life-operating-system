'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText, Image, Download, Trash2, Calendar, DollarSign,
  Hash, Search, Filter, Eye, Sparkles, AlertCircle, CheckCircle,
  Upload, File
} from 'lucide-react'
import { SmartDocument } from '@/types/documents'
import { SmartDocumentUploader } from './smart-document-uploader'
import { SmartUploadDialog } from './documents/smart-upload-dialog'
import { Domain } from '@/types/domains'
import { format } from 'date-fns'

interface DomainDocumentsManagerProps {
  domain: string
  documents: SmartDocument[]
  onDocumentAdded: (document: SmartDocument) => void
  onDocumentDeleted: (documentId: string) => void
}

export function DomainDocumentsManager({
  domain,
  documents,
  onDocumentAdded,
  onDocumentDeleted
}: DomainDocumentsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedDocument, setSelectedDocument] = useState<SmartDocument | null>(null)

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchQuery === '' || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.ocrText?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = filterType === 'all' || 
        doc.extractedData.documentType === filterType

      return matchesSearch && matchesType
    })
  }, [documents, searchQuery, filterType])

  // Get unique document types
  const documentTypes = useMemo(() => {
    const types = new Set(documents.map(d => d.extractedData.documentType).filter(Boolean))
    return Array.from(types)
  }, [documents])

  // Categorize documents
  const categorized = useMemo(() => {
    return {
      expiring: filteredDocuments.filter(d => {
        if (!d.extractedData.expirationDate) return false
        const daysUntil = Math.ceil(
          (new Date(d.extractedData.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntil > 0 && daysUntil <= 90
      }),
      recent: filteredDocuments
        .filter(d => {
          const daysSince = Math.ceil((new Date().getTime() - new Date(d.uploadedAt).getTime()) / (1000 * 60 * 60 * 24))
          return daysSince <= 30
        })
        .slice(0, 10),
      all: filteredDocuments
    }
  }, [filteredDocuments])

  const handleDocumentUploaded = async (doc: SmartDocument) => {
    // Save to Supabase
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: doc.domain,
          document_name: doc.name,
          file_name: doc.name,
          document_type: doc.type,
          mime_type: doc.type,
          file_size: doc.size,
          file_data: doc.data,
          file_url: doc.url,
          tags: doc.tags,
          metadata: doc.metadata,
          ocr_processed: doc.ocrProcessed,
          ocr_text: doc.ocrText,
          ocr_confidence: doc.ocrConfidence,
          extracted_data: doc.extractedData,
          notes: doc.notes,
          expiration_date: doc.extractedData?.expirationDate,
          renewal_date: doc.extractedData?.renewalDate,
          policy_number: doc.extractedData?.policyNumber,
          account_number: doc.extractedData?.accountNumber,
          amount: doc.extractedData?.amount,
          reminder_created: doc.reminderCreated,
          reminder_id: doc.reminderId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save document')
      }

      const { data: savedDoc } = await response.json()
      
      // Update doc with saved ID
      const docWithId = { ...doc, id: savedDoc.id }
      onDocumentAdded(docWithId)
    } catch (error: any) {
      console.error('Error saving document:', error)
      alert('Failed to save document: ' + error.message)
    }
  }

  const downloadDocument = (doc: SmartDocument) => {
    const link = document.createElement('a')
    link.href = doc.data || doc.url || ''
    link.download = doc.name
    link.click()
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete document')
      }

      onDocumentDeleted(docId)
    } catch (error: any) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold capitalize">{domain} Documents</h2>
          <p className="text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''} with AI-powered OCR
          </p>
        </div>
        <SmartUploadDialog
          domain={domain as Domain}
          trigger={
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          }
          onComplete={(doc) => {
            // Refresh documents list
            onDocumentAdded(doc)
          }}
        />
      </div>

      {/* Search and Filters */}
      {documents.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>
                    {type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Expiring, Recent, All */}
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expiring">
            Expiring Soon
            {categorized.expiring.length > 0 && (
              <Badge className="ml-2 bg-orange-500">{categorized.expiring.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="expiring" className="space-y-4 mt-4">
          {categorized.expiring.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p>No expiring documents in the next 90 days</p>
              </CardContent>
            </Card>
          ) : (
            categorized.expiring.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => setSelectedDocument(doc)}
                onDownload={() => downloadDocument(doc)}
                onDelete={() => handleDelete(doc.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="recent" className="space-y-4 mt-4">
          {categorized.recent.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded in the last 30 days</p>
              </CardContent>
            </Card>
          ) : (
            categorized.recent.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => setSelectedDocument(doc)}
                onDownload={() => downloadDocument(doc)}
                onDelete={() => handleDelete(doc.id)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-4">
          {categorized.all.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents yet. Click &quot;Upload Document&quot; above to get started!</p>
              </CardContent>
            </Card>
          ) : (
            categorized.all.map(doc => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onView={() => setSelectedDocument(doc)}
                onDownload={() => downloadDocument(doc)}
                onDelete={() => handleDelete(doc.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDocument && (
            <DocumentDetailView
              document={selectedDocument}
              onDownload={() => downloadDocument(selectedDocument)}
              onClose={() => setSelectedDocument(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Document Card Component
function DocumentCard({
  document,
  onView,
  onDownload,
  onDelete
}: {
  document: SmartDocument
  onView: () => void
  onDownload: () => void
  onDelete: () => void
}) {
  const daysUntilExpiration = document.extractedData.expirationDate
    ? Math.ceil((new Date(document.extractedData.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className={daysUntilExpiration && daysUntilExpiration <= 30 ? 'border-orange-500' : ''}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            {document.type === 'application/pdf' ? (
              <FileText className="h-10 w-10 text-red-500" />
            ) : (
              <Image className="h-10 w-10 text-blue-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold truncate">{document.name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {document.extractedData.documentType && (
                    <Badge variant="outline" className="capitalize">
                      {document.extractedData.documentType.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {document.ocrProcessed && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      <Sparkles className="h-3 w-3 mr-1" />
                      OCR {document.ocrConfidence}%
                    </Badge>
                  )}
                  {document.reminderCreated && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Reminder Set
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={onView}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Extracted Data */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {document.extractedData.expirationDate && (
                <div className={`flex items-center gap-2 ${daysUntilExpiration && daysUntilExpiration <= 30 ? 'text-orange-600' : ''}`}>
                  <Calendar className="h-4 w-4" />
                  <span className="truncate">
                    {daysUntilExpiration && daysUntilExpiration > 0
                      ? `Expires in ${daysUntilExpiration}d`
                      : 'Expired'}
                  </span>
                </div>
              )}
              {document.extractedData.amount && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="truncate">${document.extractedData.amount.toLocaleString()}</span>
                </div>
              )}
              {document.extractedData.policyNumber && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span className="truncate">{document.extractedData.policyNumber}</span>
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              Uploaded {format(new Date(document.uploadedAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Document Detail View
function DocumentDetailView({
  document,
  onDownload,
  onClose
}: {
  document: SmartDocument
  onDownload: () => void
  onClose: () => void
}) {
  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {document.type === 'application/pdf' ? (
            <FileText className="h-5 w-5" />
          ) : (
            <Image className="h-5 w-5" />
          )}
          {document.name}
        </DialogTitle>
      </DialogHeader>

      {/* Preview */}
      {document.type.startsWith('image/') && (
        <div className="rounded-lg overflow-hidden border">
          <img src={document.data} alt={document.name} className="w-full" />
        </div>
      )}

      {/* Extracted Information */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI-Extracted Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {document.extractedData.documentType && (
            <InfoField label="Document Type" value={document.extractedData.documentType.replace(/_/g, ' ')} />
          )}
          {document.extractedData.expirationDate && (
            <InfoField 
              label="Expiration Date" 
              value={format(new Date(document.extractedData.expirationDate), 'MMMM dd, yyyy')} 
              icon={<Calendar className="h-4 w-4 text-orange-500" />}
            />
          )}
          {document.extractedData.renewalDate && (
            <InfoField 
              label="Renewal Date" 
              value={format(new Date(document.extractedData.renewalDate), 'MMMM dd, yyyy')} 
              icon={<Calendar className="h-4 w-4 text-blue-500" />}
            />
          )}
          {document.extractedData.policyNumber && (
            <InfoField label="Policy Number" value={document.extractedData.policyNumber} />
          )}
          {document.extractedData.accountNumber && (
            <InfoField label="Account Number" value={document.extractedData.accountNumber} />
          )}
          {document.extractedData.amount && (
            <InfoField 
              label="Amount" 
              value={`$${document.extractedData.amount.toLocaleString()}`}
              icon={<DollarSign className="h-4 w-4 text-green-600" />}
            />
          )}
        </div>
      </div>

      {/* OCR Text */}
      {document.ocrText && (
        <div>
          <h3 className="font-semibold mb-2">Full OCR Text</h3>
          <div className="p-4 rounded-lg bg-accent max-h-60 overflow-y-auto text-sm font-mono">
            {document.ocrText}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={onDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={onClose} variant="outline" className="flex-1">
          Close
        </Button>
      </div>
    </div>
  )
}

function InfoField({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-accent">
      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="font-medium capitalize">{value}</div>
    </div>
  )
}







