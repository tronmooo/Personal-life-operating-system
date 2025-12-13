'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, AlertCircle, RefreshCw } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useMemo } from 'react'
import { differenceInDays, parseISO, format } from 'date-fns'

interface BillItem {
  title: string
  amount: number
  dueDate: string
  category: string
  isRecurring: boolean
  source: 'bills' | 'finance' | 'subscriptions' | 'housing'
  daysUntilDue?: number
  isUrgent?: boolean
}

export function UpcomingBillsCard() {
  const { bills, data } = useData() // Get both bills AND domain data

  const allBills = useMemo(() => {
    const billsList: BillItem[] = []

    // 1. Get bills from bills table
    if (bills && bills.length > 0) {
      bills.forEach(bill => {
        if (bill.dueDate) {
          billsList.push({
            title: bill.title,
            amount: bill.amount,
            dueDate: bill.dueDate,
            category: bill.category,
            isRecurring: bill.recurring,
            source: 'bills'
          })
        }
      })
    }

    // 2. Get bills from financial domain (expenses category)
    const financialEntries = data.financial || []
    financialEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      const itemType = meta.itemType || ''
      const type = meta.type || ''
      
      // Check if it's a bill type (prioritize itemType === 'bill')
      if (itemType === 'bill' || type === 'bill' || type === 'expense' || meta.category === 'Bills' || meta.category === 'bill') {
        const dueDate = meta.dueDate || meta.nextDueDate || meta.date
        if (dueDate) {
          billsList.push({
            title: entry.title || meta.name || meta.provider || 'Financial Expense',
            amount: parseFloat(String(meta.amount || entry.amount || meta.value || 0)),
            dueDate: dueDate,
            category: meta.category || 'Expense',
            isRecurring: Boolean(meta.recurring || meta.frequency),
            source: 'finance'
          })
        }
      }
    })

    // 5. Get bills from housing domain (property-related bills)
    const housingEntries = data.home || []
    console.log('🏠 [UpcomingBills] Home domain entries:', housingEntries.length)
    housingEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      const itemType = (meta.itemType || '').toLowerCase()
      
      console.log('🏠 [UpcomingBills] Checking home entry:', {
        title: entry.title,
        itemType: meta.itemType,
        homeId: meta.homeId,
        dueDate: meta.dueDate,
        amount: meta.amount
      })
      
      // Include bills from home domain - check itemType is 'bill' and has homeId
      if (itemType === 'bill' && meta.homeId) {
        const dueDate = meta.dueDate || meta.nextDueDate || meta.paymentDate || meta.date
        console.log('🏠 [UpcomingBills] Found home bill:', entry.title, 'dueDate:', dueDate)
        if (dueDate) {
          billsList.push({
            title: meta.billName || entry.title || meta.name || 'Housing Bill',
            amount: parseFloat(String(meta.amount || entry.amount || meta.value || 0)),
            dueDate: dueDate,
            category: meta.category || 'Housing',
            isRecurring: Boolean(meta.recurring || meta.frequency),
            source: 'housing'
          })
          console.log('✅ [UpcomingBills] Added home bill:', meta.billName || entry.title)
        }
      }
    })

    // 3. Get subscriptions from digital domain
    const digitalEntries = data.digital || []
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upcoming-bills-card.tsx:digitalEntries',message:'Digital entries for bills',data:{count:digitalEntries.length,entries:digitalEntries.slice(0,5).map((e:any)=>({id:e.id,title:e.title,type:e.metadata?.type,renewalDate:e.metadata?.renewalDate,monthlyCost:e.metadata?.monthlyCost,cost:e.metadata?.cost}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    digitalEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      if (meta.type === 'subscription' || meta.itemType === 'subscription') {
        // Calculate next billing date
        const billingDate = meta.nextBilling || meta.renewalDate || meta.billingDate || meta.nextDueDate
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1f84030-0acf-4814-b44c-5f5df66c7ed2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'upcoming-bills-card.tsx:subCheck',message:'Checking subscription for bills',data:{title:entry.title,billingDate,hasBillingDate:!!billingDate,meta:{type:meta.type,renewalDate:meta.renewalDate,nextBilling:meta.nextBilling,cost:meta.cost,monthlyCost:meta.monthlyCost,amount:meta.amount}},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion
        if (billingDate) {
          billsList.push({
            title: entry.title || meta.name || meta.service || 'Subscription',
            // 🔧 FIX: Prioritize monthlyCost (used by SubscriptionsTab) first
            amount: parseFloat(String(meta.monthlyCost || meta.cost || meta.price || meta.amount || meta.monthlyFee || 0)),
            dueDate: billingDate,
            category: 'Subscription',
            isRecurring: true,
            source: 'subscriptions'
          })
        }
      }
    })

    // 4. Get insurance from insurance domain
    const insuranceEntries = data.insurance || []
    insuranceEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      const renewalDate = meta.renewalDate || meta.nextPayment || meta.paymentDate
      if (renewalDate) {
        billsList.push({
          title: entry.title || meta.policyName || 'Insurance Policy',
          amount: parseFloat(String(meta.premium || meta.amount || meta.monthlyPremium || 0)),
          dueDate: renewalDate,
          category: 'Insurance',
          isRecurring: true,
          source: 'bills'
        })
      }
    })

    return billsList
  }, [bills, data])

  const upcomingBills = useMemo(() => {
    if (allBills.length === 0) return []

    const now = new Date()
    
    // Helper function to parse due date (handles both ISO dates and day-of-month)
    const parseDueDate = (dueDateStr: string): Date | null => {
      try {
        // First try parsing as ISO date
        let dueDate = parseISO(dueDateStr)
        if (!isNaN(dueDate.getTime())) {
          return dueDate
        }
        
        // If not ISO, try parsing as day-of-month (e.g., "15" or "15th")
        const dayNum = parseInt(dueDateStr.replace(/\D/g, ''))
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          dueDate = new Date(currentYear, currentMonth, dayNum)
          
          // If the due date has already passed this month, use next month
          if (dueDate < now) {
            dueDate = new Date(currentYear, currentMonth + 1, dayNum)
          }
          
          return dueDate
        }
        
        return null
      } catch {
        return null
      }
    }
    
    return allBills
      .filter(bill => {
        const dueDate = parseDueDate(bill.dueDate)
        if (!dueDate) return false
        const daysUntilDue = differenceInDays(dueDate, now)
        return daysUntilDue >= 0 && daysUntilDue <= 30 // Next 30 days
      })
      .map(bill => {
        const dueDate = parseDueDate(bill.dueDate)!
        const daysUntilDue = differenceInDays(dueDate, now)
        return {
          ...bill,
          dueDate: dueDate.toISOString(), // Normalize to ISO date
          daysUntilDue,
          isUrgent: daysUntilDue <= 7
        }
      })
      .sort((a, b) => a.daysUntilDue! - b.daysUntilDue!)
      .slice(0, 6) // Show top 6
  }, [allBills])

  const totalAmount = useMemo(() => {
    return upcomingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  }, [upcomingBills])

  const getSourceIcon = (source: string) => {
    if (source === 'subscriptions') return '🔄'
    if (source === 'finance') return '💰'
    if (source === 'housing') return '🏠'
    return '💳'
  }

  const getSourceLabel = (source: string) => {
    if (source === 'subscriptions') return 'Sub'
    if (source === 'finance') return 'Exp'
    if (source === 'housing') return 'Home'
    return 'Bill'
  }

  return (
    <Card className="border-2 border-emerald-200 dark:border-emerald-900 hover:shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span className="text-lg">All Bills & Expenses</span>
          </div>
          <Badge variant="secondary" className="text-lg font-bold">
            ${totalAmount.toFixed(0)}
          </Badge>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          {allBills.length} total • Next 30 days
        </p>
      </CardHeader>
      <CardContent>
        {upcomingBills.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm text-gray-500 mb-1">No bills due in next 30 days</p>
            <p className="text-xs text-gray-400">
              Add bills, subscriptions, or expenses to track
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingBills.map((bill, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  bill.isUrgent
                    ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {bill.isUrgent && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  <span className="text-lg flex-shrink-0">{getSourceIcon(bill.source)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{bill.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500">
                        Due {format(parseISO(bill.dueDate), 'MMM d')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {bill.category}
                      </Badge>
                      {bill.isRecurring && (
                        <span title="Recurring">
                          <RefreshCw className="w-3 h-3 text-blue-500" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                  <div className="text-sm font-bold">${bill.amount.toFixed(0)}</div>
                  <Badge
                    variant={bill.isUrgent ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {bill.daysUntilDue}d
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
