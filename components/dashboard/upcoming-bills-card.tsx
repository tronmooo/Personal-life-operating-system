'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useServiceProviders } from '@/lib/hooks/use-service-providers'
import { useMemo, useEffect, useState } from 'react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { CollapsibleDashboardCard } from './collapsible-dashboard-card'

interface BillItem {
  title: string
  amount: number
  dueDate: string
  category: string
  isRecurring: boolean
  source: 'bills' | 'finance' | 'subscriptions' | 'housing' | 'insurance' | 'vehicles' | 'pets' | 'education' | 'health'
  domain: string
  daysUntilDue?: number
  isUrgent?: boolean
}

export function UpcomingBillsCard() {
  const { bills, data, isLoaded } = useData()
  const { payments: servicePayments, providers: serviceProviders } = useServiceProviders()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showAllBills, setShowAllBills] = useState(false)

  const homeEntries = Array.isArray(data.home) ? data.home : []
  const homeEntriesLength = homeEntries.length

  // Listen for data update events to refresh the card
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('🔄 [UpcomingBills] Data update detected, refreshing...')
      setRefreshTrigger(prev => prev + 1)
    }

    window.addEventListener('data-updated', handleDataUpdate)
    window.addEventListener('home-data-updated', handleDataUpdate)
    window.addEventListener('domain-entry-created', handleDataUpdate)
    window.addEventListener('domain-entry-updated', handleDataUpdate)
    window.addEventListener('domain-entry-deleted', handleDataUpdate)

    return () => {
      window.removeEventListener('data-updated', handleDataUpdate)
      window.removeEventListener('home-data-updated', handleDataUpdate)
      window.removeEventListener('domain-entry-created', handleDataUpdate)
      window.removeEventListener('domain-entry-updated', handleDataUpdate)
      window.removeEventListener('domain-entry-deleted', handleDataUpdate)
    }
  }, [])

  const allBills = useMemo(() => {
    const billsList: BillItem[] = []

    const coerceDueDateString = (value: unknown): string => {
      if (value == null) return ''
      if (value instanceof Date) return value.toISOString()
      return String(value)
    }

    // 1. Get bills from bills table
    if (bills && bills.length > 0) {
      bills.forEach(bill => {
        if (bill.dueDate) {
          billsList.push({
            title: bill.title,
            amount: bill.amount,
            dueDate: coerceDueDateString(bill.dueDate),
            category: bill.category,
            isRecurring: bill.recurring,
            source: 'bills',
            domain: 'bills'
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
      
      if (itemType === 'bill' || type === 'bill' || type === 'expense' || meta.category === 'Bills' || meta.category === 'bill') {
        const dueDate = meta.dueDate || meta.nextDueDate || meta.date
        if (dueDate) {
          billsList.push({
            title: entry.title || meta.name || meta.provider || 'Financial Expense',
            amount: parseFloat(String(meta.amount || entry.amount || meta.value || 0)),
            dueDate: coerceDueDateString(dueDate),
            category: meta.category || 'Expense',
            isRecurring: Boolean(meta.recurring || meta.frequency),
            source: 'finance',
            domain: 'financial'
          })
        }
      }
    })

    // 3. Get bills from housing domain (property-related bills)
    homeEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      const itemType = (meta.itemType || '').toLowerCase()
      
      if (itemType === 'bill') {
        const dueDate = meta.dueDate || meta.nextDueDate || meta.paymentDate || meta.date
        
        if (dueDate || meta.frequency) {
          const categoryLabel = (meta.category || '').toLowerCase()
          const displayCategory = 
            categoryLabel === 'mortgage' ? 'Mortgage' :
            categoryLabel === 'utilities' ? 'Utilities' :
            categoryLabel === 'insurance' ? 'Insurance' :
            categoryLabel === 'tax' ? 'Tax' :
            categoryLabel === 'rent' ? 'Rent' :
            'Housing'
          
          billsList.push({
            title: meta.billName || entry.title || meta.name || 'Housing Bill',
            amount: parseFloat(String(meta.amount || entry.amount || meta.value || 0)),
            dueDate: coerceDueDateString(dueDate || new Date().toISOString().split('T')[0]),
            category: displayCategory,
            isRecurring: Boolean(meta.recurring || meta.frequency === 'monthly' || meta.frequency === 'quarterly' || meta.frequency === 'annually'),
            source: 'housing',
            domain: 'home'
          })
        }
      }
    })

    // 4. Get subscriptions from digital domain
    const digitalEntries = data.digital || []
    digitalEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      if (meta.type === 'subscription' || meta.itemType === 'subscription') {
        const billingDate = meta.nextBilling || meta.renewalDate || meta.billingDate || meta.nextDueDate
        if (billingDate) {
          billsList.push({
            title: entry.title || meta.name || meta.service || 'Subscription',
            amount: parseFloat(String(meta.monthlyCost || meta.cost || meta.price || meta.amount || meta.monthlyFee || 0)),
            dueDate: coerceDueDateString(billingDate),
            category: 'Subscription',
            isRecurring: true,
            source: 'subscriptions',
            domain: 'digital'
          })
        }
      }
    })

    // 5. Get insurance from insurance domain (premiums)
    const insuranceEntries = data.insurance || []
    insuranceEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      const renewalDate = meta.renewalDate || meta.nextPayment || meta.paymentDate || meta.premiumDueDate
      if (renewalDate) {
        billsList.push({
          title: entry.title || meta.policyName || 'Insurance Policy',
          amount: parseFloat(String(meta.premium || meta.amount || meta.monthlyPremium || 0)),
          dueDate: coerceDueDateString(renewalDate),
          category: 'Insurance',
          isRecurring: true,
          source: 'insurance',
          domain: 'insurance'
        })
      }
    })

    // 6. Get vehicle-related bills (registration, maintenance schedules)
    const vehicleEntries = data.vehicles || []
    vehicleEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      
      // Registration renewal
      if (meta.registrationExpiry || meta.registrationDue) {
        const regDate = meta.registrationExpiry || meta.registrationDue
        billsList.push({
          title: `${entry.title || meta.make + ' ' + meta.model || 'Vehicle'} - Registration`,
          amount: parseFloat(String(meta.registrationFee || meta.registrationCost || 0)),
          dueDate: coerceDueDateString(regDate),
          category: 'Vehicle Registration',
          isRecurring: true,
          source: 'vehicles',
          domain: 'vehicles'
        })
      }
      
      // Insurance payment
      if (meta.insuranceDue || meta.insuranceRenewal) {
        const insDate = meta.insuranceDue || meta.insuranceRenewal
        billsList.push({
          title: `${entry.title || meta.make + ' ' + meta.model || 'Vehicle'} - Insurance`,
          amount: parseFloat(String(meta.insurancePremium || meta.insuranceCost || 0)),
          dueDate: coerceDueDateString(insDate),
          category: 'Vehicle Insurance',
          isRecurring: true,
          source: 'vehicles',
          domain: 'vehicles'
        })
      }

      // NOTE: Vehicle maintenance reminders (oil change due, repair due, etc.) are NOT bills.
      // They are shown in the Alerts section instead, since no payment has been made yet.
      // Only actual paid expenses should appear in bills/expenses.
    })

    // 7. Get pet-related bills (vet visits, medications, insurance)
    const petEntries = data.pets || []
    petEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      
      // Vet appointments
      if (meta.nextVetVisit || meta.vetAppointment) {
        const vetDate = meta.nextVetVisit || meta.vetAppointment
        billsList.push({
          title: `${entry.title || meta.name || 'Pet'} - Vet Visit`,
          amount: parseFloat(String(meta.vetCost || meta.estimatedVetCost || 0)),
          dueDate: coerceDueDateString(vetDate),
          category: 'Pet Care',
          isRecurring: false,
          source: 'pets',
          domain: 'pets'
        })
      }

      // Pet insurance
      if (meta.insuranceDue || meta.petInsuranceDue) {
        const insDate = meta.insuranceDue || meta.petInsuranceDue
        billsList.push({
          title: `${entry.title || meta.name || 'Pet'} - Insurance`,
          amount: parseFloat(String(meta.insurancePremium || meta.petInsuranceCost || 0)),
          dueDate: coerceDueDateString(insDate),
          category: 'Pet Insurance',
          isRecurring: true,
          source: 'pets',
          domain: 'pets'
        })
      }

      // Medication refills
      if (meta.medicationRefillDate || meta.nextMedication) {
        const medDate = meta.medicationRefillDate || meta.nextMedication
        billsList.push({
          title: `${entry.title || meta.name || 'Pet'} - Medication`,
          amount: parseFloat(String(meta.medicationCost || 0)),
          dueDate: coerceDueDateString(medDate),
          category: 'Pet Medication',
          isRecurring: true,
          source: 'pets',
          domain: 'pets'
        })
      }
    })

    // 8. Get education-related bills (tuition, loans, fees)
    const educationEntries = data.education || []
    educationEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      
      // Tuition payments
      if (meta.tuitionDue || meta.paymentDue) {
        const tuitionDate = meta.tuitionDue || meta.paymentDue
        billsList.push({
          title: entry.title || meta.institution || 'Education - Tuition',
          amount: parseFloat(String(meta.tuitionAmount || meta.amount || 0)),
          dueDate: coerceDueDateString(tuitionDate),
          category: 'Education',
          isRecurring: Boolean(meta.recurring),
          source: 'education',
          domain: 'education'
        })
      }

      // Student loan payments
      if (meta.loanPaymentDue || meta.nextLoanPayment) {
        const loanDate = meta.loanPaymentDue || meta.nextLoanPayment
        billsList.push({
          title: `${entry.title || 'Student Loan'} - Payment`,
          amount: parseFloat(String(meta.loanPayment || meta.monthlyPayment || 0)),
          dueDate: coerceDueDateString(loanDate),
          category: 'Student Loan',
          isRecurring: true,
          source: 'education',
          domain: 'education'
        })
      }
    })

    // 9. Get health-related bills (insurance, prescriptions, appointments)
    const healthEntries = data.health || []
    healthEntries.forEach((entry: any) => {
      const meta = entry.metadata || {}
      
      // Prescription refills with cost
      if (meta.refillDate && (meta.cost || meta.prescriptionCost)) {
        billsList.push({
          title: `${meta.medicationName || entry.title || 'Prescription'} - Refill`,
          amount: parseFloat(String(meta.cost || meta.prescriptionCost || 0)),
          dueDate: coerceDueDateString(meta.refillDate),
          category: 'Health',
          isRecurring: true,
          source: 'health',
          domain: 'health'
        })
      }

      // Health insurance premiums
      if (meta.premiumDue || meta.insuranceDue) {
        const premDate = meta.premiumDue || meta.insuranceDue
        billsList.push({
          title: entry.title || 'Health Insurance',
          amount: parseFloat(String(meta.premium || meta.monthlyPremium || 0)),
          dueDate: coerceDueDateString(premDate),
          category: 'Health Insurance',
          isRecurring: true,
          source: 'health',
          domain: 'health'
        })
      }

      // Appointment costs
      if (meta.appointmentDate && meta.estimatedCost) {
        billsList.push({
          title: `${meta.doctorName || meta.provider || 'Medical'} - Appointment`,
          amount: parseFloat(String(meta.estimatedCost || 0)),
          dueDate: coerceDueDateString(meta.appointmentDate),
          category: 'Medical',
          isRecurring: false,
          source: 'health',
          domain: 'health'
        })
      }
    })

    // 10. Get service provider payments from dedicated service_payments table
    if (servicePayments && servicePayments.length > 0) {
      servicePayments.forEach(payment => {
        if (payment.due_date && payment.status === 'pending') {
          const provider = serviceProviders?.find(p => p.id === payment.provider_id)
          const categoryLabel = provider?.category === 'insurance' ? 'Insurance' :
                               provider?.category === 'utilities' ? 'Utilities' :
                               provider?.category === 'telecom' ? 'Telecom' :
                               provider?.category === 'subscriptions' ? 'Subscription' : 'Service'
          
          billsList.push({
            title: payment.provider_name || provider?.provider_name || 'Service Payment',
            amount: payment.amount,
            dueDate: coerceDueDateString(payment.due_date),
            category: categoryLabel,
            isRecurring: true,
            source: 'bills',
            domain: 'services'
          })
        }
      })
    }

    return billsList
  }, [bills, data, homeEntries, homeEntriesLength, servicePayments, serviceProviders, refreshTrigger])

  const processedBills = useMemo(() => {
    if (allBills.length === 0) return []

    const now = new Date()
    
    const parseDueDate = (dueDateValue: unknown): Date | null => {
      try {
        if (dueDateValue == null) return null
        const dueDateStr = dueDateValue instanceof Date ? dueDateValue.toISOString() : String(dueDateValue)

        let dueDate = parseISO(dueDateStr)
        if (!isNaN(dueDate.getTime())) {
          return dueDate
        }
        
        const dayNum = parseInt(dueDateStr.replace(/\D/g, ''))
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          const currentMonth = now.getMonth()
          const currentYear = now.getFullYear()
          dueDate = new Date(currentYear, currentMonth, dayNum)
          
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
        return daysUntilDue >= 0
      })
      .map(bill => {
        const dueDate = parseDueDate(bill.dueDate)!
        const daysUntilDue = differenceInDays(dueDate, now)
        return {
          ...bill,
          dueDate: dueDate.toISOString(),
          daysUntilDue,
          isUrgent: daysUntilDue <= 7
        }
      })
      .sort((a, b) => a.daysUntilDue! - b.daysUntilDue!)
  }, [allBills])

  // Show limited bills when collapsed, all when expanded
  const displayBills = showAllBills ? processedBills : processedBills.slice(0, 4)

  const totalAmount = useMemo(() => {
    return processedBills.reduce((sum, bill) => sum + (bill.amount || 0), 0)
  }, [processedBills])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'subscriptions': return '🔄'
      case 'finance': return '💰'
      case 'housing': return '🏠'
      case 'insurance': return '🛡️'
      case 'vehicles': return '🚗'
      case 'pets': return '🐾'
      case 'education': return '🎓'
      case 'health': return '🏥'
      default: return '💳'
    }
  }

  const getDomainLabel = (domain: string) => {
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  }

  return (
    <CollapsibleDashboardCard
      id="upcoming-bills"
      title="All Bills & Expenses"
      icon={<CreditCard className="w-5 h-5 text-emerald-500" />}
      badge={
        <Badge variant="secondary" className="text-lg font-bold">
          ${totalAmount.toFixed(0)}
        </Badge>
      }
      subtitle={`${allBills.length} total • ${processedBills.length} upcoming`}
      borderColor="border-emerald-200 dark:border-emerald-900"
      defaultOpen={true}
    >
      {processedBills.length === 0 ? (
        <div className="text-center py-6">
          <CreditCard className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
          <p className="text-sm text-gray-500 mb-1">No upcoming bills</p>
          <p className="text-xs text-gray-400">
            Add bills, subscriptions, or expenses to track
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayBills.map((bill, idx) => (
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
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">
                      Due {format(parseISO(bill.dueDate), 'MMM d')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {bill.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs opacity-70">
                      {getDomainLabel(bill.domain)}
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
          
          {/* Show More/Less Button */}
          {processedBills.length > 4 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={() => setShowAllBills(!showAllBills)}
            >
              {showAllBills ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show All {processedBills.length} Bills
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </CollapsibleDashboardCard>
  )
}
