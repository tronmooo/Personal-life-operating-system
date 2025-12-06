'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, AlertTriangle, Clock, CheckCircle, CreditCard } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { BillsManager } from './bills-manager'

export function BillsDue() {
  const { bills } = useData()
  const [showAll, setShowAll] = useState(false)

  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

  const upcomingBills = bills
    .filter(bill => {
      if (bill.status === 'paid') return false
      const dueDate = new Date(bill.dueDate)
      return dueDate >= today && dueDate <= thirtyDaysFromNow
    })
    .map(bill => {
      const dueDate = new Date(bill.dueDate)
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { ...bill, daysUntil, dueDateObj: dueDate }
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const overdueBills = bills
    .filter(bill => {
      if (bill.status === 'paid') return false
      const dueDate = new Date(bill.dueDate)
      return dueDate < today
    })
    .map(bill => {
      const dueDate = new Date(bill.dueDate)
      const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      return { ...bill, daysOverdue, dueDateObj: dueDate }
    })

  const allBills = [...overdueBills.map(b => ({ ...b, isOverdue: true })), ...upcomingBills.map(b => ({ ...b, isOverdue: false }))]
  const displayBills = showAll ? allBills : allBills.slice(0, 4)

  const totalDue = allBills.reduce((sum, bill) => sum + bill.amount, 0)

  const getUrgencyColor = (bill: typeof displayBills[0]) => {
    if (bill.isOverdue) return 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800'
    if ('daysUntil' in bill && bill.daysUntil <= 3) return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
    if ('daysUntil' in bill && bill.daysUntil <= 7) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
    return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
  }

  const getUrgencyBadge = (bill: typeof displayBills[0]) => {
    if (bill.isOverdue) return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Overdue</Badge>
    if ('daysUntil' in bill && bill.daysUntil <= 3) return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Urgent</Badge>
    if ('daysUntil' in bill && bill.daysUntil <= 7) return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Soon</Badge>
    return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs"><Clock className="h-3 w-3 mr-1" /> Upcoming</Badge>
  }

  const [billsOpen, setBillsOpen] = useState(false)

  return (
    <>
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setBillsOpen(true)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Bills Due
          </CardTitle>
          <Badge variant={allBills.length > 0 ? "destructive" : "secondary"} className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {allBills.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {allBills.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-20 text-green-500" />
            <p className="text-sm">All bills are paid!</p>
            <p className="text-xs mt-1">No bills due in the next 30 days</p>
          </div>
        ) : (
          <>
            {/* Total Due Summary */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Due (30 days)</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Bills</p>
                  <p className="text-lg font-semibold">{allBills.length}</p>
                </div>
              </div>
            </div>

            {/* Bills List */}
            {displayBills.map((bill) => (
              <div 
                key={bill.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${getUrgencyColor(bill)}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CreditCard className="h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bill.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getUrgencyBadge(bill)}
                      <span className="text-xs text-muted-foreground">
                        {bill.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      {formatCurrency(bill.amount)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  {bill.isOverdue ? (
                    <>
                      <p className="text-sm font-bold text-red-600">
                        {bill.isOverdue ? Math.abs((bill as any).daysUntil) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground">days late</p>
                    </>
                  ) : 'daysUntil' in bill ? (
                    <>
                      <p className={`text-sm font-bold ${bill.daysUntil <= 3 ? 'text-red-600' : bill.daysUntil <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
                        {bill.daysUntil}
                      </p>
                      <p className="text-xs text-muted-foreground">days</p>
                    </>
                  ) : null}
                </div>
              </div>
            ))}

            {!showAll && allBills.length > 4 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAll(true)
                }}
              >
                View All {allBills.length} Bills
              </Button>
            )}

            {showAll && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAll(false)
                }}
              >
                Show Less
              </Button>
            )}

            <div className="pt-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setBillsOpen(true)
                }}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Manage All Bills
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
    <BillsManager open={billsOpen} onClose={() => setBillsOpen(false)} />
    </>
  )
}

