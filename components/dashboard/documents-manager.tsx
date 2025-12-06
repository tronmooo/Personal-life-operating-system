'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { FileText, Plus, Trash2, Camera, AlertTriangle, CheckCircle } from 'lucide-react'

export function DocumentsManager({ open, onClose, onOpenOCR }: { open: boolean; onClose: () => void; onOpenOCR: () => void }) {
  const { documents, addDocument, deleteDocument } = useData()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    expiryDate: '',
    tags: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addDocument({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
    })
    setFormData({ title: '', category: '', expiryDate: '', tags: '' })
    setIsAddOpen(false)
  }

  const getExpiryStatus = (doc: any) => {
    if (!doc.expiryDate) return null
    const today = new Date()
    const expiryDate = new Date(doc.expiryDate)
    const daysDiff = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff < 0) {
      return { color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle, label: 'Expired' }
    } else if (daysDiff <= 30) {
      return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle, label: `Expires in ${daysDiff} days` }
    } else {
      return { color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle, label: 'Valid' }
    }
  }

  const sortedDocs = [...documents].sort((a, b) => {
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
    }
    if (a.expiryDate) return -1
    if (b.expiryDate) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Documents
                </DialogTitle>
                <DialogDescription>
                  {documents.length} documents stored
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  onClose()
                  onOpenOCR()
                }}>
                  <Camera className="h-4 w-4 mr-2" />
                  Scan Document
                </Button>
                <Button onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {sortedDocs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No documents yet. Add or scan your first document!</p>
              </div>
            ) : (
              sortedDocs.map((doc) => {
                const expiryStatus = getExpiryStatus(doc)
                return (
                  <div
                    key={doc.id}
                    className={`flex items-start justify-between p-4 rounded-lg border ${expiryStatus ? expiryStatus.bgColor : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <p className="font-semibold">{doc.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{doc.category}</Badge>
                        {doc.expiryDate && expiryStatus && (
                          <Badge variant={expiryStatus.label.includes('Expired') ? 'destructive' : 'secondary'} className="text-xs">
                            {expiryStatus.label}
                          </Badge>
                        )}
                        {doc.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      {doc.extractedText && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {doc.extractedText}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Added: {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteDocument(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Document Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>Manually add a document reference</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Passport, Driver's License"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select category</option>
                  <option value="Legal">Legal</option>
                  <option value="Financial">Financial</option>
                  <option value="Medical">Medical</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Personal">Personal</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., important, renewal-due, work"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Document</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}








