'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, FileText, Bell, TrendingUp, Paperclip, FolderOpen } from 'lucide-react'
import { useEnhancedData } from '@/lib/providers/enhanced-data-provider'
import { DocumentUploader, UploadedDocument } from '@/components/document-uploader'
import { SubCategory } from '@/types/enhanced-domains'

interface EnhancedDomainDetailProps {
  domainId: string
  domainName: string
  domainDescription: string
  categories: Record<string, any>
}

export function EnhancedDomainDetail({ domainId, domainName, domainDescription, categories }: EnhancedDomainDetailProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(categories)[0])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDocDialogOpen, setIsDocDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const {
    getEnhancedItemsBySubCategory,
    addEnhancedItem,
    updateEnhancedItem,
    deleteEnhancedItem,
    addDocumentToItem,
    removeDocumentFromItem,
    updateDocumentNotes,
    enhancedData,
  } = useEnhancedData()

  const currentCategory = categories[activeCategory]
  const categoryItems = getEnhancedItemsBySubCategory(domainId, activeCategory)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    addEnhancedItem({
      domain: domainId,
      subCategory: activeCategory as SubCategory,
      title: formData[currentCategory.fields[0].name] || 'Untitled',
      description: formData.notes || '',
      metadata: formData,
      tags: [],
    })

    setFormData({})
    setIsAddDialogOpen(false)
  }

  const handleEdit = (itemId: string) => {
    const item = enhancedData.find((i) => i.id === itemId)
    if (item) {
      setSelectedItemId(itemId)
      setFormData(item.metadata)
      setIsEditDialogOpen(true)
    }
  }

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return

    updateEnhancedItem(selectedItemId, {
      title: formData[currentCategory.fields[0].name] || 'Untitled',
      description: formData.notes || '',
      metadata: formData,
    })

    setFormData({})
    setSelectedItemId(null)
    setIsEditDialogOpen(false)
  }

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteEnhancedItem(itemId)
    }
  }

  const openDocDialog = (itemId: string) => {
    setSelectedItemId(itemId)
    setIsDocDialogOpen(true)
  }

  const selectedItem = selectedItemId
    ? enhancedData.find((i) => i.id === selectedItemId)
    : null

  const renderField = (field: any) => {
    const fieldValue = formData[field.name] || ''

    if (field.type === 'textarea') {
      return (
        <Textarea
          id={field.name}
          placeholder={field.placeholder}
          value={fieldValue}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          required={field.required}
        />
      )
    }

    if (field.type === 'select') {
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
          required={field.required}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (field.type === 'checkbox') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={field.name}
            checked={fieldValue || false}
            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor={field.name} className="text-sm">{field.label}</label>
        </div>
      )
    }

    if (field.type === 'date') {
      return (
        <Input
          id={field.name}
          type="date"
          value={fieldValue || new Date().toISOString().split('T')[0]}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          required={field.required}
          className="w-full p-2 border rounded-md"
        />
      )
    }

    if (field.type === 'time') {
      return (
        <Input
          id={field.name}
          type="time"
          value={fieldValue}
          onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
          required={field.required}
          className="w-full p-2 border rounded-md"
        />
      )
    }

    return (
      <Input
        id={field.name}
        type={field.type === 'currency' ? 'number' : field.type}
        placeholder={field.placeholder}
        value={fieldValue}
        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
        required={field.required}
        step={field.type === 'currency' ? '0.01' : undefined}
      />
    )
  }

  const formatValue = (value: any, field: any) => {
    if (!value) return 'N/A'
    if (field.type === 'currency') return `$${parseFloat(value).toLocaleString()}`
    if (field.type === 'date') return new Date(value).toLocaleDateString()
    if (field.type === 'checkbox') return value ? 'Yes' : 'No'
    return String(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{domainName}</h2>
          <p className="text-muted-foreground">{domainDescription}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Tabs for Sub-categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full">
            {Object.entries(categories).map(([key, cat]: [string, any]) => {
              const count = getEnhancedItemsBySubCategory(domainId, key).length
              return (
                <TabsTrigger key={key} value={key} className="text-xs lg:text-sm whitespace-nowrap">
                  {cat.name}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {Object.entries(categories).map(([key, cat]: [string, any]) => {
          const items = getEnhancedItemsBySubCategory(domainId, key)
          return (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{cat.name}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No items in this category yet</p>
                      <p className="text-xs mt-1">Click "Add New" to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-base">
                                  {item.title}
                                </CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEdit(item.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            {cat.fields.slice(1, 4).map((field: any) => {
                              const value = item.metadata[field.name]
                              if (!value) return null

                              return (
                                <div key={field.name} className="flex justify-between">
                                  <span className="text-muted-foreground">{field.label}:</span>
                                  <span className="font-medium">
                                    {formatValue(value, field)}
                                  </span>
                                </div>
                              )
                            })}
                            
                            {/* Document badge */}
                            {item.documents && item.documents.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {item.documents.length} document{item.documents.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                            
                            {/* Quick action buttons */}
                            <div className="flex space-x-2 pt-3 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => openDocDialog(item.id)}
                              >
                                <Paperclip className="h-3 w-3 mr-1" />
                                Documents ({item.documents?.length || 0})
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Metrics Card */}
              {items.length > 0 && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      {cat.name} Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{items.length}</p>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {items.filter((i) => {
                            const created = new Date(i.createdAt)
                            const weekAgo = new Date()
                            weekAgo.setDate(weekAgo.getDate() - 7)
                            return created >= weekAgo
                          }).length}
                        </p>
                        <p className="text-xs text-muted-foreground">This Week</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">
                          {items.reduce((sum, i) => sum + (i.documents?.length || 0), 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Documents</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">100%</p>
                        <p className="text-xs text-muted-foreground">Up to Date</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New {currentCategory.name}</DialogTitle>
            <DialogDescription>{currentCategory.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {currentCategory.fields.map((field: any) => (
                <div key={field.name} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  )}
                  {renderField(field)}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add {currentCategory.name}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {currentCategory.name}</DialogTitle>
            <DialogDescription>{currentCategory.description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {currentCategory.fields.map((field: any) => (
                <div key={field.name} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                  {field.type !== 'checkbox' && (
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                  )}
                  {renderField(field)}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update {currentCategory.name}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={isDocDialogOpen} onOpenChange={setIsDocDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Documents</DialogTitle>
            <DialogDescription>
              Upload and manage documents for {selectedItem?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedItemId && (
            <DocumentUploader
              documents={(selectedItem?.documents as UploadedDocument[]) || []}
              onAdd={(doc) => addDocumentToItem(selectedItemId, doc)}
              onRemove={(docId) => removeDocumentFromItem(selectedItemId, docId)}
              onUpdateNotes={(docId, notes) => updateDocumentNotes(selectedItemId, docId, notes)}
            />
          )}

          <DialogFooter>
            <Button onClick={() => setIsDocDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
