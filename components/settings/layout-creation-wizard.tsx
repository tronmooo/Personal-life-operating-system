'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowRight, ArrowLeft, Check, Wand2, LayoutTemplate, 
  Eye, Sparkles, Home, Car, Heart, Briefcase, Users, GraduationCap,
  FileText, Shield
} from 'lucide-react'
import { DashboardLayout, DashboardCard, DEFAULT_DOMAIN_CARDS } from '@/lib/types/dashboard-layout-types'

interface LayoutCreationWizardProps {
  open: boolean
  onClose: () => void
  onComplete: (layout: DashboardLayout) => void
}

const WIZARD_STEPS = [
  { id: 1, title: 'Details', icon: Wand2 },
  { id: 2, title: 'Template', icon: LayoutTemplate },
  { id: 3, title: 'Domains', icon: Eye },
  { id: 4, title: 'Review', icon: Check },
]

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch and build your own layout',
    icon: '🎨',
    cards: [],
  },
  {
    id: 'essential',
    name: 'Essentials Only',
    description: 'Financial, Health, and Vehicles',
    icon: '⭐',
    domains: ['financial', 'health', 'vehicles'],
  },
  {
    id: 'comprehensive',
    name: 'Comprehensive View',
    description: 'All domains visible',
    icon: '📊',
    domains: ['financial', 'health', 'vehicles', 'relationships', 'legal', 'insurance', 'pets', 'home'],
  },
  {
    id: 'professional',
    name: 'Professional Focus',
    description: 'Legal, Financial, and Insurance',
    icon: '💼',
    domains: ['legal', 'financial', 'insurance', 'digital'],
  },
]

const DOMAIN_INFO = [
  { id: 'financial', name: 'Financial', icon: '💰', color: 'green', description: 'Bank accounts, investments, budgets' },
  { id: 'health', name: 'Health', icon: '❤️', color: 'red', description: 'Vitals, medications, appointments' },
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', color: 'purple', description: 'Cars, maintenance, insurance' },
  { id: 'relationships', name: 'Relationships', icon: '👥', color: 'pink', description: 'Family, friends, contacts' },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: 'slate', description: 'Documents, contracts, compliance' },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: 'teal', description: 'Policies, coverage, claims' },
  { id: 'pets', name: 'Pets', icon: '🐾', color: 'orange', description: 'Pet care, vet visits, vaccinations' },
  { id: 'home', name: 'Home', icon: '🏠', color: 'amber', description: 'Properties, maintenance, projects' },
  { id: 'digital', name: 'Digital', icon: '💻', color: 'cyan', description: 'Subscriptions, passwords, accounts' },
]

export function LayoutCreationWizard({ open, onClose, onComplete }: LayoutCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [layoutName, setLayoutName] = useState('')
  const [layoutDescription, setLayoutDescription] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('comprehensive')
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'financial', 'health', 'vehicles', 'relationships', 'legal', 'insurance', 'pets', 'home'
  ])

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = TEMPLATES.find(t => t.id === templateId)
    if (template && template.domains) {
      setSelectedDomains(template.domains)
    } else if (templateId === 'blank') {
      setSelectedDomains([])
    }
  }

  const toggleDomain = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(d => d !== domainId)
        : [...prev, domainId]
    )
  }

  const handleComplete = () => {
    // Create cards from selected domains
    const cards: DashboardCard[] = DEFAULT_DOMAIN_CARDS
      .filter(card => selectedDomains.includes(card.domain))
      .map((card, index) => ({
        ...card,
        position: {
          x: (index % 2) * 6,
          y: Math.floor(index / 2) * 4,
          w: 6,
          h: 4,
        },
      }))

    const newLayout: DashboardLayout = {
      layout_name: layoutName || 'My Custom Layout',
      description: layoutDescription || 'Created with Layout Wizard',
      layout_config: {
        cards,
        columns: 12,
        rowHeight: 100,
      },
      is_active: false,
      is_default: false,
    }

    onComplete(newLayout)
    resetWizard()
    onClose()
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setLayoutName('')
    setLayoutDescription('')
    setSelectedTemplate('comprehensive')
    setSelectedDomains(['financial', 'health', 'vehicles', 'career', 'relationships', 'education', 'legal', 'insurance'])
  }

  const canProceed = () => {
    if (currentStep === 1) return layoutName.trim().length > 0
    if (currentStep === 2) return selectedTemplate.length > 0
    if (currentStep === 3) return selectedDomains.length > 0
    return true
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Create Custom Layout
          </DialogTitle>
          <DialogDescription>
            Follow the steps below to create your perfect dashboard layout
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center flex-col">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? 'bg-purple-600 border-purple-600 text-white' : ''}
                      ${isCompleted ? 'bg-green-600 border-green-600 text-white' : ''}
                      ${!isActive && !isCompleted ? 'bg-gray-100 border-gray-300 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 ${isActive ? 'font-semibold' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Name Your Layout</h3>
              
              <div>
                <Label htmlFor="layout-name">Layout Name *</Label>
                <Input
                  id="layout-name"
                  placeholder="e.g., My Workspace, Personal Dashboard, etc."
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="layout-description">Description (Optional)</Label>
                <Textarea
                  id="layout-description"
                  placeholder="Describe what this layout is for..."
                  value={layoutDescription}
                  onChange={(e) => setLayoutDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Tip:</strong> Choose a descriptive name that helps you remember what this layout is for.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Template */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Choose a Starting Template</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {TEMPLATES.map(template => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-2 border-purple-500 shadow-lg'
                        : 'border-2 border-gray-200 hover:border-purple-300'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-3xl">{template.icon}</span>
                        {selectedTemplate === template.id && (
                          <Badge className="bg-purple-600">Selected</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.description}
                      </p>
                      {template.domains && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {template.domains.slice(0, 3).map(domain => (
                            <Badge key={domain} variant="outline" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                          {template.domains.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.domains.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Select Domains */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Select Domains to Include</h3>
              
              <div className="grid grid-cols-2 gap-3">
                {DOMAIN_INFO.map(domain => {
                  const isSelected = selectedDomains.includes(domain.id)
                  
                  return (
                    <div
                      key={domain.id}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${isSelected 
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                          : 'border-gray-200 hover:border-purple-300'}
                      `}
                      onClick={() => toggleDomain(domain.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{domain.icon}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{domain.name}</h4>
                          </div>
                        </div>
                        <Checkbox checked={isSelected} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {domain.description}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm">
                  <strong>Selected:</strong> {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Review Your Layout</h3>
              
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-gray-500">Layout Name</Label>
                    <p className="font-semibold text-lg">{layoutName}</p>
                  </div>

                  {layoutDescription && (
                    <div>
                      <Label className="text-gray-500">Description</Label>
                      <p className="text-sm">{layoutDescription}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-500">Template</Label>
                    <p className="font-medium">
                      {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                    </p>
                  </div>

                  <div>
                    <Label className="text-gray-500">Domains ({selectedDomains.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedDomains.map(domainId => {
                        const domain = DOMAIN_INFO.find(d => d.id === domainId)
                        return (
                          <Badge key={domainId} variant="outline" className="flex items-center gap-1">
                            <span>{domain?.icon}</span>
                            {domain?.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>✅ Ready to create!</strong> Click "Create Layout" to save your new dashboard layout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { resetWizard(); onClose(); }}>
              Cancel
            </Button>

            {currentStep < WIZARD_STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Create Layout
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


























