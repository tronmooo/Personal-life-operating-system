'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { DOMAIN_CONFIGS } from '@/types/domains'
import { DOMAIN_LOGGING_CONFIGS } from '@/lib/domain-logging-configs'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  FileText, Heart, DollarSign, Briefcase, Shield, Home, Car, Users, 
  GraduationCap, PawPrint, Plane, Star, Smartphone, Leaf, Mountain, 
  Utensils, Zap, Activity, Calendar, Target, ChevronRight, Upload,
  Edit3, Mic, Sparkles, Loader2, ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const DOMAIN_ICONS: Record<string, any> = {
  health: Heart,
  financial: DollarSign,
  career: Briefcase,
  insurance: Shield,
  home: Home,
  vehicles: Car,
  relationships: Users,
  education: GraduationCap,
  pets: PawPrint,
  travel: Plane,
  collectibles: Star,
  digital: Smartphone,
  mindfulness: Leaf,
  outdoor: Mountain,
  nutrition: Utensils,
  documents: FileText,
  utilities: Zap,
  appliances: Activity,
  schedule: Calendar,
  planning: Target,
  legal: FileText
}

interface AddDataDialogProps {
  open: boolean
  onClose: () => void
}

type EntryType = 'quick-log' | 'document' | 'ai-voice'

export function AddDataDialog({ open, onClose }: AddDataDialogProps) {
  const { addData } = useData()
  const [step, setStep] = useState<'domain' | 'type' | 'form'>('domain')
  const [selectedDomain, setSelectedDomain] = useState<string>('')
  const [selectedType, setSelectedType] = useState<EntryType>('quick-log')
  const [selectedLogType, setSelectedLogType] = useState<string>('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [voiceInput, setVoiceInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiResult, setAiResult] = useState<any>(null)

  const handleDomainSelect = (domainId: string) => {
    setSelectedDomain(domainId)
    setStep('type')
  }

  const handleTypeSelect = (type: EntryType) => {
    setSelectedType(type)
    
    // If AI voice, stay on type step for voice input
    if (type !== 'ai-voice') {
      setStep('form')
    }
  }

  const handleVoiceProcess = async () => {
    if (!voiceInput.trim()) return
    
    setIsProcessing(true)
    
    // Simulate AI processing (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Extract data from natural language
    const extracted = extractDataFromText(voiceInput, selectedDomain)
    setAiResult(extracted)
    setFormData(extracted.data)
    setSelectedLogType(extracted.logType)
    setIsProcessing(false)
  }

  const extractDataFromText = (text: string, domain: string) => {
    // Simple extraction logic (replace with actual AI/NLP)
    const lower = text.toLowerCase()
    
    // Health domain examples
    if (domain === 'health') {
      const weightMatch = text.match(/(\d+\.?\d*)\s*(lbs?|pounds?)/i)
      if (weightMatch) {
        return {
          logType: 'weight',
          data: {
            weight: parseFloat(weightMatch[1]),
            date: format(new Date(), 'yyyy-MM-dd'),
            time: format(new Date(), 'HH:mm')
          }
        }
      }
      
      const bpMatch = text.match(/(\d+)\s*\/\s*(\d+)/i)
      if (bpMatch) {
        return {
          logType: 'blood-pressure',
          data: {
            systolic: parseInt(bpMatch[1]),
            diastolic: parseInt(bpMatch[2]),
            date: format(new Date(), 'yyyy-MM-dd'),
            time: format(new Date(), 'HH:mm')
          }
        }
      }
    }
    
    // Financial domain examples
    if (domain === 'financial') {
      const expenseMatch = text.match(/spent?\s*\$?(\d+\.?\d*)/i)
      if (expenseMatch) {
        let category = 'Other'
        if (/food|lunch|dinner|restaurant|groceries/i.test(text)) category = 'Food & Dining'
        if (/gas|fuel|uber|transport/i.test(text)) category = 'Transportation'
        if (/shopping|bought|purchase/i.test(text)) category = 'Shopping'
        
        return {
          logType: 'expense',
          data: {
            amount: parseFloat(expenseMatch[1]),
            category,
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: text
          }
        }
      }
    }
    
    // Nutrition domain examples
    if (domain === 'nutrition') {
      let mealType = 'Snack'
      if (/breakfast/i.test(text)) mealType = 'Breakfast'
      if (/lunch/i.test(text)) mealType = 'Lunch'
      if (/dinner/i.test(text)) mealType = 'Dinner'
      
      return {
        logType: 'meal',
        data: {
          mealType,
          description: text,
          time: format(new Date(), 'HH:mm')
        }
      }
    }
    
    // Default fallback
    return {
      logType: DOMAIN_LOGGING_CONFIGS[domain]?.logTypes[0]?.id || 'default',
      data: {
        notes: text,
        date: format(new Date(), 'yyyy-MM-dd')
      }
    }
  }

  const handleSubmit = async () => {
    if (!selectedDomain) return

    const config = DOMAIN_LOGGING_CONFIGS[selectedDomain]
    const logType = config?.logTypes.find(lt => lt.id === selectedLogType)

    const now = new Date()
    let timestamp = now.toISOString()
    if (formData?.date || formData?.time) {
      const datePart = formData.date ?? format(now, 'yyyy-MM-dd')
      const timePart = formData.time ?? '00:00'
      const composed = new Date(`${datePart}T${timePart}`)
      if (!Number.isNaN(composed.getTime())) {
        timestamp = composed.toISOString()
      }
    } else if (formData?.timestamp) {
      const parsed = new Date(formData.timestamp)
      if (!Number.isNaN(parsed.getTime())) {
        timestamp = parsed.toISOString()
      }
    }

    const typeName = logType?.name ?? selectedLogType ?? 'Log Entry'
    const icon = logType?.icon ?? '📝'
    const primaryText =
      formData?.title ||
      formData?.name ||
      formData?.subject ||
      (typeof formData?.description === 'string' && formData.description.length > 0
        ? formData.description.split('\n')[0]
        : undefined) ||
      `${typeName} - ${format(new Date(timestamp), 'PPP p')}`
    const description =
      formData?.notes ||
      (typeof formData?.description === 'string' ? formData.description : undefined) ||
      (aiResult?.summary as string | undefined) ||
      ''

    const metadata: Record<string, any> = {
      source: 'add-data-dialog',
      createdVia: selectedType,
      logType: selectedLogType || logType?.id || 'custom',
      typeName,
      icon,
      timestamp,
      data: { ...formData },
    }

    if (selectedType === 'ai-voice' && aiResult) {
      metadata.aiExtraction = aiResult
    }

    try {
      await addData(selectedDomain as any, {
        title: primaryText,
        description,
        metadata,
      })
    } catch (error) {
      console.error('Failed to add domain entry from AddDataDialog:', error)
    }

    handleClose()
  }

  const handleClose = () => {
    setStep('domain')
    setSelectedDomain('')
    setSelectedType('quick-log')
    setSelectedLogType('')
    setFormData({})
    setVoiceInput('')
    setAiResult(null)
    setIsProcessing(false)
    onClose()
  }

  const handleBack = () => {
    if (step === 'type') {
      setStep('domain')
      setSelectedDomain('')
    } else if (step === 'form') {
      setStep('type')
      setSelectedType('quick-log')
      setFormData({})
      setAiResult(null)
    }
  }

  const domains = Object.keys(DOMAIN_CONFIGS).map(key => ({
    ...DOMAIN_CONFIGS[key as keyof typeof DOMAIN_CONFIGS],
    key: key,
    icon: DOMAIN_ICONS[key] || FileText,
    hasQuickLog: DOMAIN_LOGGING_CONFIGS[key]?.enabled || false
  })).sort((a, b) => a.name.localeCompare(b.name))

  const selectedDomainConfig = selectedDomain 
    ? domains.find(d => d.id === selectedDomain)
    : null

  const domainLoggingConfig = selectedDomain 
    ? DOMAIN_LOGGING_CONFIGS[selectedDomain]
    : null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            {step === 'domain' && '📂 Select Domain'}
            {step === 'type' && '🔖 Choose Entry Method'}
            {step === 'form' && '✍️ Add Data'}
          </DialogTitle>
          <DialogDescription>
            {step === 'domain' && 'Choose which life domain you want to add data to'}
            {step === 'type' && selectedType !== 'ai-voice' && 'Select how you want to enter your data'}
            {step === 'type' && selectedType === 'ai-voice' && 'Speak naturally and AI will extract the data'}
            {step === 'form' && `Adding data to ${selectedDomainConfig?.name}`}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Domain Selection */}
        {step === 'domain' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
            {domains.map((domain) => {
              const Icon = domain.icon
              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelect(domain.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-105",
                    "border-transparent hover:border-primary relative"
                  )}
                >
                  <div className={`p-3 rounded-xl ${domain.color} shadow-md`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-center">{domain.name}</span>
                  {domain.hasQuickLog && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Quick Log
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Step 2: Type Selection */}
        {step === 'type' && selectedType !== 'ai-voice' && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quick Log Option */}
              {domainLoggingConfig?.enabled && (
                <button
                  onClick={() => handleTypeSelect('quick-log')}
                  className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-transparent hover:border-green-500 bg-green-50 dark:bg-green-950/20 hover:shadow-lg transition-all group"
                >
                  <div className="p-4 rounded-full bg-green-500 text-white group-hover:scale-110 transition-transform">
                    <Zap className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-lg mb-2">Quick Log</h3>
                    <p className="text-sm text-muted-foreground">
                      Use smart forms for this domain
                    </p>
                    <Badge className="mt-2" variant="secondary">
                      {domainLoggingConfig.logTypes.length} log types available
                    </Badge>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </button>
              )}

              {/* Document Upload Option */}
              <button
                onClick={() => handleTypeSelect('document')}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-transparent hover:border-blue-500 bg-blue-50 dark:bg-blue-950/20 hover:shadow-lg transition-all group"
              >
                <div className="p-4 rounded-full bg-blue-500 text-white group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2">Upload Document</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload files, receipts, or documents
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              {/* AI Voice Option */}
              <button
                onClick={() => {
                  setSelectedType('ai-voice')
                  // Stay on this step to show voice input
                }}
                className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-transparent hover:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-lg transition-all group"
              >
                <div className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AI Voice Input
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Speak naturally, AI extracts data
                  </p>
                  <Badge className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Mic className="h-3 w-3 mr-1" />
                    Try it!
                  </Badge>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex justify-start pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domains
              </Button>
            </div>
          </div>
        )}

        {/* AI Voice Input Interface */}
        {step === 'type' && selectedType === 'ai-voice' && (
          <div className="space-y-6 py-4">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Voice Input</h3>
                  <p className="text-sm text-muted-foreground">Speak naturally and let AI do the rest</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice-input">What would you like to log?</Label>
                  <Textarea
                    id="voice-input"
                    placeholder="Example: 'I weigh 120 pounds' or 'Spent $45 on lunch' or 'Blood pressure 120/80'"
                    value={voiceInput}
                    onChange={(e) => setVoiceInput(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVoiceProcess}
                    disabled={!voiceInput.trim() || isProcessing}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Extract Data with AI
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                </div>

                {/* Examples */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Try these examples:</p>
                  <div className="space-y-2">
                    {selectedDomain === 'health' && (
                      <>
                        <button 
                          onClick={() => setVoiceInput("I weigh 165 pounds")}
                          className="text-sm text-left text-purple-600 hover:underline block"
                        >
                          • "I weigh 165 pounds"
                        </button>
                        <button 
                          onClick={() => setVoiceInput("My blood pressure is 120/80")}
                          className="text-sm text-left text-purple-600 hover:underline block"
                        >
                          • "My blood pressure is 120/80"
                        </button>
                      </>
                    )}
                    {selectedDomain === 'financial' && (
                      <>
                        <button 
                          onClick={() => setVoiceInput("Spent $45 on lunch at the restaurant")}
                          className="text-sm text-left text-purple-600 hover:underline block"
                        >
                          • "Spent $45 on lunch at the restaurant"
                        </button>
                        <button 
                          onClick={() => setVoiceInput("Bought groceries for $150")}
                          className="text-sm text-left text-purple-600 hover:underline block"
                        >
                          • "Bought groceries for $150"
                        </button>
                      </>
                    )}
                    {selectedDomain === 'nutrition' && (
                      <>
                        <button 
                          onClick={() => setVoiceInput("Had breakfast with eggs and toast")}
                          className="text-sm text-left text-purple-600 hover:underline block"
                        >
                          • "Had breakfast with eggs and toast"
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Result Preview */}
                {aiResult && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      <p className="font-semibold text-green-700 dark:text-green-400">Data Extracted Successfully!</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><strong>Log Type:</strong> {aiResult.logType}</p>
                      {Object.entries(aiResult.data).map(([key, value]) => (
                        <p key={key}>
                          <strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong>{' '}
                          {String(value)}
                        </p>
                      ))}
                    </div>
                    <Button 
                      onClick={() => {
                        setStep('form')
                      }}
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                    >
                      Continue to Review & Save
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Form - Quick Log or Document */}
        {step === 'form' && (
          <div className="space-y-4 py-4">
            {selectedType === 'quick-log' || selectedType === 'ai-voice' ? (
              <>
                {/* Show Domain Quick Log Component */}
                {domainLoggingConfig && (
                  <div className="space-y-4">
                    {/* Log Type Selection */}
                    <div className="flex gap-2 flex-wrap">
                      {domainLoggingConfig.logTypes.map(logType => (
                        <Button
                          key={logType.id}
                          variant={selectedLogType === logType.id ? 'default' : 'outline'}
                          onClick={() => setSelectedLogType(logType.id)}
                          className="gap-2"
                        >
                          <span>{logType.icon}</span>
                          {logType.name}
                        </Button>
                      ))}
                    </div>

                    {/* Quick Log Form */}
                    {selectedLogType && (
                      <QuickLogForm
                        domainId={selectedDomain}
                        logTypeId={selectedLogType}
                        initialData={formData}
                        onDataChange={setFormData}
                        onSubmit={handleSubmit}
                        onBack={handleBack}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Document Upload Form */
              <DocumentUploadForm
                onSubmit={handleSubmit}
                onBack={handleBack}
                formData={formData}
                setFormData={setFormData}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Quick Log Form Component
function QuickLogForm({ domainId, logTypeId, initialData, onDataChange, onSubmit, onBack }: any) {
  const config = DOMAIN_LOGGING_CONFIGS[domainId]
  const logType = config?.logTypes.find(lt => lt.id === logTypeId)
  const [formData, setFormData] = useState(initialData || {})

  if (!logType) return null

  const handleChange = (fieldName: string, value: any) => {
    const updated = { ...formData, [fieldName]: value }
    setFormData(updated)
    onDataChange(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {logType.fields.map(field => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {field.unit && <span className="text-muted-foreground ml-2">({field.unit})</span>}
            </Label>
            
            {field.type === 'select' ? (
              <select
                id={field.name}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                rows={3}
              />
            ) : field.type === 'date' ? (
              <Input
                id={field.name}
                type="date"
                required={field.required}
                value={formData[field.name] || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            ) : field.type === 'time' ? (
              <Input
                id={field.name}
                type="time"
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            ) : (
              <Input
                id={field.name}
                type={field.type}
                required={field.required}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" className="flex-1">
          <Zap className="h-4 w-4 mr-2" />
          Log Entry
        </Button>
      </div>
    </form>
  )
}

// Document Upload Form Component
function DocumentUploadForm({ onSubmit, onBack, formData, setFormData }: any) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Document Name *</Label>
        <Input
          id="title"
          placeholder="e.g., Insurance Policy, Receipt, Certificate"
          value={formData.title || ''}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the document"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g., Insurance, Tax, Receipt"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date || format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>
      </div>

      <div className="p-4 border-2 border-dashed rounded-lg text-center">
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag & drop files here or click to browse
        </p>
        <Button type="button" variant="outline" size="sm">Choose File</Button>
      </div>

      <div className="flex justify-between gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button type="submit" className="flex-1">
          <Upload className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>
    </form>
  )
}
