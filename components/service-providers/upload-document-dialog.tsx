'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { CreateDocumentInput, DocumentType, ServiceProvider } from '@/lib/hooks/use-service-providers'

interface UploadDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  providers: ServiceProvider[]
  onSubmit: (data: CreateDocumentInput) => Promise<void>
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'policy', label: 'Policy' },
  { value: 'bill', label: 'Bill' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'other', label: 'Other' },
]

export function UploadDocumentDialog({ open, onOpenChange, providers, onSubmit }: UploadDocumentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    provider_id: '',
    document_name: '',
    document_type: 'contract' as DocumentType,
    file_url: '',
    expiry_date: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.provider_id || !formData.document_name) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        provider_id: formData.provider_id,
        document_name: formData.document_name,
        document_type: formData.document_type,
        file_url: formData.file_url || undefined,
        expiry_date: formData.expiry_date || undefined,
      })
      
      // Reset form
      setFormData({
        provider_id: '',
        document_name: '',
        document_type: 'contract',
        file_url: '',
        expiry_date: '',
      })
      
      onOpenChange(false)
    } catch {
      // Error handled by hook
    } finally {
      setLoading(false)
    }
  }

  const activeProviders = providers.filter(p => p.status === 'active')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-slate-300">
              Provider <span className="text-red-400">*</span>
            </Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => setFormData({ ...formData, provider_id: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Select provider..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {activeProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id} className="text-white hover:bg-slate-700">
                    {provider.provider_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document_name" className="text-slate-300">
              Document Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="document_name"
              value={formData.document_name}
              onChange={(e) => setFormData({ ...formData, document_name: e.target.value })}
              placeholder="e.g., Auto Insurance Policy 2024"
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="document_type" className="text-slate-300">
              Document Type
            </Label>
            <Select
              value={formData.document_type}
              onValueChange={(value: DocumentType) => setFormData({ ...formData, document_type: value })}
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white hover:bg-slate-700">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File URL (for now, we'll use URL input - could be enhanced with file upload) */}
          <div className="space-y-2">
            <Label htmlFor="file_url" className="text-slate-300">
              File URL (optional)
            </Label>
            <Input
              id="file_url"
              type="url"
              value={formData.file_url}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              placeholder="https://..."
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">Link to stored document (Google Drive, Dropbox, etc.)</p>
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date" className="text-slate-300">
              Expiry Date (optional)
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Add Document'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}





