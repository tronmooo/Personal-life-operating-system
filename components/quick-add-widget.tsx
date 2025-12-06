'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Sparkles, FileText, Calendar, DollarSign, CheckSquare, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { Domain } from '@/types/domains'

type QuickAddType = 'task' | 'bill' | 'event' | 'document' | 'note'

const QUICK_ACTIONS = [
  { id: 'task' as QuickAddType, label: 'Task', icon: CheckSquare, domain: 'miscellaneous' as Domain, color: 'bg-blue-500' },
  { id: 'bill' as QuickAddType, label: 'Bill', icon: DollarSign, domain: 'financial' as Domain, color: 'bg-green-500' },
  { id: 'event' as QuickAddType, label: 'Event', icon: Calendar, domain: 'relationships' as Domain, color: 'bg-purple-500' },
  { id: 'document' as QuickAddType, label: 'Document', icon: FileText, domain: 'digital' as Domain, color: 'bg-orange-500' },
  { id: 'note' as QuickAddType, label: 'Note', icon: Sparkles, domain: 'mindfulness' as Domain, color: 'bg-pink-500' },
]

const DOMAINS: Array<{ value: Domain; label: string }> = [
  { value: 'financial', label: '💰 Financial' },
  { value: 'health', label: '🏥 Health' },
  { value: 'insurance', label: '🛡️ Insurance & Legal' },
  { value: 'home', label: '🏠 Home' },
  { value: 'vehicles', label: '🚗 Vehicles' },
  { value: 'appliances', label: '🔧 Appliances' },
  { value: 'pets', label: '🐾 Pets' },
  { value: 'relationships', label: '💞 Relationships' },
  { value: 'digital', label: '💻 Digital' },
  { value: 'mindfulness', label: '🧘 Mindfulness' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'nutrition', label: '🥗 Nutrition' },
  { value: 'miscellaneous', label: '🗂️ Miscellaneous' },
]

export function QuickAddWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<QuickAddType | null>(null)
  const [domain, setDomain] = useState<Domain>('financial')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { addTask, addBill, addData } = useData()

  const handleSubmit = async () => {
    if (!title.trim() || !selectedType) return

    setIsProcessing(true)

    try {
      // Parse natural language if present
      const parsedData = parseNaturalLanguage(title)
      const resolvedTitle = (parsedData.title || title).trim()
      const resolvedNotes = description.trim() ? description.trim() : undefined
      const resolvedDate = normalizeDate(parsedData.date || date)
      const resolvedAmount = normalizeAmount(parsedData.amount || amount)
      const targetDomain = selectedType === 'bill' ? 'financial' : domain

      if (selectedType === 'task') {
        await addTask({
          title: resolvedTitle,
          priority: parsedData.priority || 'medium',
          completed: false,
          dueDate: resolvedDate || undefined,
          category: targetDomain,
        })

        await addData(targetDomain, {
          title: resolvedTitle,
          description: resolvedNotes,
          metadata: {
            logType: 'task',
            domain: targetDomain,
            dueDate: resolvedDate || null,
            notes: resolvedNotes,
            priority: parsedData.priority || 'medium',
            source: 'quick-add-widget',
          } as any,
        })
      } else if (selectedType === 'bill') {
        await addBill({
          title: resolvedTitle,
          amount: resolvedAmount ?? 0,
          dueDate: resolvedDate || new Date().toISOString().split('T')[0],
          category: domain,
          status: 'pending',
          recurring: true
        })

        await addData('financial', {
          title: resolvedTitle,
          description: resolvedNotes,
          metadata: {
            logType: 'bill',
            domain: 'financial',
            amount: resolvedAmount ?? null,
            dueDate: resolvedDate || null,
            status: 'pending',
            category: domain,
            notes: resolvedNotes,
            source: 'quick-add-widget',
          } as any,
        })
      } else {
        await addData(targetDomain, {
          title: resolvedTitle,
          description: resolvedNotes,
          metadata: {
            logType: selectedType,
            domain: targetDomain,
            date: resolvedDate || null,
            amount: resolvedAmount ?? null,
            notes: resolvedNotes,
            source: 'quick-add-widget',
          } as any,
        })
      }

      showNotification('✅ Added successfully!')
      
      // Reset
      setTitle('')
      setDescription('')
      setAmount('')
      setDate('')
      setSelectedType(null)
      setDomain('financial')
      setIsOpen(false)
    } catch (error) {
      console.error('Quick add error:', error)
      showNotification('❌ Failed to add')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickAction = (type: QuickAddType) => {
    setSelectedType(type)
    const defaultDomain = QUICK_ACTIONS.find(action => action.id === type)?.domain
    if (defaultDomain) {
      setDomain(defaultDomain)
    }
    setIsOpen(true)
  }

  return (
    <>
      {/* Floating Add Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Quick Action Buttons (shown on hover) */}
        <div className="group">
          <div className="hidden group-hover:flex flex-col gap-2 mb-2 transition-all">
            {QUICK_ACTIONS.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="secondary"
                onClick={() => handleQuickAction(action.id)}
                className="shadow-lg animate-in slide-in-from-right"
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>

          {/* Main FAB */}
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all hover:scale-110"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Quick Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Quick Add
              {selectedType && (
                <Badge variant="secondary" className="capitalize">
                  {selectedType}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Type Selection */}
            {!selectedType && (
              <div>
                <Label>What do you want to add?</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      onClick={() => {
                        setSelectedType(action.id)
                        setDomain(action.domain)
                      }}
                      className="flex flex-col h-20 gap-1"
                    >
                      <action.icon className="h-5 w-5" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Title Input */}
            {selectedType && (
              <>
                <div>
                  <Label>Title / Quick Entry</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={`e.g., ${
                      selectedType === 'task' ? 'Buy groceries' :
                      selectedType === 'bill' ? 'Pay electricity $150 due Jan 15' :
                      selectedType === 'event' ? 'Dentist appointment Tuesday 2pm' :
                      'Enter details...'
                    }`}
                    className="mt-1"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    💡 Try natural language: "Pay rent $1500 on the 1st" or "Doctor appointment next Friday"
                  </p>
                </div>

                {/* Domain Selection */}
                <div>
                  <Label>Domain</Label>
                  <Select value={domain} onValueChange={(value) => setDomain(value as Domain)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-3">
                  {(selectedType === 'bill' || selectedType === 'event') && (
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  {selectedType === 'bill' && (
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add any additional details..."
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedType(null)
                      setTitle('')
                      setDescription('')
                    }}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!title.trim() || !selectedType || isProcessing}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isProcessing ? 'Adding...' : 'Add'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Natural language parser (simple version)
function parseNaturalLanguage(text: string) {
  const result: {
    title: string
    date: string | null
    amount: string | null
    priority: 'high' | 'medium' | 'low' | null
  } = {
    title: text,
    date: null,
    amount: null,
    priority: null,
  }

  // Extract amount ($150, $1,500, etc.)
  const amountMatch = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)/)
  if (amountMatch) {
    result.amount = amountMatch[1].replace(/,/g, '')
    result.title = text.replace(amountMatch[0], '').trim()
  }

  // Extract dates (simple patterns)
  const datePatterns = [
    /on ((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2})/i,
    /due ((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2})/i,
    /(next|this) (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i,
    /on the (\d{1,2})(st|nd|rd|th)?/,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      // Simple date parsing (would need better implementation)
      result.date = new Date().toISOString().split('T')[0]
      result.title = text.replace(match[0], '').trim()
      break
    }
  }

  // Extract priority
  if (/urgent|asap|high priority/i.test(text)) {
    result.priority = 'high'
    result.title = text.replace(/urgent|asap|high priority/gi, '').trim()
  } else if (/low priority/i.test(text)) {
    result.priority = 'low'
    result.title = text.replace(/low priority/gi, '').trim()
  }

  return result
}

// Simple notification (could be enhanced with toast library)
function showNotification(message: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('LifeHub', { body: message })
  } else {
    alert(message)
  }
}

function normalizeDate(input: string | null | undefined) {
  if (!input) return null
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().split('T')[0]
}

function normalizeAmount(input: string | null | undefined) {
  if (!input) return null
  const normalized = Number.parseFloat(input.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(normalized) ? normalized : null
}
