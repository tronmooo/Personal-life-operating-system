'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, FileText, Eye, Download, Trash2 } from 'lucide-react'
import { DocumentUploadScanner, UploadedDocument } from '@/components/universal/document-upload-scanner'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface DocumentsTabProps {
  petId: string
  petName: string
}

export function DocumentsTab({ petId, petName }: DocumentsTabProps) {
  const { getData, addData, deleteData } = useData()
  const [showScanner, setShowScanner] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    loadDocuments()
    
    const handleUpdate = () => loadDocuments()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('pets-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('pets-data-updated', handleUpdate)
    }
  }, [petId])

  const loadDocuments = () => {
    const petsData = getData('pets')
    const petDocuments = petsData
      .filter(item => 
        item.metadata?.petId === petId && 
        item.metadata?.itemType === 'document'
      )
      .map(item => ({
        id: item.id,
        name: item.title || item.metadata?.name || '',
        uploadDate: item.metadata?.uploadDate || item.createdAt,
        expirationDate: item.metadata?.expirationDate,
        extractedText: item.metadata?.extractedText,
        size: item.metadata?.size,
        type: item.metadata?.type,
        fileUrl: item.metadata?.fileUrl
      }))
      .sort((a, b) => new Date(String(b.uploadDate)).getTime() - new Date(String(a.uploadDate)).getTime())
    
    setDocuments(petDocuments)
  }

  const handleDocumentSaved = async (doc: UploadedDocument) => {
    try {
      await addData('pets', {
        title: doc.name,
        description: `Document for ${petName}`,
        metadata: {
          itemType: 'document',
          petId: petId,
          name: doc.name,
          uploadDate: doc.uploadDate,
          expirationDate: doc.expirationDate,
          extractedText: doc.extractedText,
          size: doc.metadata.size,
          type: doc.metadata.type,
          fileUrl: doc.fileUrl
        }
      })

      console.log('✅ Pet document saved to database')
      loadDocuments()

      // Notify pets pages to refresh counts
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pets-data-updated', { detail: { petId } }))
      }
    } catch (error) {
      console.error('Error saving pet document:', error)
      alert('Failed to save document')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    
    try {
      // Optimistically remove from UI immediately
      setDocuments(prev => prev.filter(doc => doc.id !== id))
      
      // Delete from database
      await deleteData('pets', id)
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('pets-data-updated'))
      
      console.log('✅ Document deleted')
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Failed to delete document')
      // Reload to restore document if deletion failed
      loadDocuments()
    }
  }

  return (
    <>
      <DocumentUploadScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onDocumentSaved={handleDocumentSaved}
        category={`pet-${petName}`}
        title={`Upload Document for ${petName}`}
        description="Upload vet records, vaccination certificates, or take photos"
      />

      <div className="space-y-4">
        <Button
          onClick={() => setShowScanner(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No documents added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">{doc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                        {doc.size && ` • ${(doc.size / 1024 / 1024).toFixed(1)} MB`}
                      </p>
                      {doc.expirationDate && (
                        <p className="text-sm text-orange-600">
                          Expires: {new Date(doc.expirationDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (doc.fileUrl) {
                          window.open(doc.fileUrl, '_blank')
                        } else {
                          alert('No file available to view')
                        }
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        if (doc.fileUrl) {
                          const a = document.createElement('a')
                          a.href = doc.fileUrl
                          a.download = doc.name || 'document'
                          a.target = '_blank'
                          document.body.appendChild(a)
                          a.click()
                          a.remove()
                        } else {
                          alert('No file available to download')
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

