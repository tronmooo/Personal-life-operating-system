'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { AlertCircle, DollarSign, Heart, Shield, Calendar, ArrowRight } from 'lucide-react'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import Link from 'next/link'

interface AlertsDialogProps {
  open: boolean
  onClose: () => void
}

interface Alert {
  id: string
  type: 'bill' | 'health' | 'insurance' | 'appointment' | 'task'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  dueDate?: string
  actionUrl: string
  icon: any
  color: string
}

export function AlertsDialog({ open, onClose }: AlertsDialogProps) {
  const { data, bills, tasks, events } = useData()

  const alerts = useMemo(() => {
    const alertsList: Alert[] = []
    const today = new Date()

    // Bill alerts
    bills.forEach(bill => {
      if (bill.dueDate && bill.status !== 'paid') {
        const dueDate = parseISO(bill.dueDate)
        const daysUntilDue = differenceInDays(dueDate, today)
        
        if (daysUntilDue <= 7) {
          alertsList.push({
            id: `bill-${bill.id}`,
            type: 'bill',
            severity: daysUntilDue <= 2 ? 'high' : daysUntilDue <= 5 ? 'medium' : 'low',
            title: `Bill Due: ${bill.title}`,
            description: `Due ${format(dueDate, 'MMM d, yyyy')} (${daysUntilDue} days) - $${bill.amount}`,
            dueDate: bill.dueDate,
            actionUrl: '/domains/financial',
            icon: DollarSign,
            color: 'text-red-500',
          })
        }
      }
    })

    // Task alerts (overdue)
    tasks.forEach(task => {
      if (task.dueDate && !task.completed) {
        const dueDate = parseISO(task.dueDate)
        const daysOverdue = differenceInDays(today, dueDate)
        
        if (daysOverdue >= 0) {
          alertsList.push({
            id: `task-${task.id}`,
            type: 'task',
            severity: daysOverdue > 3 ? 'high' : 'medium',
            title: `Overdue Task: ${task.title}`,
            description: daysOverdue === 0 ? 'Due today' : `${daysOverdue} days overdue`,
            dueDate: task.dueDate,
            actionUrl: '/my-dashboard',
            icon: AlertCircle,
            color: 'text-orange-500',
          })
        }
      }
    })

    // Appointment alerts (upcoming)
    events.forEach(event => {
      if (event.date) {
        const eventDate = parseISO(event.date)
        const daysUntil = differenceInDays(eventDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 3) {
          alertsList.push({
            id: `event-${event.id}`,
            type: 'appointment',
            severity: daysUntil === 0 ? 'high' : 'medium',
            title: `Upcoming: ${event.title}`,
            description: daysUntil === 0 
              ? `Today${event.type ? ' at ' + event.type : ''}` 
              : `In ${daysUntil} day${daysUntil > 1 ? 's' : ''}`,
            dueDate: event.date,
            actionUrl: '/domains/schedule',
            icon: Calendar,
            color: 'text-blue-500',
          })
        }
      }
    })

    // Health alerts (check-ups, prescriptions)
    const healthData = data.health || []
    healthData.forEach((item, index) => {
      if (item.metadata?.nextCheckup && typeof item.metadata.nextCheckup === 'string') {
        const checkupDate = parseISO(item.metadata.nextCheckup as string)
        const daysUntil = differenceInDays(checkupDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 30) {
          alertsList.push({
            id: `health-${index}`,
            type: 'health',
            severity: daysUntil <= 7 ? 'high' : 'medium',
            title: `Health Check-up Due`,
            description: `${item.title || 'Check-up'} - ${format(checkupDate, 'MMM d, yyyy')}`,
            dueDate: item.metadata.nextCheckup as string,
            actionUrl: '/domains/health',
            icon: Heart,
            color: 'text-red-400',
          })
        }
      }
    })

    // Insurance alerts (renewal, expiration)
    const insuranceData = data.insurance || []
    insuranceData.forEach((item, index) => {
      if (item.metadata?.renewalDate && typeof item.metadata.renewalDate === 'string') {
        const renewalDate = parseISO(item.metadata.renewalDate as string)
        const daysUntil = differenceInDays(renewalDate, today)
        
        if (daysUntil >= 0 && daysUntil <= 60) {
          alertsList.push({
            id: `insurance-${index}`,
            type: 'insurance',
            severity: daysUntil <= 30 ? 'high' : 'medium',
            title: `Insurance Renewal`,
            description: `${item.title || 'Policy'} renews ${format(renewalDate, 'MMM d, yyyy')}`,
            dueDate: item.metadata.renewalDate as string,
            actionUrl: '/domains/insurance',
            icon: Shield,
            color: 'text-purple-500',
          })
        }
      }
    })

    // Sort by severity and date
    return alertsList.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 }
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })
  }, [data, bills, tasks, events])

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>
      case 'medium':
        return <Badge variant="default" className="bg-orange-500">Medium</Badge>
      case 'low':
        return <Badge variant="secondary">Low</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            All Alerts ({alerts.length})
          </DialogTitle>
          <DialogDescription>
            Here are all your current alerts and notifications
          </DialogDescription>
        </DialogHeader>

        {alerts.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No alerts at this time</p>
            <p className="text-sm">You're all caught up! 🎉</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon
                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${alert.color}`} />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        {getSeverityBadge(alert.severity)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>
                    <Link href={alert.actionUrl} onClick={onClose}>
                      <Button size="sm" variant="ghost">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

