'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Shield, CreditCard, Search, Plus, Eye, Edit, Trash2, 
  Calendar, FileText, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ExternalLink, Share2, MessageSquare, Mail
} from 'lucide-react'
import { DocumentShareButtons, DocumentQuickShareBar } from '@/components/documents/document-share-buttons'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { useGoogleDrive } from '@/hooks/use-google-drive'
import { DocumentPreviewModal } from '@/components/document-preview-modal'
import { BackButton } from '@/components/ui/back-button'

interface Document {
  id: string
  name: string
  category:
    | 'Insurance'
    | 'ID & Licenses'
    | 'Identity Documents'
    | 'Vehicle'
    | 'Property'
    | 'Education'
    | 'Medical'
    | 'Legal'
    | 'Financial & Tax'
    | 'Retirement & Benefits'
    | 'Estate Planning'
  subtype?: string
  issuer?: string
  number?: string
  expiryDate?: string
  fileUrl?: string
  fileType?: string
  uploadDate: Date
  status: 'active' | 'expiring' | 'expired'
}

export function DocumentManagerView() {
  const supabase = createClientComponentClient()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    category: 'Insurance' as Document['category'],
    subtype: '',
    issuer: '',
    number: '',
    expiryDate: ''
  })

  // Extra, category-specific fields live inside formData as well (dynamic keys)

  useEffect(() => {
    // Load from Supabase (auth required)
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchQuery, selectedCategory])

  const loadDocuments = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load DOCUMENT documents only (exclude nutrition meal photos, pet photos, etc.)
      // Include: insurance, legal, vehicles, health, financial, education, travel, miscellaneous
      // Exclude: nutrition, pets (those stay in their own sections)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .not('domain', 'in', '(nutrition,pets)')
        .order('uploaded_at', { ascending: false })

      if (error) throw error

      const mapped = (data || []).map((doc: any) => {
        const expiryDate = doc.expiration_date ? new Date(doc.expiration_date) : null
        const today = new Date()
        let status: 'active' | 'expiring' | 'expired' = 'active'
        
        if (expiryDate) {
          const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysUntil < 0) status = 'expired'
          else if (daysUntil <= 30) status = 'expiring'
        }

        const metadata = doc.metadata || {}
        const uploadDate = doc.uploaded_at || doc.created_at || new Date().toISOString()

        // Use the mapped category from metadata (set by AI)
        const category = metadata.category || doc.document_type || 'Insurance'

        const mappedDoc = {
          id: doc.id,
          name: doc.document_name || metadata.title || 'Untitled Document',
          category: category,
          subtype: metadata.subtype || doc.document_subtype || '',
          issuer: metadata.issuer || metadata.provider || '',
          number: metadata.number || doc.policy_number || doc.account_number || '',
          expiryDate: doc.expiration_date || '',
          fileUrl: doc.file_url,
          fileType: doc.mime_type || metadata.fileType || 'manual',
          uploadDate: new Date(uploadDate),
          status
        }
        
        // Debug: Log category for verification
        console.log('📄 Document loaded:', mappedDoc.name, '→ Category:', mappedDoc.category)
        
        return mappedDoc
      })

      console.log('✅ Total documents loaded:', mapped.length)
      setDocuments(mapped)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.issuer?.toLowerCase().includes(query) ||
        doc.number?.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        (doc.subtype?.toLowerCase().includes(query) ?? false)
      )
    }

    setFilteredDocs(filtered)
  }

  // ----- Category-specific dynamic fields -----
  const extraFieldsByCategory: Record<string, Array<{name: string, label: string, type?: 'text' | 'date' | 'number'}>> = {
    'Insurance': [
      { name: 'coverageAmount', label: 'Coverage Amount' },
      { name: 'premium', label: 'Premium' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date' },
    ],
    'ID & Licenses': [
      { name: 'holderName', label: 'Holder Name' },
      { name: 'idType', label: 'ID Type' },
    ],
    'Identity Documents': [
      { name: 'holderName', label: 'Holder Name' },
      { name: 'idType', label: 'ID Type' },
    ],
    'Property': [
      { name: 'address', label: 'Property Address' },
      { name: 'parcelNumber', label: 'Parcel Number' },
      { name: 'mortgageNumber', label: 'Mortgage Number' },
    ],
    'Legal': [
      { name: 'partyA', label: 'Party A' },
      { name: 'partyB', label: 'Party B' },
      { name: 'caseNumberExt', label: 'Case Number' },
    ],
    'Medical': [
      { name: 'patientName', label: 'Patient Name' },
      { name: 'providerName', label: 'Provider Name' },
      { name: 'testDate', label: 'Test/Record Date', type: 'date' },
    ],
    'Financial & Tax': [
      { name: 'taxYear', label: 'Tax Year' },
      { name: 'formType', label: 'Form Type (W-2, 1099, etc.)' },
    ],
    'Vehicle': [
      { name: 'vin', label: 'VIN' },
      { name: 'plate', label: 'License Plate' },
      { name: 'registrationDate', label: 'Registration Date', type: 'date' },
    ],
    'Education': [
      { name: 'school', label: 'School/Institution' },
      { name: 'credential', label: 'Degree/Certification' },
      { name: 'graduationDate', label: 'Graduation Date', type: 'date' },
    ],
    'Estate Planning': [
      { name: 'attorney', label: 'Attorney' },
      { name: 'instrumentType', label: 'Instrument (Will, Trust, POA)' },
      { name: 'signedDate', label: 'Signed Date', type: 'date' },
    ],
  }

  const handleAddDocument = async () => {
    if (!formData.name || !formData.category) {
      alert('Please enter at least a document name')
      return
    }

    // Compute status locally first
    const expiryDate = formData.expiryDate ? new Date(formData.expiryDate) : null
    const today = new Date()
    let status: 'active' | 'expiring' | 'expired' = 'active'
    if (expiryDate) {
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil < 0) status = 'expired'
      else if (daysUntil <= 30) status = 'expiring'
    }

    // Update UI optimistically, rely on Supabase as source of truth
    const extraFields = extraFieldsByCategory[formData.category] || []
    const extraMetadata = extraFields.reduce<Record<string, any>>((acc, field) => {
      const value = (formData as any)[field.name]
      if (value) {
        acc[field.name] = value
      }
      return acc
    }, {})

    const metadata: Record<string, any> = {
      category: formData.category,
      subtype: formData.subtype || undefined,
      issuer: formData.issuer || undefined,
      number: formData.number || undefined,
      ...extraMetadata
    }

    const parseNumeric = (value?: string) => {
      if (!value) return undefined
      const numeric = Number(value.toString().replace(/[^0-9.-]/g, ''))
      return Number.isFinite(numeric) ? numeric : undefined
    }

    const coverageAmount = parseNumeric((formData as any).coverageAmount)

    const payload: Record<string, any> = {
      domain: 'insurance',
      document_name: formData.name,
      file_name: formData.name,
      document_type: formData.category,
      metadata,
      tags: [formData.category, formData.subtype].filter(Boolean),
      ocr_processed: false,
      reminder_created: false
    }

    if (formData.expiryDate) {
      payload.expiration_date = new Date(formData.expiryDate).toISOString()
    }

    if (formData.number) {
      payload.policy_number = formData.number
    }

    if (coverageAmount !== undefined) {
      payload.amount = coverageAmount
    }

    if ((formData as any).premium) {
      metadata.premium = (formData as any).premium
    }

    if ((formData as any).effectiveDate) {
      metadata.effectiveDate = (formData as any).effectiveDate
    }

    // Persist to Supabase via Documents API
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error || 'Failed to save document')
      }

      await loadDocuments()
    } catch (e: any) {
      console.error('Failed to save document:', e)
      alert(e?.message || 'Failed to save document. Please try again.')
    }

    setShowAddDialog(false)
    setFormData({ name: '', category: 'Insurance', subtype: '', issuer: '', number: '', expiryDate: '' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this document?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDocuments(prev => prev.filter(doc => doc.id !== id))
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const stats = {
    total: documents.length,
    active: documents.filter(d => d.status === 'active').length,
    expiring: documents.filter(d => d.status === 'expiring').length,
    expired: documents.filter(d => d.status === 'expired').length
  }

  const categories: Document['category'][] = [
    'Insurance',
    'ID & Licenses',
    'Identity Documents',
    'Vehicle',
    'Property',
    'Education',
    'Medical',
    'Legal',
    'Financial & Tax',
    'Retirement & Benefits',
    'Estate Planning'
  ]

  const subtypesByCategory: Record<string, string[]> = {
    'ID & Licenses': [
      'Birth Certificate', 'Social Security Card', 'Passport', "Driver's License",
      'Marriage Certificate', 'Divorce Decree', 'Death Certificate'
    ],
    'Identity Documents': [
      'Birth Certificate', 'Social Security Card', 'Passport', "Driver's License",
      'Marriage Certificate', 'Divorce Decree', 'Death Certificate'
    ],
    'Property': [
      'Deed', 'Title', 'Mortgage', 'Property Tax Record', 'Home Improvement Receipt', 'HOA Document'
    ],
    'Insurance': [
      'Home Insurance', 'Auto Insurance', 'Life Insurance', 'Health Insurance', 'Disability Insurance', 'Umbrella Policy', 'Declarations Page'
    ],
    'Estate Planning': [
      'Will', 'Trust', 'Power of Attorney (Medical)', 'Power of Attorney (Financial)', 'Living Will', 'Advance Directive'
    ],
    'Education': [
      'Diploma', 'Degree', 'Transcript', 'Professional Certification', 'License'
    ],
    'Medical': [
      'Immunization Record', 'Diagnosis', 'Surgical Record', 'Prescription History', 'Test Result', 'Insurance Claim'
    ],
    'Vehicle': [
      'Car Title', 'Registration', 'Loan/Lease Agreement', 'Maintenance Record', 'Warranty'
    ],
    'Legal': [
      'Contract', 'Custody Agreement', 'Adoption Paper', 'Settlement Agreement', 'Business Formation', 'Patent', 'Trademark'
    ],
    'Financial & Tax': [
      'Tax Return', 'W-2', '1099', 'Deduction Receipt', 'Investment Statement', 'Bank Statement'
    ],
    'Retirement & Benefits': [
      '401(k) Statement', 'IRA Document', 'Pension Info', 'Social Security Statement', 'Employee Benefits'
    ]
  }

  // Inline Google Drive files for Insurance
  const { files, listFiles, isAuthenticated } = useGoogleDrive('insurance')
  useEffect(() => {
    listFiles()
  }, [listFiles])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white pb-6">
      {/* Preview Modal */}
      <DocumentPreviewModal 
        document={previewDoc}
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      {/* Add Document Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-slate-800 text-white border-slate-700 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Document Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Health Insurance Policy"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Category</Label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Document['category'] })}
                className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subtype, based on Category */}
            {subtypesByCategory[formData.category] && (
              <div>
                <Label className="text-slate-300">Subtype</Label>
                <select
                  value={formData.subtype}
                  onChange={e => setFormData({ ...formData, subtype: e.target.value })}
                  className="w-full p-2 rounded-md bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">Select subtype (optional)</option>
                  {subtypesByCategory[formData.category].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-slate-300">Issuer</Label>
              <Input
                value={formData.issuer}
                onChange={e => setFormData({ ...formData, issuer: e.target.value })}
                placeholder="Blue Cross"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Document Number</Label>
              <Input
                value={formData.number}
                onChange={e => setFormData({ ...formData, number: e.target.value })}
                placeholder="HC-123456"
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300">Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {/* Category-specific extra fields */}
            {extraFieldsByCategory[formData.category]?.map(f => (
              <div key={f.name}>
                <Label className="text-slate-300">{f.label}</Label>
                <Input
                  type={f.type === 'date' ? 'date' : 'text'}
                  value={(formData as any)[f.name] || ''}
                  onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            ))}

            <div className="flex gap-3">
              <Button
                onClick={handleAddDocument}
                disabled={!formData.name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Document
              </Button>
              <Button
                onClick={() => {
                  setShowAddDialog(false)
                  setFormData({ name: '', category: 'Insurance', subtype: '', issuer: '', number: '', expiryDate: '' })
                }}
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="max-w-7xl mx-auto">
          {/* Back Button - Mobile friendly */}
          <div className="mb-4">
            <BackButton className="bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur-sm border border-slate-600 min-h-[44px] px-4" />
          </div>
          
          {/* Title and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Document Manager</h1>
              <p className="text-slate-300 text-sm">Organize and track all your important documents</p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 px-4 sm:px-6 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="whitespace-nowrap">Add Document</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="text-slate-400 text-[10px] sm:text-xs mb-1">Total</div>
              <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-900/30 border-green-700/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="text-green-300 text-[10px] sm:text-xs mb-1">Active</div>
              <div className="text-2xl sm:text-3xl font-bold text-green-400">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-900/30 border-yellow-700/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="text-yellow-300 text-[10px] sm:text-xs mb-1">Expiring</div>
              <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{stats.expiring}</div>
            </CardContent>
          </Card>
          <Card className="bg-red-900/30 border-red-700/50 backdrop-blur-sm">
            <CardContent className="p-3 sm:p-4">
              <div className="text-red-300 text-[10px] sm:text-xs mb-1">Expired</div>
              <div className="text-2xl sm:text-3xl font-bold text-red-400">{stats.expired}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {stats.expiring > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <Card className="bg-yellow-900/20 border-yellow-700/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-300 text-sm font-medium">
                    ⚠️ {stats.expiring} document{stats.expiring > 1 ? 's' : ''} expiring within 30 days
                  </p>
                  <p className="text-yellow-400/80 text-xs">Review and renew before expiration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expired Alert */}
      {stats.expired > 0 && (
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <Card className="bg-red-900/20 border-red-700/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm font-medium">
                    🚨 {stats.expired} expired document{stats.expired > 1 ? 's' : ''} require immediate attention
                  </p>
                  <p className="text-red-400/80 text-xs">Renew these documents as soon as possible</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto px-4 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents by name, type, or issuer..."
            className="pl-10 h-9 bg-slate-800/50 border-slate-700 text-white text-sm"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="relative -mx-4 px-4">
          {/* Fade indicator for scrollable content */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10 sm:hidden" />
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              onClick={() => setSelectedCategory('all')}
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`whitespace-nowrap flex-shrink-0 min-h-[40px] px-3 ${selectedCategory === 'all' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="h-3 w-3 mr-1.5" />
              All
            </Button>

            {categories.map(cat => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className={`whitespace-nowrap flex-shrink-0 min-h-[40px] px-3 ${selectedCategory === cat 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="max-w-7xl mx-auto px-4 pb-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-slate-400 text-sm">Loading documents...</div>
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6 sm:p-8 text-center">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-slate-600" />
              <h3 className="text-base sm:text-lg font-semibold mb-1.5">No documents found</h3>
              <p className="text-slate-400 text-xs sm:text-sm mb-4">Get started by adding your first document</p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {/* Inline Google Drive list (if authenticated) */}
            {isAuthenticated && files.length > 0 && (
              <Card className="bg-slate-900/40 border-slate-700">
                <CardContent className="p-4">
                  <div className="text-slate-300 text-sm mb-2">Google Drive Files ({files.length})</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between p-2 rounded-md bg-slate-800/60 border border-slate-700">
                        <div className="truncate text-sm">{f.name}</div>
                        <Button size="sm" variant="ghost" onClick={() => window.open(f.webViewLink || f.webContentLink || '#', '_blank')}>View</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredDocs.map(doc => {
              const Icon = doc.category === 'Insurance' ? Shield : CreditCard
              const isExpanded = expandedDocId === doc.id
              
              return (
                <Card key={doc.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Icon and main info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          doc.category === 'Insurance' ? 'bg-purple-600' : 'bg-green-600'
                        }`}>
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-bold mb-0.5 truncate">{doc.name}</h3>
                              <p className="text-slate-400 text-xs">{doc.category}</p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {doc.status === 'active' && (
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                              )}
                              {doc.status === 'expiring' && (
                                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                              )}
                              {doc.status === 'expired' && (
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          {/* Metadata grid - responsive */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs mt-2">
                            {doc.issuer && (
                              <div>
                                <div className="text-slate-500 text-[10px]">Issuer</div>
                                <div className="font-medium truncate">{doc.issuer}</div>
                              </div>
                            )}
                            {doc.number && (
                              <div>
                                <div className="text-slate-500 text-[10px]">Number</div>
                                <div className="font-medium font-mono text-xs truncate">{doc.number}</div>
                              </div>
                            )}
                            {doc.expiryDate && (
                              <div className="col-span-2 sm:col-span-1">
                                <div className="text-slate-500 text-[10px]">Expires</div>
                                <div className={`font-medium ${
                                  doc.status === 'expired' ? 'text-red-400' :
                                  doc.status === 'expiring' ? 'text-yellow-400' :
                                  'text-green-400'
                                }`}>
                                  {new Date(doc.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Action buttons - always visible on mobile */}
                      <div className="flex gap-2 flex-shrink-0 justify-end sm:flex-col sm:gap-1.5">
                        <DocumentShareButtons 
                          document={{
                            id: doc.id,
                            name: doc.name,
                            fileUrl: doc.fileUrl,
                            extractedData: {
                              documentType: doc.category,
                              expirationDate: doc.expiryDate,
                              policyNumber: doc.number
                            }
                          }}
                          variant="compact"
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        />
                        <Button
                          onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                          size="sm"
                          variant={isExpanded ? "default" : "outline"}
                          className={`min-h-[40px] sm:min-h-0 px-3 sm:px-0 sm:h-8 sm:w-8 ${isExpanded 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "border-slate-600 hover:bg-slate-700"
                          }`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          <span className="ml-2 sm:hidden">{isExpanded ? 'Hide' : 'View'}</span>
                        </Button>
                        <Button
                          onClick={() => handleDelete(doc.id)}
                          variant="ghost"
                          size="sm"
                          className="border border-slate-600 hover:bg-red-900/20 hover:border-red-600 min-h-[40px] sm:min-h-0 px-3 sm:px-0 sm:h-8 sm:w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="ml-2 sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Expandable Preview Section */}
                    {isExpanded && doc.fileUrl && (
                      <div className="mt-4 pt-4 border-t border-slate-700">
                        <div className="bg-slate-900/60 rounded-lg p-2">
                          {doc.fileUrl.includes('.pdf') || doc.fileType?.includes('pdf') ? (
                            <iframe
                              src={doc.fileUrl}
                              className="w-full h-96 rounded border border-slate-600"
                              title={doc.name}
                            />
                          ) : (
                            <img
                              src={doc.fileUrl}
                              alt={doc.name}
                              className="w-full max-h-96 object-contain rounded"
                            />
                          )}
                          <div className="flex flex-col sm:flex-row justify-between gap-3 mt-3 pt-3 border-t border-slate-700">
                            {/* Quick Share Buttons */}
                            <div className="flex gap-2">
                              <DocumentQuickShareBar 
                                document={{
                                  id: doc.id,
                                  name: doc.name,
                                  fileUrl: doc.fileUrl,
                                  extractedData: {
                                    documentType: doc.category,
                                    expirationDate: doc.expiryDate,
                                    policyNumber: doc.number
                                  }
                                }}
                                className="[&>button]:border-slate-600 [&>button]:text-slate-300"
                              />
                            </div>
                            <Button
                              onClick={() => window.open(doc.fileUrl, '_blank')}
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open in New Tab
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

