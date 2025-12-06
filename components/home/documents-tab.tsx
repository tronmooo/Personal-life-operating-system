'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, FileText, Camera } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'

interface DocumentsTabProps {
  homeId: string
}

interface Document {
  id: string
  name: string
  type: string
  uploadDate: string
  imageUrl?: string
}

export function DocumentsTab({ homeId }: DocumentsTabProps) {
  const { data, addData, deleteData, reloadDomain } = useData()
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: ''
  })
  const [photoUrl, setPhotoUrl] = useState('')

  const homeEntries = useMemo(() => {
    const entries = (data?.home ?? []) as DomainData<'home'>[]
    return entries.filter((entry) => {
      const metadata: any = entry.metadata ?? {}
      return metadata?.homeId === homeId && metadata?.itemType === 'home-document'
    })
  }, [data, homeId])

  const documents = useMemo<Document[]>(() => {
    return homeEntries
      .map((entry) => {
        const metadata: any = entry.metadata ?? {}
        return {
          id: entry.id,
          name: metadata.name || entry.title || 'Document',
          type: metadata.type || metadata.documentType || 'Document',
          uploadDate: metadata.uploadDate || entry.createdAt,
          imageUrl: metadata.imageUrl || metadata.imageData || undefined,
        }
      })
      .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
  }, [homeEntries])

  const handlePhotoCapture = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' as any
    
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setPhotoUrl(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const uploadDate = new Date().toISOString()

    await addData('home', {
      title: formData.name,
      description: formData.type,
      metadata: {
        itemType: 'home-document',
        homeId,
        name: formData.name,
        type: formData.type,
        uploadDate,
        imageData: photoUrl || undefined,
      },
    })

    await reloadDomain('home')

    setFormData({ name: '', type: '' })
    setPhotoUrl('')
    setShowDialog(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return
    await deleteData('home', id)
    await reloadDomain('home')
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label>Document Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Deed, Inspection Report, Warranty"
                required
              />
            </div>
            <div>
              <Label>Document Photo</Label>
              <Button type="button" onClick={handlePhotoCapture} variant="outline" className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                {photoUrl ? 'Photo Captured' : 'Take Photo'}
              </Button>
              {photoUrl && (
                <img src={photoUrl} alt="Document" className="mt-2 w-full h-32 object-cover rounded-lg" />
              )}
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Documents</h3>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>
        </Card>

        {documents.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <p className="text-muted-foreground">No documents yet</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  {doc.imageUrl ? (
                    <img src={doc.imageUrl} alt={doc.name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{doc.name}</h4>
                    <p className="text-sm text-muted-foreground">{doc.type}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {new Date(doc.uploadDate).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

