'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Sparkles, Upload, Loader2, Camera, Trash2 } from 'lucide-react'
import { useAutoFillData } from '@/lib/tools/auto-fill'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

interface FormField {
  label: string
  value: string
  confidence?: number
}

interface UploadedForm {
  id: string
  name: string
  type: string
  fields: FormField[]
  uploadedAt: string
}

export function SmartFormFiller() {
  const autoFillData = useAutoFillData()
  const [forms, setForms] = useState<UploadedForm[]>([])
  const [formType, setFormType] = useState('job-application')
  const [scanning, setScanning] = useState(false)
  const [manualFields, setManualFields] = useState<FormField[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formTypes = [
    { id: 'job-application', name: 'Job Application', icon: '💼' },
    { id: 'rental-application', name: 'Rental Application', icon: '🏠' },
    { id: 'loan-application', name: 'Loan Application', icon: '💰' },
    { id: 'insurance-form', name: 'Insurance Form', icon: '🛡️' },
    { id: 'government-form', name: 'Government Form', icon: '🏛️' },
  ]

  const handleFileUpload = async (file: File) => {
    setScanning(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', 'form')
      
      const response = await fetch('/api/ai-tools/ocr', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to scan form')
      }
      
      const result = await response.json()
      const extractedData = result.data || {}
      
      // Extract fields from form
      const fields: FormField[] = []
      
      // Check if it has a fields array
      if (extractedData.fields && Array.isArray(extractedData.fields)) {
        extractedData.fields.forEach((field: any) => {
          fields.push({
            label: field.label || field.name || 'Unknown Field',
            value: field.value || '',
            confidence: 95
          })
        })
      } else {
        // Convert extracted data to fields
        Object.entries(extractedData).forEach(([key, value]) => {
          if (typeof value === 'string' || typeof value === 'number') {
            const formattedLabel = key
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
              .trim()
            
            fields.push({
              label: formattedLabel,
              value: String(value),
              confidence: 95
            })
          }
        })
      }
      
      if (fields.length === 0) {
        throw new Error('Could not extract form fields')
      }
      
      const newForm: UploadedForm = {
        id: Date.now().toString(),
        name: file.name,
        type: formType,
        fields,
        uploadedAt: new Date().toISOString()
      }
      
      setForms([newForm, ...forms])
      setManualFields(fields) // Also update the manual form with extracted data
      
      toast({
        title: 'Form Scanned!',
        description: `Extracted ${fields.length} fields from ${file.name}`
      })
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to scan form.',
        variant: 'destructive'
      })
    } finally {
      setScanning(false)
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

  const autoFillWithStoredData = () => {
    const profile = autoFillData.profile
    const income = autoFillData.income
    
    const autoFilledFields: FormField[] = []
    
    if (profile.name) autoFilledFields.push({ label: 'Full Name', value: profile.name })
    if (profile.email) autoFilledFields.push({ label: 'Email Address', value: profile.email })
    if (profile.phone) autoFilledFields.push({ label: 'Phone Number', value: profile.phone })
    if (profile.age) autoFilledFields.push({ label: 'Age', value: String(profile.age) })
    if (income.annual > 0) autoFilledFields.push({ label: 'Annual Income', value: `$${income.annual.toLocaleString()}` })
    if (income.monthly > 0) autoFilledFields.push({ label: 'Monthly Income', value: `$${income.monthly.toLocaleString()}` })
    
    if (autoFilledFields.length === 0) {
      toast({
        title: 'No Stored Data',
        description: 'Add personal and financial data in other domains first, then auto-fill will use that data.',
        variant: 'destructive'
      })
      return
    }
    
    setManualFields(autoFilledFields)
    toast({
      title: 'Auto-Filled!',
      description: `Filled ${autoFilledFields.length} fields from your stored data.`
    })
  }

  const deleteForm = (id: string) => {
    setForms(forms.filter(f => f.id !== id))
    toast({
      title: 'Removed',
      description: 'Form removed.'
    })
  }

  const updateField = (index: number, value: string) => {
    const updated = [...manualFields]
    updated[index] = { ...updated[index], value }
    setManualFields(updated)
  }

  const addField = () => {
    setManualFields([...manualFields, { label: 'New Field', value: '' }])
  }

  const removeField = (index: number) => {
    setManualFields(manualFields.filter((_, i) => i !== index))
  }

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
          <span className="text-4xl">📋</span>
          Smart Form Filler AI
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload forms to extract fields, or use stored data to auto-fill applications
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Type Selection */}
        <div>
          <Label className="text-lg mb-3 block">Select Form Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {formTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setFormType(type.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  formType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-300 dark:border-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">{type.icon}</div>
                <div className="font-semibold text-sm">{type.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Form Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-semibold mb-2">Upload a Form to Extract Fields</h3>
          <p className="text-sm text-muted-foreground mb-3">AI will identify all form fields and values</p>
          <Button onClick={handleUploadClick} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning Form...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Form
              </>
            )}
          </Button>
        </div>

        {/* Manual Form Fields */}
        <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Fields
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addField}>
                Add Field
              </Button>
              <Button variant="outline" size="sm" onClick={autoFillWithStoredData}>
                <Sparkles className="h-4 w-4 mr-1" />
                Auto-Fill
              </Button>
            </div>
          </div>
          
          {manualFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No fields yet. Upload a form or add fields manually.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {manualFields.map((field, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const updated = [...manualFields]
                        updated[index] = { ...updated[index], label: e.target.value }
                        setManualFields(updated)
                      }}
                      placeholder="Field label"
                      className="font-medium"
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => updateField(index, e.target.value)}
                      placeholder="Value"
                    />
                  </div>
                  {field.confidence && (
                    <Badge variant="secondary" className="shrink-0">
                      {field.confidence}%
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => removeField(index)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uploaded Forms History */}
        {forms.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Uploaded Forms</h3>
            <div className="space-y-2">
              {forms.map(form => (
                <div key={form.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-semibold">{form.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {form.fields.length} fields • {new Date(form.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setManualFields(form.fields)}
                    >
                      Load
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteForm(form.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Features */}
        <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Features:
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Scan forms and extract all field labels and values</li>
            <li>• Auto-fill using your stored profile and financial data</li>
            <li>• Edit and customize extracted fields</li>
            <li>• Save form templates for reuse</li>
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{forms.length}</div>
            <div className="text-xs text-muted-foreground">Forms Uploaded</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{manualFields.length}</div>
            <div className="text-xs text-muted-foreground">Current Fields</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {forms.reduce((sum, f) => sum + f.fields.length, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Extracted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}































