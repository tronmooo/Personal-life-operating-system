'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { 
  AlertCircle, DollarSign, Heart, Shield, Calendar, ArrowRight, 
  Wrench, FileText, Bell, TrendingUp, Home, Car, Zap
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { useExpirationAlerts } from '../expiration-tracker'
import { useTrackedAssets } from '../asset-lifespan-tracker'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { idbGet, idbSet } from '@/lib/utils/idb-cache'

interface CategorizedAlertsDialogProps {
  open: boolean
  onClose: () => void
}

export function CategorizedAlertsDialog({ open, onClose }: CategorizedAlertsDialogProps) {
  const { data, bills, tasks, events } = useData()
  const expirationAlerts = useExpirationAlerts()
  const trackedAssets = useTrackedAssets()
  const [activeTab, setActiveTab] = useState('all')
  const [checkedAlerts, setCheckedAlerts] = useState<Set<string>>(new Set())

  // Load checked alerts from Supabase (with IndexedDB fallback)
  useEffect(() => {
    const loadCheckedAlerts = async () => {
      
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Load from Supabase
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single()

        if (userSettings?.settings?.dismissedAlerts && Array.isArray(userSettings.settings.dismissedAlerts)) {
          setCheckedAlerts(new Set(userSettings.settings.dismissedAlerts))
        }
      } else {
        // Fallback to IndexedDB
        const stored = await idbGet('checked-alerts')
        if (stored && Array.isArray(stored)) {
          setCheckedAlerts(new Set(stored))
        }
      }
    }
    loadCheckedAlerts()
  }, [])

  // Handle checking/unchecking alerts
  const toggleAlertChecked = async (alertId: string) => {
    setCheckedAlerts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(alertId)) {
        newSet.delete(alertId)
      } else {
        newSet.add(alertId)
      }
      
      // Persist to Supabase (with IndexedDB fallback)
      const saveCheckedAlerts = async () => {
        
        const supabase = createClientComponentClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Save to Supabase user_settings
          await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              settings: {
                dismissedAlerts: Array.from(newSet)
              }
            })
        } else {
          // Fallback to IndexedDB
          idbSet('checked-alerts', Array.from(newSet))
        }
      }
      saveCheckedAlerts()
      
      return newSet
    })
  }

  // Organize alerts by category
  const alertsByCategory = useMemo(() => {
    const today = new Date()
    const categories = {
      bills: [] as any[],
      tasks: [] as any[],
      events: [] as any[],
      health: [] as any[],
      insurance: [] as any[],
      home: [] as any[],
      documents: [] as any[],
      maintenance: [] as any[],
      replacement: [] as any[],
    }

    // Bills alerts
    bills.forEach(bill => {
      if (bill.dueDate && bill.status !== 'paid') {
        const dueDate = parseISO(bill.dueDate)
        const daysUntilDue = differenceInDays(dueDate, today)
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          categories.bills.push({
            id: `bill-${bill.id}`,
            severity: daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low',
            title: bill.title,
            description: `Due ${format(dueDate, 'MMM d, yyyy')} • $${bill.amount}`,
            daysUntil: daysUntilDue,
            actionUrl: '/domains/financial',
            icon: DollarSign,
            color: 'text-green-600',
          })
        }
      }
    })

    // Tasks are intentionally NOT surfaced as alerts here per product spec
    categories.tasks = []

    // Events/Appointments alerts
    events.forEach(event => {
      if (event.date) {
        const eventDate = parseISO(event.date)
        const daysUntil = differenceInDays(eventDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 3) {
          categories.events.push({
            id: `event-${event.id}`,
            severity: daysUntil === 0 ? 'high' : 'medium',
            title: event.title,
            description: daysUntil === 0 ? 'Today' : `In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            daysUntil,
            actionUrl: '/domains/schedule',
            icon: Calendar,
            color: 'text-blue-600',
          })
        }
      }
    })

    // Health alerts
    const healthData = data.health || []
    healthData.forEach((item, index) => {
      if (item.metadata?.nextCheckup && typeof item.metadata.nextCheckup === 'string') {
        const checkupDate = parseISO(item.metadata.nextCheckup as string)
        const daysUntil = differenceInDays(checkupDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 30) {
          categories.health.push({
            id: `health-${index}`,
            severity: daysUntil <= 7 ? 'high' : 'medium',
            title: item.title || 'Health Check-up',
            description: `Due ${format(checkupDate, 'MMM d, yyyy')}`,
            daysUntil,
            actionUrl: '/domains/health',
            icon: Heart,
            color: 'text-red-600',
          })
        }
      }
    })

    // Insurance alerts
    const insuranceData = data.insurance || []
    insuranceData.forEach((item, index) => {
      if (item.metadata?.renewalDate && typeof item.metadata.renewalDate === 'string') {
        const renewalDate = parseISO(item.metadata.renewalDate as string)
        const daysUntil = differenceInDays(renewalDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 60) {
          categories.insurance.push({
            id: `insurance-${index}`,
            severity: daysUntil <= 30 ? 'high' : 'medium',
            title: item.title || 'Insurance Policy',
            description: `Renews ${format(renewalDate, 'MMM d, yyyy')}`,
            daysUntil,
            actionUrl: '/domains/insurance',
            icon: Shield,
            color: 'text-purple-600',
          })
        }
      }
    })

    // Home maintenance alerts
    const homeItems = data.home || []
    homeItems.forEach((item, index) => {
      // Maintenance tasks
      if (item.metadata?.itemType === 'Maintenance Task' && item.metadata?.dueDate && typeof item.metadata.dueDate === 'string') {
        const status = item.metadata?.status
        if (status !== 'Completed' && status !== 'Cancelled') {
          const dueDate = parseISO(item.metadata.dueDate as string)
          const daysUntil = differenceInDays(dueDate, today)
          
          if (daysUntil >= -7 && daysUntil <= 30) {
            categories.home.push({
              id: `home-task-${index}`,
              severity: daysUntil < 0 ? 'high' : daysUntil <= 3 ? 'high' : 'medium',
              title: item.title,
              description: daysUntil < 0 
                ? `Overdue by ${Math.abs(daysUntil)} days`
                : daysUntil === 0
                ? 'Due today'
                : `Due in ${daysUntil} days`,
              daysUntil,
              actionUrl: '/domains/home',
              icon: Home,
              color: 'text-orange-600',
            })
          }
        }
      }
      
      // Warranty expirations
      if (item.metadata?.itemType === 'Asset/Warranty' && item.metadata?.warrantyExpires && typeof item.metadata.warrantyExpires === 'string') {
        const expiryDate = parseISO(item.metadata.warrantyExpires as string)
        const daysUntil = differenceInDays(expiryDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 90) {
          categories.home.push({
            id: `home-warranty-${index}`,
            severity: daysUntil <= 30 ? 'high' : 'medium',
            title: `${item.title} Warranty`,
            description: `Expires ${format(expiryDate, 'MMM d, yyyy')}`,
            daysUntil,
            actionUrl: '/domains/home',
            icon: Shield,
            color: 'text-amber-600',
          })
        }
      }
      
      // Project deadlines
      if (item.metadata?.itemType === 'Project' && item.metadata?.targetDate && typeof item.metadata.targetDate === 'string') {
        const status = item.metadata?.projectStatus
        if (status === 'In Progress' || status === 'Planning') {
          const targetDate = parseISO(item.metadata.targetDate as string)
          const daysUntil = differenceInDays(targetDate, today)
          
          if (daysUntil >= -7 && daysUntil <= 14) {
            categories.home.push({
              id: `home-project-${index}`,
              severity: daysUntil < 0 ? 'high' : daysUntil <= 7 ? 'medium' : 'low',
              title: `Project: ${item.title}`,
              description: daysUntil < 0
                ? `${Math.abs(daysUntil)} days overdue`
                : `Target in ${daysUntil} days`,
              daysUntil,
              actionUrl: '/domains/home',
              icon: TrendingUp,
              color: 'text-teal-600',
            })
          }
        }
      }
    })

    // Document expiration alerts
    expirationAlerts.forEach((alert: any) => {
      const expirationDate = new Date(alert.expirationDate)
      const daysUntil = differenceInDays(expirationDate, today)
      
      categories.documents.push({
        id: alert.id,
        severity: daysUntil <= 14 ? 'high' : 'medium',
        title: alert.documentName,
        description: `Expires ${format(expirationDate, 'MMM d, yyyy')}`,
        daysUntil,
        actionUrl: `/domains/${alert.domain || 'insurance'}`,
        icon: FileText,
        color: 'text-indigo-600',
      })
    })

    // Asset maintenance alerts
    trackedAssets.forEach((asset: any) => {
      if (!asset.purchaseDate) return
      
      const purchase = new Date(asset.purchaseDate)
      const ageInMonths = differenceInDays(today, purchase) / 30
      
      // Calculate next maintenance
      const lastMaintenance = asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate) : purchase
      const monthsSinceLastMaintenance = differenceInDays(today, lastMaintenance) / 30
      const maintenanceDue = monthsSinceLastMaintenance >= asset.maintenanceInterval
      
      if (maintenanceDue || monthsSinceLastMaintenance >= asset.maintenanceInterval - 1) {
        const nextMaintenanceDate = new Date(lastMaintenance)
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + asset.maintenanceInterval)
        const daysUntilMaintenance = differenceInDays(nextMaintenanceDate, today)
        
        categories.maintenance.push({
          id: `maintenance-${asset.id}`,
          severity: maintenanceDue ? 'high' : 'medium',
          title: asset.name,
          description: maintenanceDue 
            ? `Maintenance overdue by ${Math.abs(daysUntilMaintenance)} days`
            : `Maintenance due in ${daysUntilMaintenance} days`,
          daysUntil: daysUntilMaintenance,
          actionUrl: '/domains/appliances',
          icon: Wrench,
          color: 'text-yellow-600',
        })
      }

      // Replacement prediction alerts
      const lifespanProgress = (ageInMonths / asset.expectedLifespan) * 100
      const optimalStart = asset.expectedLifespan * 0.8
      const optimalEnd = asset.expectedLifespan * 0.95
      
      if (ageInMonths >= optimalStart && ageInMonths <= optimalEnd) {
        const endOfLife = new Date(purchase)
        endOfLife.setMonth(endOfLife.getMonth() + asset.expectedLifespan)
        const daysUntilEOL = differenceInDays(endOfLife, today)
        
        categories.replacement.push({
          id: `replacement-${asset.id}`,
          severity: lifespanProgress >= 90 ? 'high' : 'medium',
          title: asset.name,
          description: `Optimal replacement window • ${lifespanProgress.toFixed(0)}% of lifespan used`,
          daysUntil: daysUntilEOL,
          actionUrl: '/domains/appliances',
          icon: TrendingUp,
          color: 'text-orange-600',
        })
      } else if (lifespanProgress >= 95) {
        const endOfLife = new Date(purchase)
        endOfLife.setMonth(endOfLife.getMonth() + asset.expectedLifespan)
        const daysUntilEOL = differenceInDays(endOfLife, today)
        
        categories.replacement.push({
          id: `replacement-critical-${asset.id}`,
          severity: 'high',
          title: asset.name,
          description: `CRITICAL: End of life approaching • ${lifespanProgress.toFixed(0)}% of lifespan used`,
          daysUntil: daysUntilEOL,
          actionUrl: '/domains/appliances',
          icon: AlertCircle,
          color: 'text-red-600',
        })
      }
    })

    return categories
  }, [data, bills, tasks, events, expirationAlerts, trackedAssets])

  // Calculate totals
  const totals = {
    all: Object.values(alertsByCategory).reduce((sum, cat) => sum + cat.length, 0),
    bills: alertsByCategory.bills.length,
    tasks: alertsByCategory.tasks.length,
    events: alertsByCategory.events.length,
    health: alertsByCategory.health.length,
    insurance: alertsByCategory.insurance.length,
    home: alertsByCategory.home.length,
    documents: alertsByCategory.documents.length,
    maintenance: alertsByCategory.maintenance.length,
    replacement: alertsByCategory.replacement.length,
  }

  // Get all alerts for "All" tab
  const allAlerts = Object.values(alertsByCategory)
    .flat()
    .sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      if (severityOrder[a.severity as keyof typeof severityOrder] !== severityOrder[b.severity as keyof typeof severityOrder]) {
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
      }
      return a.daysUntil - b.daysUntil
    })

  const renderAlertsList = (alerts: any[]) => {
    if (alerts.length === 0) {
      return (
        <div className="py-12 text-center text-muted-foreground">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No alerts in this category</p>
          <p className="text-sm">You're all caught up! 🎉</p>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {alerts.map((alert) => {
          const Icon = alert.icon
          const isChecked = checkedAlerts.has(alert.id)
          return (
            <div
              key={alert.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border transition-all hover:shadow-md",
                isChecked && "opacity-50",
                alert.severity === 'high' ? 'bg-red-50 dark:bg-red-950/10 border-red-200' :
                alert.severity === 'medium' ? 'bg-orange-50 dark:bg-orange-950/10 border-orange-200' :
                'bg-blue-50 dark:bg-blue-950/10 border-blue-200'
              )}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => toggleAlertChecked(alert.id)}
                className="mt-1 flex-shrink-0"
              />
              <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", alert.color, isChecked && "opacity-50")} />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={cn("font-medium text-sm truncate", isChecked && "line-through")}>{alert.title}</h4>
                  <Badge variant={
                    alert.severity === 'high' ? 'destructive' :
                    alert.severity === 'medium' ? 'default' : 'secondary'
                  } className="shrink-0">
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
                <p className={cn("text-sm text-muted-foreground", isChecked && "line-through")}>
                  {alert.description}
                </p>
              </div>
              <Link href={alert.actionUrl} onClick={onClose}>
                <Button size="sm" variant="ghost" className="shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-6 w-6 text-yellow-500" />
            Alerts & Notifications
          </DialogTitle>
          <DialogDescription>
            All your alerts organized by category for easy management
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 lg:grid-cols-10 w-full gap-1">
            <TabsTrigger value="all" className="text-xs px-2">
              All ({totals.all})
            </TabsTrigger>
            <TabsTrigger value="bills" className="text-xs px-2">
              Bills ({totals.bills})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs px-2">
              Tasks ({totals.tasks})
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs px-2">
              Events ({totals.events})
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs px-2">
              Health ({totals.health})
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs px-2">
              Insurance ({totals.insurance})
            </TabsTrigger>
            <TabsTrigger value="home" className="text-xs px-2">
              Home ({totals.home})
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs px-2">
              Docs ({totals.documents})
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="text-xs px-2">
              Maint. ({totals.maintenance})
            </TabsTrigger>
            <TabsTrigger value="replacement" className="text-xs px-2">
              Replace ({totals.replacement})
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[500px] overflow-y-auto pr-2">
            <TabsContent value="all" className="mt-0">
              {renderAlertsList(allAlerts)}
            </TabsContent>

            <TabsContent value="bills" className="mt-0">
              {renderAlertsList(alertsByCategory.bills)}
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              {renderAlertsList(alertsByCategory.tasks)}
            </TabsContent>

            <TabsContent value="events" className="mt-0">
              {renderAlertsList(alertsByCategory.events)}
            </TabsContent>

            <TabsContent value="health" className="mt-0">
              {renderAlertsList(alertsByCategory.health)}
            </TabsContent>

            <TabsContent value="insurance" className="mt-0">
              {renderAlertsList(alertsByCategory.insurance)}
            </TabsContent>

            <TabsContent value="home" className="mt-0">
              {renderAlertsList(alertsByCategory.home)}
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              {renderAlertsList(alertsByCategory.documents)}
            </TabsContent>

            <TabsContent value="maintenance" className="mt-0">
              {renderAlertsList(alertsByCategory.maintenance)}
            </TabsContent>

            <TabsContent value="replacement" className="mt-0">
              {renderAlertsList(alertsByCategory.replacement)}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

