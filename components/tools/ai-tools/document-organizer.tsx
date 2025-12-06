'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FolderTree, Tag, FileText, Sparkles, Search, Upload, Loader2, Trash2, Camera } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OrganizedDocument {
  id: string
  name: string
  category: string
  tags: string[]
  date: string
  summary?: string
}

const CATEGORIES = [
  { name: 'Legal', color: 'bg-red-500' },
  { name: 'Financial', color: 'bg-green-500' },
  { name: 'Business', color: 'bg-blue-500' },
  { name: 'HR', color: 'bg-purple-500' },
  { name: 'Medical', color: 'bg-pink-500' },
  { name: 'Personal', color: 'bg-orange-500' },
  { name: 'Other', color: 'bg-gray-500' },
]

export function DocumentOrganizer() {
  const [documents, setDocuments] = useState<OrganizedDocument[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'document')
      
      const response = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze document')
      }
      
      const result = await response.json()
      const extractedData = result.data || {}
      
      // AI determines category based on content
      let category = 'Other'
      const text = (result.text || '').toLowerCase()
      
      if (text.includes('contract') || text.includes('agreement') || text.includes('legal')) {
        category = 'Legal'
      } else if (text.includes('invoice') || text.includes('payment') || text.includes('tax') || text.includes('financial')) {
        category = 'Financial'
      } else if (text.includes('employee') || text.includes('hr') || text.includes('personnel')) {
        category = 'HR'
      } else if (text.includes('medical') || text.includes('health') || text.includes('doctor')) {
        category = 'Medical'
      } else if (text.includes('business') || text.includes('meeting') || text.includes('project')) {
        category = 'Business'
      }
      
      // Generate tags from content
      const tags: string[] = []
      const keywords = ['important', 'urgent', 'confidential', 'draft', 'final', 'signed', 'pending']
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          tags.push(keyword)
        }
      })
      
      // Add type-based tag
      if (extractedData.title) {
        tags.push(extractedData.title.split(' ')[0].toLowerCase())
      }
      
      const newDoc: OrganizedDocument = {
        id: Date.now().toString(),
        name: file.name,
        category,
        tags: tags.length > 0 ? tags.slice(0, 3) : ['document'],
        date: new Date().toISOString().split('T')[0],
        summary: extractedData.summary || result.text?.substring(0, 100) || ''
      }
      
      setDocuments([newDoc, ...documents])
      
      toast({
        title: 'Document Organized!',
        description: `Categorized as ${category} with ${tags.length} tags`
      })
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to process document.',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    e.target.value = ''
  }

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(d => d.id !== id))
    toast({
      title: 'Removed',
      description: 'Document removed from organizer.'
    })
  }

  const updateCategory = (id: string, category: string) => {
    setDocuments(documents.map(d => 
      d.id === id ? { ...d, category } : d
    ))
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Calculate category counts
  const categoryCounts = CATEGORIES.map(cat => ({
    ...cat,
    count: documents.filter(d => d.category === cat.name).length
  })).filter(cat => cat.count > 0)

  // Get unique tags
  const allTags = new Set(documents.flatMap(d => d.tags))

  return (
    <Card className="w-full max-w-4xl mx-auto">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-4xl">🗂️</span>
          Smart Document Organizer
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload documents and AI will automatically categorize and tag them
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-semibold mb-2">Upload Document for AI Organization</h3>
          <p className="text-sm text-muted-foreground mb-3">AI will analyze content and auto-categorize</p>
          <Button onClick={handleUploadClick} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documents by name, category, or tags..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{documents.length}</div>
            <div className="text-xs text-muted-foreground">Documents</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{categoryCounts.length}</div>
            <div className="text-xs text-muted-foreground">Categories</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{allTags.size}</div>
            <div className="text-xs text-muted-foreground">Tags</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {documents.length > 0 ? '100%' : '—'}
            </div>
            <div className="text-xs text-muted-foreground">Organized</div>
          </div>
        </div>

        {/* Categories */}
        {categoryCounts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Document Categories
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {categoryCounts.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedCategory(selectedCategory === category.name ? null : category.name)}
                  className={`border rounded-lg p-4 flex items-center gap-3 transition-colors ${
                    selectedCategory === category.name 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{category.name}</div>
                    <div className="text-sm text-muted-foreground">{category.count} documents</div>
                  </div>
                </button>
              ))}
            </div>
            {selectedCategory && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="mt-2">
                Clear filter
              </Button>
            )}
          </div>
        )}

        {/* Documents List */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Documents</h3>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>{documents.length === 0 ? 'No documents yet. Upload a document to get started!' : 'No documents match your search.'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">{doc.name}</div>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Select value={doc.category} onValueChange={(v) => updateCategory(doc.id, v)}>
                          <SelectTrigger className="h-6 w-auto text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {doc.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="flex items-center gap-1 text-xs">
                            <Tag className="h-3 w-3" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">{doc.date}</div>
                    <Button variant="ghost" size="sm" onClick={() => deleteDocument(doc.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Features */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Organization Features:
          </h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li>• Automatic categorization</li>
            <li>• Smart tagging from content</li>
            <li>• Full-text search</li>
            <li>• Category filtering</li>
            <li>• Manual re-categorization</li>
            <li>• Content analysis</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}































