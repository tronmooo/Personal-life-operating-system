'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertTriangle, Bell, Check, X, Clock, Zap, Mail, Smartphone } from 'lucide-react'
import { format, differenceInDays, addDays, subDays, parseISO } from 'date-fns'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { cn } from '@/lib/utils'

export interface ExpirationData {
  documentName: string
  expirationDate: Date
  extractedText: string
  documentType?: string
  domain?: string
}

interface ExpirationTrackerProps {
  expiration: ExpirationData | null
  open: boolean
  onClose: () => void
  onConfirm: (tracked: boolean, customDate?: Date) => void
}

// Preset reminder options
const REMINDER_PRESETS = [
  { label: '1 Week Before', days: 7, icon: Clock },
  { label: '2 Weeks Before', days: 14, icon: Bell },
  { label: '1 Month Before', days: 30, icon: Calendar, recommended: true },
  { label: '2 Months Before', days: 60, icon: Zap },
  { label: '3 Months Before', days: 90, icon: AlertTriangle },
]

export function ExpirationTracker({ expiration, open, onClose, onConfirm }: ExpirationTrackerProps) {
  const [customDate, setCustomDate] = useState('')
  const [reminderDays, setReminderDays] = useState(30) // Default to 1 month
  const [multipleReminders, setMultipleReminders] = useState(true)
  const [customNotes, setCustomNotes] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [enableEmail, setEnableEmail] = useState(false)
  const [enablePush, setEnablePush] = useState(true)
  const { addTask } = useData()

  useEffect(() => {
    if (expiration) {
      setCustomDate(format(expiration.expirationDate, 'yyyy-MM-dd'))
      
      // Auto-detect priority based on days until expiration
      const daysUntil = differenceInDays(expiration.expirationDate, new Date())
      if (daysUntil <= 30) {
        setPriority('high')
      } else if (daysUntil <= 90) {
        setPriority('medium')
      } else {
        setPriority('low')
      }

      // Auto-generate notes based on document type
      if (expiration.documentType) {
        setCustomNotes(`Reminder to renew ${expiration.documentType}. Don't forget to check requirements and start the renewal process early.`)
      }
    }
  }, [expiration])

  if (!expiration) return null

  const finalDate = customDate ? parseISO(customDate) : expiration.expirationDate
  const daysUntilExpiration = differenceInDays(finalDate, new Date())
  const isUrgent = daysUntilExpiration <= 30
  const primaryReminderDate = subDays(finalDate, reminderDays)

  // Calculate multiple reminder dates
  const reminderDates = multipleReminders ? [
    { label: 'First Alert', date: subDays(finalDate, reminderDays), priority: 'medium' },
    { label: 'Second Alert', date: subDays(finalDate, Math.floor(reminderDays / 2)), priority: 'medium' },
    { label: 'Final Alert', date: subDays(finalDate, 7), priority: 'high' },
    { label: 'Expiration Day', date: finalDate, priority: 'high' }
  ] : [
    { label: 'Reminder', date: primaryReminderDate, priority: priority }
  ]

  const handleConfirm = async () => {
    // Create main task for the primary reminder
    await addTask({
      title: `Renew: ${expiration.documentName} - ${format(finalDate, 'MMM dd, yyyy')}`,
      priority: priority,
      dueDate: format(primaryReminderDate, 'yyyy-MM-dd'),
      completed: false
    } as any)

    // If multiple reminders enabled, create additional tasks
    if (multipleReminders) {
      for (let i = 1; i < reminderDates.length; i++) {
        const reminder = reminderDates[i]
        await addTask({
          title: `[${reminder.label}] Renew: ${expiration.documentName} - ${format(finalDate, 'MMM dd, yyyy')}`,
          priority: reminder.priority as 'high' | 'medium' | 'low',
          dueDate: format(reminder.date, 'yyyy-MM-dd'),
          completed: false
        } as any)
      }
    }

    // Save to expiration alerts in Supabase
    const supabase = createClientComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const alertData = {
      documentName: expiration.documentName,
      expirationDate: finalDate.toISOString(),
      reminderDate: primaryReminderDate.toISOString(),
      documentType: expiration.documentType,
      domain: expiration.domain,
      isActive: true,
      priority,
      multipleReminders,
      reminderDays,
      customNotes,
      enableEmail,
      enablePush,
      createdAt: new Date().toISOString()
    }
    
    if (user) {
      // Save to Supabase as a domain entry
      await supabase
        .from('domain_entries')
        .insert({
          user_id: user.id,
          domain: 'expiration_alerts',
          title: `${expiration.documentName} - Expiring ${format(finalDate, 'MMM dd, yyyy')}`,
          description: customNotes,
          metadata: alertData
        })
    } else {
      // Fallback to IndexedDB for unauthenticated users
      const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
      const stored = await idbGet<any[]>('expirationAlerts')
      const expirationAlerts = stored || []
      expirationAlerts.push({
        id: Date.now().toString(),
        ...alertData
      })
      await idbSet('expirationAlerts', expirationAlerts)
    }
    
    // Dispatch event for Command Center to update
    window.dispatchEvent(new Event('expiration-alerts-updated'))

    onConfirm(true, finalDate)
    onClose()
  }

  const handleSkip = () => {
    onConfirm(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
            Advanced Expiration Tracking
          </DialogTitle>
          <DialogDescription>
            Configure intelligent reminders and tracking for your document expiration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Document Info Alert */}
          <Alert className={cn(
            "border-2",
            isUrgent 
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
              : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
          )}>
            <AlertTriangle className={`h-5 w-5 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
            <AlertDescription className="ml-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">{expiration.documentName}</p>
                  <Badge variant={isUrgent ? 'destructive' : 'default'}>
                    {isUrgent ? 'URGENT' : 'ACTIVE'}
                  </Badge>
                </div>
                {expiration.documentType && (
                  <p className="text-xs text-muted-foreground">
                    Type: <span className="font-medium">{expiration.documentType}</span>
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-semibold ml-2">{format(finalDate, 'MMMM dd, yyyy')}</span>
                  </div>
                  <div className={`font-bold ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`}>
                    {daysUntilExpiration > 0 
                      ? `${daysUntilExpiration} days remaining`
                      : daysUntilExpiration === 0
                        ? 'Expires TODAY!'
                        : `EXPIRED ${Math.abs(daysUntilExpiration)} days ago`
                    }
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Expiration Date Adjustment */}
          <div className="space-y-2">
            <Label htmlFor="expiration-date" className="text-base font-semibold">
              Expiration Date
            </Label>
            <Input
              id="expiration-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Adjust if OCR detected the wrong date
            </p>
          </div>

          {/* Reminder Timing - Quick Presets */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              <Bell className="h-4 w-4 inline mr-2" />
              When to remind you
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {REMINDER_PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  variant={reminderDays === preset.days ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center gap-1 h-auto py-3",
                    preset.recommended && reminderDays === preset.days && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setReminderDays(preset.days)}
                >
                  <preset.icon className="h-4 w-4" />
                  <span className="text-xs text-center leading-tight">{preset.label}</span>
                  {preset.recommended && reminderDays === preset.days && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">Recommended</Badge>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Custom Days Input */}
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-days" className="text-sm">Custom:</Label>
              <Input
                id="custom-days"
                type="number"
                min="1"
                max="365"
                value={reminderDays}
                onChange={(e) => setReminderDays(parseInt(e.target.value) || 30)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">days before</span>
            </div>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Priority Level</Label>
            <RadioGroup value={priority} onValueChange={(value: any) => setPriority(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="priority-high" />
                <Label htmlFor="priority-high" className="cursor-pointer font-normal">
                  <span className="font-semibold text-red-600">High</span> - Critical, needs immediate attention
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="priority-medium" />
                <Label htmlFor="priority-medium" className="cursor-pointer font-normal">
                  <span className="font-semibold text-yellow-600">Medium</span> - Important, plan ahead
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="priority-low" />
                <Label htmlFor="priority-low" className="cursor-pointer font-normal">
                  <span className="font-semibold text-blue-600">Low</span> - Track but not urgent
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Multiple Reminders */}
          <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiple-reminders"
                checked={multipleReminders}
                onCheckedChange={(checked) => setMultipleReminders(checked as boolean)}
              />
              <Label htmlFor="multiple-reminders" className="cursor-pointer font-semibold">
                Enable Multiple Reminders
              </Label>
              <Badge variant="secondary" className="ml-2">Advanced</Badge>
            </div>
            {multipleReminders && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">You'll receive alerts on these dates:</p>
                <div className="space-y-1">
                  {reminderDates.map((reminder, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded">
                      <span className="font-medium">{reminder.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{format(reminder.date, 'MMM dd, yyyy')}</span>
                        <Badge variant={reminder.priority === 'high' ? 'destructive' : 'default'} className="text-xs">
                          {reminder.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Notes */}
          <div className="space-y-2">
            <Label htmlFor="custom-notes" className="text-base font-semibold">
              Custom Notes (Optional)
            </Label>
            <Textarea
              id="custom-notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Add any notes about renewal process, requirements, or important details..."
              className="min-h-[80px]"
            />
          </div>

          {/* Notification Methods */}
          <div className="space-y-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
            <Label className="text-base font-semibold">Notification Methods</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-push"
                  checked={enablePush}
                  onCheckedChange={(checked) => setEnablePush(checked as boolean)}
                />
                <Smartphone className="h-4 w-4 text-blue-600" />
                <Label htmlFor="enable-push" className="cursor-pointer font-normal">
                  Push Notifications (In-app alerts)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-email"
                  checked={enableEmail}
                  onCheckedChange={(checked) => setEnableEmail(checked as boolean)}
                />
                <Mail className="h-4 w-4 text-green-600" />
                <Label htmlFor="enable-email" className="cursor-pointer font-normal">
                  Email Reminders
                </Label>
                <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
              </div>
            </div>
          </div>

          {/* Summary */}
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="ml-2">
              <p className="font-semibold text-sm mb-2">✨ What will happen:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• {multipleReminders ? `${reminderDates.length} tasks` : '1 task'} created: "Renew: {expiration.documentName}"</li>
                <li>• First alert on <span className="font-semibold">{format(primaryReminderDate, 'MMM dd, yyyy')}</span></li>
                {multipleReminders && <li>• Follow-up reminders leading to expiration date</li>}
                <li>• Alerts appear in Command Center with <span className="font-semibold uppercase">{priority}</span> priority</li>
                <li>• {enablePush ? '✓' : '✗'} Push notifications {enableEmail ? '& Email reminders' : ''}</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip} className="gap-2">
            <X className="h-4 w-4" />
            Skip Tracking
          </Button>
          <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Check className="h-4 w-4" />
            Track with {multipleReminders ? `${reminderDates.length} Reminders` : 'Smart Alerts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to get upcoming expiration alerts
export function useExpirationAlerts() {
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    const loadAlerts = async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      let alerts: any[] = []
      
      if (user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('domain_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('domain', 'expiration_alerts')
          .order('created_at', { ascending: false })
        
        if (!error && data) {
          alerts = data.map((entry: any) => ({
            id: entry.id,
            ...entry.metadata,
            createdAt: entry.created_at
          }))
        }
      } else {
        // Fallback to IndexedDB for unauthenticated users
        const { idbGet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<any[]>('expirationAlerts')
        alerts = stored || []
      }
      
      const now = new Date()
      
      // Filter to active alerts where reminder date is within alert window
      const activeAlerts = alerts.filter((alert: any) => {
        if (!alert.isActive) return false
        const reminderDate = new Date(alert.reminderDate)
        const expirationDate = new Date(alert.expirationDate)
        const daysUntilReminder = differenceInDays(reminderDate, now)
        const daysUntilExpiration = differenceInDays(expirationDate, now)
        
        // Show if reminder date has passed OR if expiration is within reminder window
        return daysUntilReminder <= 0 || daysUntilExpiration <= (alert.reminderDays || 30)
      })

      setAlerts(activeAlerts)
    }

    loadAlerts()
    
    // Listen for updates
    const handleUpdate = () => loadAlerts()
    window.addEventListener('expiration-alerts-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('expiration-alerts-updated', handleUpdate)
    }
  }, [])

  return alerts
}
