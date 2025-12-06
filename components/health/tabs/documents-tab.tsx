'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Upload, Download, Sparkles } from 'lucide-react'
import { useHealth } from '@/lib/context/health-context'
import { format, parseISO } from 'date-fns'
import { AutoOCRUploader } from '@/components/auto-ocr-uploader'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function DocumentsTab() {
  const { healthData } = useHealth()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>('all')

  const filteredDocuments = healthData.documents.filter(doc => {
    if (filterType === 'all') return true
    return doc.documentType === filterType
  })

  const handleDocumentUploaded = () => {
    // Refresh the list - the AutoOCRUploader already saves to the health domain
    setAddDialogOpen(false)
  }

  // Document types with counts
  const docTypes = healthData.documents.reduce((acc, doc) => {
    acc[doc.documentType] = (acc[doc.documentType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Button variant={filterType === 'all' ? 'default' : 'outline'} onClick={() => setFilterType('all')}>
          All ({healthData.documents.length})
        </Button>
        <Button variant={filterType === 'lab-results' ? 'default' : 'outline'} onClick={() => setFilterType('lab-results')}>
          Lab Results ({docTypes['lab-results'] || 0})
        </Button>
        <Button variant={filterType === 'imaging' ? 'default' : 'outline'} onClick={() => setFilterType('imaging')}>
          Imaging ({docTypes['imaging'] || 0})
        </Button>
        <Button variant={filterType === 'prescription' ? 'default' : 'outline'} onClick={() => setFilterType('prescription')}>
          Prescriptions ({docTypes['prescription'] || 0})
        </Button>
        <div className="flex-1" />
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Records & Documents</CardTitle>
          <CardDescription>Your health records and files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div key={doc.id} className="flex items-start gap-4 p-4 rounded-lg border">
                <FileText className="h-5 w-5 text-blue-500 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{doc.documentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(doc.documentDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {doc.documentType.replace('-', ' ')}
                    </Badge>
                  </div>
                  {doc.provider && (
                    <p className="text-sm text-muted-foreground">Provider: {doc.provider}</p>
                  )}
                  {doc.summary && (
                    <p className="text-sm">{doc.summary}</p>
                  )}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Document Storage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Document Storage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Documents</span>
              <span className="text-xl font-bold">{healthData.documents.length}</span>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">By Type:</div>
              {Object.entries(docTypes).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{type.replace('-', ' ')}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Document Dialog with Automatic OCR */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Upload Medical Document with AI OCR
            </DialogTitle>
            <DialogDescription>
              Upload any medical document - text will be automatically extracted and analyzed
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <AutoOCRUploader
              domainId="health"
              onDocumentUploaded={handleDocumentUploaded}
              maxSize={25}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

