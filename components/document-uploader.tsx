'use client'

import { useState, useRef } from 'react'
import { Upload, File, X, FileText, Image as ImageIcon, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

export interface UploadedDocument {
  id: string
  name: string
  type: 'pdf' | 'image' | 'doc' | 'spreadsheet' | 'other'
  size: number
  uploadedAt: string
  dataUrl: string // base64 encoded data
  notes?: string
}

interface DocumentUploaderProps {
  documents: UploadedDocument[]
  onAdd: (document: Omit<UploadedDocument, 'id' | 'uploadedAt'>) => void
  onRemove: (id: string) => void
  onUpdateNotes: (id: string, notes: string) => void
  maxSizeKB?: number
  accept?: string
}

export function DocumentUploader({
  documents,
  onAdd,
  onRemove,
  onUpdateNotes,
  maxSizeKB = 5000, // 5MB default
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt'
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileType = (fileName: string): UploadedDocument['type'] => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
    if (['doc', 'docx'].includes(ext || '')) return 'doc'
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return 'spreadsheet'
    return 'other'
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleFile = async (file: File) => {
    // Check file size
    if (file.size > maxSizeKB * 1024) {
      alert(`File size exceeds ${formatFileSize(maxSizeKB * 1024)} limit`)
      return
    }

    // Read file as base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      onAdd({
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        dataUrl,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    files.forEach(handleFile)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(handleFile)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadDocument = (doc: UploadedDocument) => {
    const link = document.createElement('a')
    link.href = doc.dataUrl
    link.download = doc.name
    link.click()
  }

  const getIcon = (type: UploadedDocument['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />
      case 'image':
        return <ImageIcon className="h-8 w-8 text-blue-500" />
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-600" />
      case 'spreadsheet':
        return <FileText className="h-8 w-8 text-green-600" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Max file size: {formatFileSize(maxSizeKB * 1024)} • Supported: PDF, Images, Office docs
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Select Files
        </Button>
      </div>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold">
            Uploaded Documents ({documents.length})
          </h4>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{doc.name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {doc.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(doc.size)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onRemove(doc.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Notes */}
                    <div className="mt-3">
                      <Label htmlFor={`notes-${doc.id}`} className="text-xs">
                        Notes (optional)
                      </Label>
                      <Textarea
                        id={`notes-${doc.id}`}
                        value={doc.notes || ''}
                        onChange={(e) => onUpdateNotes(doc.id, e.target.value)}
                        placeholder="Add notes about this document..."
                        rows={2}
                        className="mt-1 text-sm"
                      />
                    </div>

                    {/* Preview for images */}
                    {doc.type === 'image' && (
                      <div className="mt-3">
                        <img
                          src={doc.dataUrl}
                          alt={doc.name}
                          className="max-w-full h-auto max-h-48 rounded border"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}







