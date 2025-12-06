'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, FileText, AlertCircle, Camera, Upload, Sparkles, Loader2, Edit, Save, X } from 'lucide-react'
import Tesseract from 'tesseract.js'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface MedicalDocument {
  id: string
  title: string
  type: string
  date: string
  description: string
  documentPhoto?: string
  extractedText?: string
}

interface Allergy {
  id: string
  allergen: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  reaction: string
}

interface Condition {
  id: string
  name: string
  diagnosedDate: string
  status: 'Active' | 'Resolved' | 'Managed'
  notes?: string
}

export function RecordsTab() {
  const { getData, addData, updateData, deleteData, reloadDomain } = useData()
  const [documents, setDocuments] = useState<MedicalDocument[]>([])
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [conditions, setConditions] = useState<Condition[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDebug, setShowDebug] = useState(false)
  const [showAddAllergyForm, setShowAddAllergyForm] = useState(false)
  const [showAddConditionForm, setShowAddConditionForm] = useState(false)
  const [showAddDocumentForm, setShowAddDocumentForm] = useState(false)
  const [allergyFormData, setAllergyFormData] = useState<Partial<Allergy>>({ severity: 'Moderate' })
  const [conditionFormData, setConditionFormData] = useState<Partial<Condition>>({ status: 'Active' })
  const [documentFormData, setDocumentFormData] = useState<Partial<MedicalDocument>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Edit states
  const [editingAllergyId, setEditingAllergyId] = useState<string | null>(null)
  const [editAllergyForm, setEditAllergyForm] = useState<Partial<Allergy>>({})
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null)
  const [editConditionForm, setEditConditionForm] = useState<Partial<Condition>>({})
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [editDocumentForm, setEditDocumentForm] = useState<Partial<MedicalDocument>>({})

  // Load all health records from DataProvider
  const loadRecords = () => {
    const healthData = getData('health')
    
    // Load documents
    const docs = healthData
      .filter(item => {
        const t = item.metadata?.type || item.metadata?.itemType
        return t === 'document' || t === 'documents' || t === 'medical_document'
      })
      .map(item => ({
        id: item.id,
        title: String(item.metadata?.title || item.title || ''),
        type: String(item.metadata?.documentType || 'Other'),
        date: String(item.metadata?.date || item.createdAt.split('T')[0]),
        description: String(item.metadata?.description || item.description || ''),
        documentPhoto: item.metadata?.documentPhoto as string | undefined,
        extractedText: item.metadata?.extractedText as string | undefined
      }))
      .sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime())
    
    setDocuments(docs)
    
    // Load allergies
    const allergyList = healthData
      .filter(item => {
        const meta = item.metadata as any
        const t = meta?.type || meta?.itemType || (item as any).type
        return t === 'allergy' || t === 'allergies'
      })
      .map(item => {
        const meta = item.metadata as any
        return {
          id: item.id,
          allergen: meta?.allergen || item.title || '',
          severity: (meta?.severity || 'Moderate') as 'Mild' | 'Moderate' | 'Severe',
          reaction: meta?.reaction || ''
        }
      })
      .sort((a, b) => a.allergen.localeCompare(b.allergen))
    
    setAllergies(allergyList)
    
    // Load conditions
    const condList = healthData
      .filter(item => {
        const meta = item.metadata as any
        const t = meta?.type || meta?.itemType || (item as any).type
        return t === 'condition' || t === 'conditions'
      })
      .map(item => {
        const meta = item.metadata as any
        return {
          id: item.id,
          name: meta?.name || item.title || '',
          diagnosedDate: meta?.diagnosedDate || item.createdAt.split('T')[0],
          status: (meta?.status || 'Active') as 'Active' | 'Resolved' | 'Managed',
          notes: meta?.notes || item.description
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    
    setConditions(condList)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  // Listen for data updates
  useEffect(() => {
    const handleUpdate = () => loadRecords()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('health-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('health-data-updated', handleUpdate)
    }
  }, [])

  const handleAddAllergy = async () => {
    if (!allergyFormData.allergen) return

    await addData('health', {
      title: allergyFormData.allergen!,
      description: `${allergyFormData.severity} allergy - ${allergyFormData.reaction || 'No reaction specified'}`,
      metadata: {
        type: 'allergy',
        allergen: allergyFormData.allergen,
        severity: allergyFormData.severity || 'Moderate',
        reaction: allergyFormData.reaction || ''
      }
    })
    
    setAllergyFormData({ severity: 'Moderate' })
    setShowAddAllergyForm(false)
    // Force reload so counts/cards update
    try { 
      await reloadDomain('health' as any) 
    } catch (error) {
      console.error('Failed to reload health domain after adding allergy:', error)
      // Data was saved, reload failure is non-critical
    }
  }

  const handleDeleteAllergy = async (id: string) => {
    if (!confirm('Delete this allergy?')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    try {
      await deleteData('health', id)
      // Clear deleting state after success
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Reload to sync with database
      await loadRecords()
    } catch (error) {
      console.error('Failed to delete allergy:', error)
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Try to reload anyway to stay in sync
      loadRecords()
    }
  }

  const handleAddCondition = async () => {
    if (!conditionFormData.name) return

    await addData('health', {
      title: conditionFormData.name!,
      description: conditionFormData.notes || `${conditionFormData.status} condition`,
      metadata: {
        type: 'condition',
        name: conditionFormData.name,
        diagnosedDate: conditionFormData.diagnosedDate || new Date().toISOString().split('T')[0],
        status: conditionFormData.status || 'Active',
        notes: conditionFormData.notes
      }
    })
    
    setConditionFormData({ status: 'Active' })
    setShowAddConditionForm(false)
    try { 
      await reloadDomain('health' as any) 
    } catch (error) {
      console.error('Failed to reload health domain after adding condition:', error)
      // Data was saved, reload failure is non-critical
    }
  }

  const handleDeleteCondition = async (id: string) => {
    if (!confirm('Delete this condition?')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    try {
      await deleteData('health', id)
      // Clear deleting state after success
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Reload to sync with database
      await loadRecords()
    } catch (error) {
      console.error('Failed to delete condition:', error)
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Try to reload anyway to stay in sync
      loadRecords()
    }
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      setDocumentFormData({ ...documentFormData, documentPhoto: dataUrl })

      try {
        const result = await Tesseract.recognize(dataUrl, 'eng')
        setDocumentFormData((prev) => ({ ...prev, extractedText: result.data.text }))
      } catch (error) {
        console.error('OCR Error:', error)
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleAddDocument = async () => {
    if (!documentFormData.title || !documentFormData.type) return

    await addData('health', {
      title: documentFormData.title!,
      description: documentFormData.description || `${documentFormData.type} document`,
      metadata: {
        type: 'document',
        title: documentFormData.title,
        documentType: documentFormData.type,
        date: documentFormData.date || new Date().toISOString().split('T')[0],
        description: documentFormData.description || '',
        documentPhoto: documentFormData.documentPhoto,
        extractedText: documentFormData.extractedText
      }
    })
    
    setDocumentFormData({})
    setShowAddDocumentForm(false)
  }

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Delete this document?')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    try {
      await deleteData('health', id)
      // Clear deleting state after success
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Reload to sync with database
      await loadRecords()
    } catch (error) {
      console.error('Failed to delete document:', error)
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      // Try to reload anyway to stay in sync
      loadRecords()
    }
  }

  // Edit handlers for allergies
  const handleEditAllergy = (allergy: Allergy) => {
    setEditingAllergyId(allergy.id)
    setEditAllergyForm({ ...allergy })
  }

  const handleSaveAllergyEdit = async (id: string) => {
    try {
      await updateData('health', id, {
        title: editAllergyForm.allergen || '',
        description: `${editAllergyForm.severity} allergy - ${editAllergyForm.reaction || 'No reaction specified'}`,
        metadata: {
          type: 'allergy',
          allergen: editAllergyForm.allergen,
          severity: editAllergyForm.severity,
          reaction: editAllergyForm.reaction
        }
      })
      setEditingAllergyId(null)
      setEditAllergyForm({})
      loadRecords()
    } catch (e) {
      console.error('Failed to update allergy', e)
      alert('Failed to update allergy')
    }
  }

  const handleCancelAllergyEdit = () => {
    setEditingAllergyId(null)
    setEditAllergyForm({})
  }

  // Edit handlers for conditions
  const handleEditCondition = (condition: Condition) => {
    setEditingConditionId(condition.id)
    setEditConditionForm({ ...condition })
  }

  const handleSaveConditionEdit = async (id: string) => {
    try {
      await updateData('health', id, {
        title: editConditionForm.name || '',
        description: editConditionForm.notes || '',
        metadata: {
          type: 'condition',
          name: editConditionForm.name,
          diagnosedDate: editConditionForm.diagnosedDate,
          status: editConditionForm.status,
          notes: editConditionForm.notes
        }
      })
      setEditingConditionId(null)
      setEditConditionForm({})
      loadRecords()
    } catch (e) {
      console.error('Failed to update condition', e)
      alert('Failed to update condition')
    }
  }

  const handleCancelConditionEdit = () => {
    setEditingConditionId(null)
    setEditConditionForm({})
  }

  // Edit handlers for documents
  const handleEditDocument = (doc: MedicalDocument) => {
    setEditingDocumentId(doc.id)
    setEditDocumentForm({ ...doc })
  }

  const handleSaveDocumentEdit = async (id: string) => {
    try {
      await updateData('health', id, {
        title: editDocumentForm.title || '',
        description: editDocumentForm.description || '',
        metadata: {
          type: 'document',
          title: editDocumentForm.title,
          documentType: editDocumentForm.type,
          date: editDocumentForm.date,
          description: editDocumentForm.description,
          documentPhoto: editDocumentForm.documentPhoto,
          extractedText: editDocumentForm.extractedText
        }
      })
      setEditingDocumentId(null)
      setEditDocumentForm({})
      loadRecords()
    } catch (e) {
      console.error('Failed to update document', e)
      alert('Failed to update document')
    }
  }

  const handleCancelDocumentEdit = () => {
    setEditingDocumentId(null)
    setEditDocumentForm({})
  }

  const handleSendToAI = (text: string) => {
    // Persist extracted text via DataProvider so it syncs to Supabase
    addData('health' as any, {
      title: 'AI Diagnostic Draft',
      description: 'Extracted text pending AI diagnostics',
      metadata: {
        type: 'ai_diagnostic_draft',
        extractedText: text,
        date: new Date().toISOString().split('T')[0]
      }
    })
    alert('Extracted text saved. Open AI Diagnostics to analyze.')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Severe':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'Mild':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowDebug(v => !v)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          {showDebug ? 'Hide' : 'Show'} Debug Data
        </button>
      </div>

      {showDebug && (
        <Card className="bg-white dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 mb-2">Raw entries for Documents, Allergies, Conditions (accepting alternate type names)</p>
            <pre className="text-xs overflow-auto max-h-60">{JSON.stringify({ documents, allergies, conditions }, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
      {/* Medical Documents */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Medical Documents</h2>
            <Button
              size="sm"
              onClick={() => setShowAddDocumentForm(!showAddDocumentForm)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Upload Document
            </Button>
          </div>

          {showAddDocumentForm && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Document Title *</Label>
                  <Input
                    placeholder="Lab Results, X-Ray, etc."
                    value={documentFormData.title || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Document Type *</Label>
                  <select
                    className="w-full border rounded-md p-2 bg-background"
                    value={documentFormData.type || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, type: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="Lab Results">Lab Results</option>
                    <option value="Imaging">Imaging (X-Ray, MRI, CT)</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={documentFormData.date || ''}
                    onChange={(e) => setDocumentFormData({ ...documentFormData, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  placeholder="Brief description"
                  value={documentFormData.description || ''}
                  onChange={(e) => setDocumentFormData({ ...documentFormData, description: e.target.value })}
                />
              </div>

              {/* Photo Capture */}
              <div className="border-2 border-dashed rounded-lg p-4">
                <Label className="mb-2 block">Capture Document (Photo → PDF with OCR)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Take Photo of Document'}
                </Button>
                {documentFormData.documentPhoto && (
                  <div className="mt-4 space-y-2">
                    <img src={documentFormData.documentPhoto} alt="Document" className="w-full rounded-lg max-h-64 object-contain border" />
                    {documentFormData.extractedText && (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-semibold flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Extracted Text (OCR):
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendToAI(documentFormData.extractedText!)}
                            className="text-xs"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Send to AI
                          </Button>
                        </div>
                        <p className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{documentFormData.extractedText}</p>
                      </div>
                    )}
                    <p className="text-xs text-green-600">✓ Will be saved as PDF</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddDocument}>Add Document</Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddDocumentForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const isEditing = editingDocumentId === doc.id
                return (
                  <div key={doc.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    {isEditing ? (
                      <div className="space-y-3">
                        <Input
                          value={editDocumentForm.title || ''}
                          onChange={(e) => setEditDocumentForm({ ...editDocumentForm, title: e.target.value })}
                          placeholder="Document title"
                        />
                        <Input
                          value={editDocumentForm.type || ''}
                          onChange={(e) => setEditDocumentForm({ ...editDocumentForm, type: e.target.value })}
                          placeholder="Document type"
                        />
                        <Input
                          type="date"
                          value={editDocumentForm.date || ''}
                          onChange={(e) => setEditDocumentForm({ ...editDocumentForm, date: e.target.value })}
                        />
                        <Textarea
                          value={editDocumentForm.description || ''}
                          onChange={(e) => setEditDocumentForm({ ...editDocumentForm, description: e.target.value })}
                          placeholder="Description"
                          className="min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSaveDocumentEdit(doc.id)}>
                            <Save className="w-3 h-3 mr-1" /> Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelDocumentEdit}>
                            <X className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold">{doc.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{doc.date}</p>
                            {doc.documentPhoto && (
                              <details className="mt-2">
                                <summary className="text-xs text-indigo-600 cursor-pointer">View Document</summary>
                                <img src={doc.documentPhoto} alt={doc.title} className="mt-2 rounded max-h-48 object-contain border" />
                              </details>
                            )}
                            {doc.extractedText && (
                              <div className="mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendToAI(doc.extractedText!)}
                                  className="text-xs"
                                >
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Send to AI Diagnostics
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDocument(doc)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingIds.has(doc.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            {deletingIds.has(doc.id) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Allergies & Conditions */}
      <Card className="bg-white dark:bg-gray-900">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Allergies & Conditions</h2>

          {/* Allergies */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Allergies</h3>
              <Button
                size="sm"
                onClick={() => setShowAddAllergyForm(!showAddAllergyForm)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Allergy
              </Button>
            </div>

            {showAddAllergyForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Allergen *</Label>
                    <Input
                      placeholder="Penicillin, Peanuts, etc."
                      value={allergyFormData.allergen || ''}
                      onChange={(e) => setAllergyFormData({ ...allergyFormData, allergen: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <select
                      className="w-full border rounded-md p-2 bg-background"
                      value={allergyFormData.severity || 'Moderate'}
                      onChange={(e) => setAllergyFormData({ ...allergyFormData, severity: e.target.value as any })}
                    >
                      <option value="Mild">Mild</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Severe">Severe</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label>Reaction</Label>
                  <Input
                    placeholder="Rash, difficulty breathing, etc."
                    value={allergyFormData.reaction || ''}
                    onChange={(e) => setAllergyFormData({ ...allergyFormData, reaction: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddAllergy}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddAllergyForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {allergies.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No allergies recorded</p>
            ) : (
              <div className="space-y-2">
                {allergies.map((allergy) => {
                  const isEditing = editingAllergyId === allergy.id
                  return (
                    <div key={allergy.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editAllergyForm.allergen || ''}
                            onChange={(e) => setEditAllergyForm({ ...editAllergyForm, allergen: e.target.value })}
                            className="h-8 w-32"
                            placeholder="Allergen"
                          />
                          <select
                            value={editAllergyForm.severity || 'Moderate'}
                            onChange={(e) => setEditAllergyForm({ ...editAllergyForm, severity: e.target.value as any })}
                            className="h-8 rounded border px-2"
                          >
                            <option value="Mild">Mild</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Severe">Severe</option>
                          </select>
                          <Input
                            value={editAllergyForm.reaction || ''}
                            onChange={(e) => setEditAllergyForm({ ...editAllergyForm, reaction: e.target.value })}
                            className="h-8 flex-1"
                            placeholder="Reaction"
                          />
                          <Button size="sm" onClick={() => handleSaveAllergyEdit(allergy.id)} className="h-8">
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelAllergyEdit} className="h-8">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <AlertCircle className={`w-4 h-4 ${allergy.severity === 'Severe' ? 'text-red-600' : allergy.severity === 'Moderate' ? 'text-yellow-600' : 'text-blue-600'}`} />
                            <span className="font-medium">{allergy.allergen} ({allergy.severity.toLowerCase()})</span>
                            {allergy.reaction && <span className="text-sm text-gray-600 dark:text-gray-400">- {allergy.reaction}</span>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAllergy(allergy)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAllergy(allergy.id)}
                              disabled={deletingIds.has(allergy.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingIds.has(allergy.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Conditions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Conditions</h3>
              <Button
                size="sm"
                onClick={() => setShowAddConditionForm(!showAddConditionForm)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Condition
              </Button>
            </div>

            {showAddConditionForm && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Condition Name *</Label>
                    <Input
                      placeholder="Hypertension, Diabetes, etc."
                      value={conditionFormData.name || ''}
                      onChange={(e) => setConditionFormData({ ...conditionFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <select
                      className="w-full border rounded-md p-2 bg-background"
                      value={conditionFormData.status || 'Active'}
                      onChange={(e) => setConditionFormData({ ...conditionFormData, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Managed">Managed</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <Label>Diagnosed Date</Label>
                    <Input
                      type="date"
                      value={conditionFormData.diagnosedDate || ''}
                      onChange={(e) => setConditionFormData({ ...conditionFormData, diagnosedDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Additional information..."
                    value={conditionFormData.notes || ''}
                    onChange={(e) => setConditionFormData({ ...conditionFormData, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCondition}>Add</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddConditionForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {conditions.length === 0 ? (
              <p className="text-center text-gray-500 py-4 text-sm">No conditions recorded</p>
            ) : (
              <div className="space-y-2">
                {conditions.map((condition) => {
                  const isEditing = editingConditionId === condition.id
                  return (
                    <div key={condition.id} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editConditionForm.name || ''}
                            onChange={(e) => setEditConditionForm({ ...editConditionForm, name: e.target.value })}
                            className="h-8"
                            placeholder="Condition name"
                          />
                          <div className="flex gap-2">
                            <select
                              value={editConditionForm.status || 'Active'}
                              onChange={(e) => setEditConditionForm({ ...editConditionForm, status: e.target.value as any })}
                              className="h-8 rounded border px-2 flex-1"
                            >
                              <option value="Active">Active</option>
                              <option value="Managed">Managed</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                            <Input
                              type="date"
                              value={editConditionForm.diagnosedDate || ''}
                              onChange={(e) => setEditConditionForm({ ...editConditionForm, diagnosedDate: e.target.value })}
                              className="h-8 flex-1"
                            />
                          </div>
                          <Textarea
                            value={editConditionForm.notes || ''}
                            onChange={(e) => setEditConditionForm({ ...editConditionForm, notes: e.target.value })}
                            className="min-h-[60px]"
                            placeholder="Notes"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveConditionEdit(condition.id)}>
                              <Save className="w-3 h-3 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelConditionEdit}>
                              <X className="w-3 h-3 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="font-medium">{condition.name}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              condition.status === 'Active' ? 'bg-red-100 text-red-800' :
                              condition.status === 'Managed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {condition.status}
                            </span>
                            {condition.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{condition.notes}</p>}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCondition(condition)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCondition(condition.id)}
                              disabled={deletingIds.has(condition.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              {deletingIds.has(condition.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
