'use client'

/**
 * SaveToDomain Component
 * 
 * Allows users to save tool/calculator results back to their domains
 * with suggested domain, title, and metadata based on the tool type.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import type { Domain } from '@/types/domains'
import { DOMAIN_CONFIGS } from '@/types/domains'
import type { SaveResultData, ToolType } from '@/lib/hooks/use-domain-tools'

// Domain suggestion mapping based on result type
const RESULT_DOMAIN_SUGGESTIONS: Record<string, Domain[]> = {
  // Health measurements
  bmi: ['health'],
  weight: ['health'],
  'body-fat': ['health'],
  calories: ['nutrition', 'health'],
  macros: ['nutrition'],
  'water-intake': ['health', 'nutrition'],
  'heart-rate': ['health', 'fitness'],
  sleep: ['health', 'mindfulness'],
  workout: ['fitness'],
  meal: ['nutrition'],
  
  // Financial results
  'net-worth': ['financial'],
  budget: ['financial'],
  expense: ['financial'],
  income: ['financial'],
  savings: ['financial'],
  investment: ['financial'],
  loan: ['financial'],
  mortgage: ['financial', 'home'],
  tax: ['financial'],
  
  // Asset results
  vehicle: ['vehicles'],
  home: ['home'],
  property: ['home'],
  appliance: ['appliances'],
  
  // Other
  insurance: ['insurance'],
  service: ['services'],
  subscription: ['digital', 'services'],
  document: ['insurance'],
}

interface SaveToDomainProps {
  // The type of tool generating the result
  toolType: ToolType
  
  // Suggested title for the entry
  suggestedTitle: string
  
  // The result data to save
  resultData: Record<string, unknown>
  
  // Optional description
  description?: string
  
  // Suggested domain(s) based on result type
  suggestedDomains?: Domain[]
  
  // Result type hint for domain suggestions
  resultType?: string
  
  // Callback after successful save
  onSaved?: (entry: any) => void
  
  // Custom trigger button
  trigger?: React.ReactNode
  
  // Disabled state
  disabled?: boolean
  
  // Save function from useDomainTools
  onSave: (data: SaveResultData) => Promise<any>
}

export function SaveToDomain({
  toolType,
  suggestedTitle,
  resultData,
  description,
  suggestedDomains,
  resultType,
  onSaved,
  trigger,
  disabled = false,
  onSave,
}: SaveToDomainProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(suggestedTitle)
  const [entryDescription, setEntryDescription] = useState(description || '')
  const [selectedDomain, setSelectedDomain] = useState<Domain | ''>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Determine suggested domains
  const getDomainSuggestions = (): Domain[] => {
    if (suggestedDomains?.length) return suggestedDomains
    if (resultType && RESULT_DOMAIN_SUGGESTIONS[resultType]) {
      return RESULT_DOMAIN_SUGGESTIONS[resultType]
    }
    // Default suggestions based on tool type
    const toolSuggestions: Partial<Record<ToolType, Domain[]>> = {
      'bmi-calculator': ['health'],
      'calorie-calculator': ['nutrition', 'health'],
      'body-fat-calculator': ['health'],
      'macro-calculator': ['nutrition'],
      'water-intake-calculator': ['health'],
      'heart-rate-zones': ['fitness', 'health'],
      'sleep-calculator': ['health'],
      'protein-calculator': ['nutrition'],
      'meal-planner': ['nutrition'],
      'workout-planner': ['fitness'],
      'net-worth-calculator': ['financial'],
      'budget-calculator': ['financial'],
      'expense-tracker': ['financial'],
      'mortgage-calculator': ['financial', 'home'],
      'loan-calculator': ['financial'],
      'retirement-calculator': ['financial'],
      'auto-loan-calculator': ['vehicles', 'financial'],
      'home-affordability': ['home', 'financial'],
      'insurance-tracker': ['insurance'],
    }
    return toolSuggestions[toolType] || ['miscellaneous']
  }

  const domainSuggestions = getDomainSuggestions()
  const allDomains = Object.keys(DOMAIN_CONFIGS) as Domain[]

  const handleOpen = () => {
    setTitle(suggestedTitle)
    setEntryDescription(description || '')
    setSelectedDomain(domainSuggestions[0] || '')
    setSaved(false)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!selectedDomain || !title.trim()) return
    
    setSaving(true)
    try {
      const result = await onSave({
        domain: selectedDomain,
        title: title.trim(),
        description: entryDescription.trim() || undefined,
        metadata: {
          ...resultData,
          resultType,
          toolType,
          savedAt: new Date().toISOString(),
        }
      })

      if (result) {
        setSaved(true)
        onSaved?.(result)
        setTimeout(() => setOpen(false), 1500)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={handleOpen}>
        {trigger || (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Save className="h-4 w-4 mr-2" />
            Save to Domain
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Save Result to Domain
          </DialogTitle>
          <DialogDescription>
            Save this result to your LifeHub domains for tracking and future reference.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              Saved Successfully!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your result has been added to the {selectedDomain} domain.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Domain Selection */}
              <div className="space-y-2">
                <Label htmlFor="domain">Save to Domain</Label>
                <Select
                  value={selectedDomain}
                  onValueChange={(v) => setSelectedDomain(v as Domain)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Suggested domains first */}
                    {domainSuggestions.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Suggested
                        </div>
                        {domainSuggestions.map((domain) => (
                          <SelectItem key={domain} value={domain}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {domain === 'health' && '❤️'}
                                {domain === 'nutrition' && '🥗'}
                                {domain === 'fitness' && '💪'}
                                {domain === 'financial' && '💰'}
                                {domain === 'home' && '🏠'}
                                {domain === 'vehicles' && '🚗'}
                                {domain === 'insurance' && '🛡️'}
                                {domain === 'services' && '⚡'}
                                {domain === 'appliances' && '🔌'}
                                {domain === 'digital' && '💻'}
                                {domain === 'mindfulness' && '🧘'}
                                {domain === 'pets' && '🐾'}
                                {domain === 'relationships' && '👥'}
                                {domain === 'miscellaneous' && '📦'}
                              </span>
                              {DOMAIN_CONFIGS[domain]?.name || domain}
                              <Badge variant="secondary" className="ml-auto text-xs">
                                Suggested
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="my-1 border-t" />
                      </>
                    )}
                    {/* Other domains */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      All Domains
                    </div>
                    {allDomains
                      .filter(d => !domainSuggestions.includes(d))
                      .map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {domain === 'health' && '❤️'}
                              {domain === 'nutrition' && '🥗'}
                              {domain === 'fitness' && '💪'}
                              {domain === 'financial' && '💰'}
                              {domain === 'home' && '🏠'}
                              {domain === 'vehicles' && '🚗'}
                              {domain === 'insurance' && '🛡️'}
                              {domain === 'services' && '⚡'}
                              {domain === 'appliances' && '🔌'}
                              {domain === 'digital' && '💻'}
                              {domain === 'mindfulness' && '🧘'}
                              {domain === 'pets' && '🐾'}
                              {domain === 'relationships' && '👥'}
                              {domain === 'miscellaneous' && '📦'}
                            </span>
                            {DOMAIN_CONFIGS[domain]?.name || domain}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this entry"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={entryDescription}
                  onChange={(e) => setEntryDescription(e.target.value)}
                  placeholder="Add any notes or context..."
                  rows={3}
                />
              </div>

              {/* Result Preview */}
              <div className="space-y-2">
                <Label>Result Data Preview</Label>
                <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-32 overflow-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(resultData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!selectedDomain || !title.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save to {selectedDomain ? DOMAIN_CONFIGS[selectedDomain]?.name : 'Domain'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default SaveToDomain

