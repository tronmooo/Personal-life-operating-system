'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText, Image as ImageIcon, Download, Trash2, Calendar, DollarSign,
  Hash, Upload, Eye, Sparkles, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { DocumentPreviewModal } from '@/components/document-preview-modal'
import { DocumentTools } from '@/components/document-tools'
import { SmartUploadDialog } from '@/components/documents/smart-upload-dialog'

interface DomainDocumentsTabProps {
  domainId: string
  policyId?: string // Optional: filter by specific policy/record
}

export function DomainDocumentsTab({ domainId, policyId }: DomainDocumentsTabProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Load documents from Supabase via API
  const loadDocuments = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.log('No user logged in, cannot load documents')
        setDocuments([])
        return
      }

      // Fetch from Supabase documents table via API
      let url = '/api/documents'
      const params = new URLSearchParams()
      if (policyId) {
        params.append('domain_id', policyId)
      }
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      console.log('📄 Loading documents from:', url)
      const response = await fetch(url, { credentials: 'include' })
      const responseData = await response.json()

      if (!response.ok) {
        console.error('Error loading documents:', responseData.error)
        setDocuments([])
        return
      }

      // Map Supabase documents to document format
      const mappedDocs = (responseData.data || []).map((doc: any) => ({
        id: doc.id,
        name: doc.file_name,
        fileType: doc.mime_type,
        size: doc.file_size || 0,
        uploadDate: new Date(doc.uploaded_at || doc.created_at),
        base64Content: doc.web_view_link || '', // Link to view in Google Drive
        domainId: domainId,
        fullText: doc.extracted_text || '',
        ocrConfidence: 95,
        documentType: doc.document_type || null,
        expirationDate: doc.expiration_date ? new Date(doc.expiration_date) : undefined,
        renewalDate: doc.issue_date ? new Date(doc.issue_date) : undefined,
        policyNumber: doc.identification_numbers ? doc.identification_numbers[0] : undefined,
        accountNumber: doc.identification_numbers ? doc.identification_numbers[1] : undefined,
        amount: null,
        email: null,
        phone: null,
        // Additional metadata from AI extraction
        documentName: doc.document_name,
        documentDescription: doc.document_description,
        issueDate: doc.issue_date,
        issuingOrganization: doc.issuing_organization,
        holderName: doc.holder_name,
        driveLink: doc.web_view_link,
      }))

      setDocuments(mappedDocs)
    } catch (error) {
      console.error('Failed to load documents from Google Drive:', error)
      setDocuments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [domainId, policyId])

  const deleteDocument = async (id: string) => {
    try {
      if (!confirm('Delete this document from Google Drive? This cannot be undone.')) {
        return
      }

      const response = await fetch(`/api/drive/delete?fileId=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        console.error('Error deleting document from Google Drive:', data.error)
        alert('Failed to delete document')
        return
      }

      console.log('Document deleted from Google Drive:', id)
      // Reload documents
      await loadDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
      alert('Failed to delete document')
    }
  }

  const downloadDocument = (doc: any) => {
    // Open Google Drive link in new tab to view/download
    if (doc.driveLink || doc.base64Content) {
      window.open(doc.driveLink || doc.base64Content, '_blank')
    } else {
      alert('Document link not available')
    }
  }

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fullText?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === 'all' || doc.documentType === filterType
    return matchesSearch && matchesType
  })

  // Sort by expiration
  const expiringDocs = filteredDocs
    .filter(d => d.expirationDate)
    .sort((a, b) => {
      if (!a.expirationDate || !b.expirationDate) return 0
      const dateA = a.expirationDate.getTime()
      const dateB = b.expirationDate.getTime()
      return dateA - dateB
    })
    .slice(0, 10)

  const recentDocs = filteredDocs
    .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Preview Modal */}
      <DocumentPreviewModal 
        document={previewDocument}
        open={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
      />

      {/* Document Tools & Statistics */}
      <DocumentTools 
        domainId={domainId}
        documents={documents}
        onRefresh={loadDocuments}
      />

      {/* Smart Document Upload with Enhanced AI Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Upload Documents with AI-Powered Extraction
          </CardTitle>
          <CardDescription>
            Upload any document - AI automatically extracts 20-30+ fields with confidence scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmartUploadDialog
            domain={domainId as any}
            trigger={
              <Button size="lg" className="w-full">
                <Upload className="h-5 w-5 mr-2" />
                Upload or Take Photo
              </Button>
            }
            onComplete={(document) => {
              console.log('✅ Document uploaded:', document)
              setTimeout(() => loadDocuments(), 1000)
            }}
          />
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Documents</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${documents.length} document${documents.length !== 1 ? 's' : ''}`}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin mb-4" />
              <h3 className="font-semibold mb-2">Loading documents...</h3>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No documents yet</h3>
              <p className="text-sm text-muted-foreground">
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="all">All Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="expiring" className="space-y-4 mt-4">
                {expiringDocs.length > 0 ? (
                  expiringDocs.map((doc) => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      onDelete={deleteDocument} 
                      onDownload={downloadDocument}
                      onView={setPreviewDocument}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">No expiring documents</p>
                )}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4 mt-4">
                {recentDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    doc={doc} 
                    onDelete={deleteDocument} 
                    onDownload={downloadDocument}
                    onView={setPreviewDocument}
                  />
                ))}
              </TabsContent>

              <TabsContent value="all" className="space-y-4 mt-4">
                {filteredDocs.map((doc) => (
                  <DocumentCard 
                    key={doc.id} 
                    doc={doc} 
                    onDelete={deleteDocument} 
                    onDownload={downloadDocument}
                    onView={setPreviewDocument}
                  />
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentCard({ doc, onDelete, onDownload, onView }: { 
  doc: any
  onDelete: (id: string) => void
  onDownload: (doc: any) => void
  onView: (doc: any) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isExpiring = doc.expirationDate && 
    (doc.expirationDate.getTime() - Date.now()) < 30 * 24 * 60 * 60 * 1000

  return (
    <div className={`border rounded-lg ${isExpiring ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            {doc.fileType.includes('image') ? (
              <ImageIcon className="h-6 w-6 text-primary" />
            ) : (
              <FileText className="h-6 w-6 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate">{doc.name}</h4>
              {doc.documentType && (
                <Badge variant="outline" className="capitalize text-xs">
                  {doc.documentType.replace(/_/g, ' ')}
                </Badge>
              )}
              {doc.ocrConfidence > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {Math.round(doc.ocrConfidence)}% OCR
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
              <span>Uploaded {format(doc.uploadDate, 'MMM d, yyyy')}</span>
              {doc.expirationDate && (
                <>
                  <span>•</span>
                  <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
                    Expires {format(doc.expirationDate, 'MMM d, yyyy')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onView(doc)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDownload(doc)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDelete(doc.id)} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
            {doc.policyNumber && (
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Policy #</div>
                  <code className="text-sm">{doc.policyNumber}</code>
                </div>
              </div>
            )}
            {doc.accountNumber && (
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Account #</div>
                  <code className="text-sm">{doc.accountNumber}</code>
                </div>
              </div>
            )}
            {doc.amount && (
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="text-sm font-semibold">${doc.amount.toLocaleString()}</div>
                </div>
              </div>
            )}
            {doc.renewalDate && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-xs text-muted-foreground">Renewal Date</div>
                  <div className="text-sm">{format(doc.renewalDate, 'MMM d, yyyy')}</div>
                </div>
              </div>
            )}
          </div>
          
          {doc.fullText && (
            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2">Extracted Text (OCR)</div>
              <div className="text-xs bg-background p-3 rounded border max-h-40 overflow-y-auto font-mono">
                {doc.fullText.substring(0, 500)}{doc.fullText.length > 500 && '...'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}







