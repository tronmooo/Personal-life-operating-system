'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileWarning, AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { useMemo, useState } from 'react'
import { differenceInDays, format } from 'date-fns'
import { CollapsibleDashboardCard } from './collapsible-dashboard-card'

interface ExpiringDoc {
  title: string
  domain: string
  expirationDate: Date
  daysUntil: number
  status: 'expired' | 'urgent' | 'warning' | 'ok'
}

export function DocumentExpirationCard() {
  const { data, documents } = useData()
  const [showAllItems, setShowAllItems] = useState(false)

  const allExpiringItems = useMemo(() => {
    const items: ExpiringDoc[] = []
    const now = new Date()

    // Check domain entries with ACTUAL expiration dates from ALL domains
    // 🔧 KEY FIX: Only show items with TRUE expiration dates, NOT billing/renewal dates
    // Recurring bills/subscriptions with no end date should NEVER appear here
    Object.entries(data).forEach(([domain, entries]) => {
      if (!Array.isArray(entries)) return
      
      entries.forEach((entry: any) => {
        const meta = entry.metadata || {}
        
        // Check if this is a recurring item (bill, subscription, expense, etc.)
        const isRecurring = Boolean(
          meta.recurring ||
          meta.isRecurring ||
          meta.frequency ||
          meta.billingCycle ||
          meta.type === 'subscription' ||
          meta.itemType === 'subscription' ||
          meta.type === 'bill' ||
          meta.itemType === 'bill' ||
          meta.type === 'expense'
        )
        
        // 🔧 IMPORTANT: These are BILLING dates, NOT expiration dates
        // Items with ONLY these dates should NOT appear in "Expiring Soon"
        const billingDates = [
          'renewalDate', 'renewal_date',
          'nextDueDate', 'next_due_date', 
          'dueDate', 'due_date',
          'nextBilling', 'next_billing',
          'billingDate', 'billing_date',
          'paymentDate', 'payment_date',
          'nextPayment', 'next_payment'
        ]
        
        // 🔧 These are TRUE expiration/end dates - items that actually expire
        const trueExpirationDateFields = [
          'expirationDate', 'expiration_date',
          'expiryDate', 'expiry_date',
          'contractEndDate', 'contract_end_date', 'contractEnd',
          'cancellationDate', 'cancellation_date',
          'subscriptionEnd', 'subscription_end',
          'registrationExpiry', 'registration_expiry',  // Vehicle registration
          'licenseExpiry', 'license_expiry',            // Licenses
          'certificationExpiry', 'certification_expiry', // Certifications
          'warrantyExpiry', 'warranty_expiry',          // Warranties
          'leaseEnd', 'lease_end',                      // Leases
          'policyEndDate', 'policy_end_date',           // Insurance policies
          'validUntil', 'valid_until',                  // Validity dates
          'expireDate', 'expire_date'
        ]
        
        // Find actual expiration date (from entry or metadata)
        let expDate: string | undefined
        
        // Check entry-level fields first
        for (const field of trueExpirationDateFields) {
          if (entry[field]) {
            expDate = entry[field]
            break
          }
        }
        
        // Then check metadata fields
        if (!expDate) {
          for (const field of trueExpirationDateFields) {
            if (meta[field]) {
              expDate = meta[field]
              break
            }
          }
        }
        
        // 🔧 For NON-recurring items only, also check renewalDate as potential expiration
        // (e.g., a one-time warranty, a contract with end date stored in renewalDate)
        if (!expDate && !isRecurring) {
          // Check if there's a billing-type date that might indicate expiration for non-recurring items
          for (const field of billingDates) {
            const val = entry[field] || meta[field]
            if (val) {
              expDate = val
              break
            }
          }
        }
        
        // Skip items with no true expiration date
        if (!expDate) return

        const expirationDate = new Date(expDate)
        if (isNaN(expirationDate.getTime())) return // Skip invalid dates
        
        const daysUntil = differenceInDays(expirationDate, now)
        
        // Show items expiring in next 90 days or already expired (within last 30 days)
        if (daysUntil <= 90 && daysUntil >= -30) {
          let status: 'expired' | 'urgent' | 'warning' | 'ok' = 'ok'
          if (daysUntil < 0) status = 'expired'
          else if (daysUntil <= 14) status = 'urgent'
          else if (daysUntil <= 30) status = 'warning'

          items.push({
            title: entry.title || entry.name || meta.name || 'Untitled',
            domain,
            expirationDate,
            daysUntil,
            status
          })
        }
      })
    })

    // Check documents with expiration
    if (Array.isArray(documents)) {
      documents.forEach((doc: any) => {
        if (doc.expirationDate || doc.expiration_date || doc.expiryDate) {
          const expDate = doc.expirationDate || doc.expiration_date || doc.expiryDate
          const expirationDate = new Date(expDate)
          if (isNaN(expirationDate.getTime())) return
          
          const daysUntil = differenceInDays(expirationDate, now)
          
          if (daysUntil <= 90 && daysUntil >= -30) {
            let status: 'expired' | 'urgent' | 'warning' | 'ok' = 'ok'
            if (daysUntil < 0) status = 'expired'
            else if (daysUntil <= 14) status = 'urgent'
            else if (daysUntil <= 30) status = 'warning'

            items.push({
              title: doc.title || doc.name || doc.document_name || 'Document',
              domain: doc.category || doc.domain || 'documents',
              expirationDate,
              daysUntil,
              status
            })
          }
        }
      })
    }

    return items.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [data, documents])

  // Show limited items when collapsed, all when expanded
  const displayItems = showAllItems ? allExpiringItems : allExpiringItems.slice(0, 4)

  const statusCounts = useMemo(() => {
    const counts = { expired: 0, urgent: 0, warning: 0, ok: 0 }
    allExpiringItems.forEach(item => counts[item.status]++)
    return counts
  }, [allExpiringItems])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-500 text-white'
      case 'urgent': return 'bg-orange-500 text-white'
      case 'warning': return 'bg-yellow-500 text-white'
      default: return 'bg-green-500 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'expired': return <AlertTriangle className="w-4 h-4" />
      case 'urgent': return <FileWarning className="w-4 h-4" />
      case 'warning': return <Clock className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const getStatusLabel = (item: ExpiringDoc) => {
    if (item.daysUntil < 0) return `${Math.abs(item.daysUntil)}d ago`
    if (item.daysUntil === 0) return 'Today'
    if (item.daysUntil === 1) return 'Tomorrow'
    return `${item.daysUntil}d`
  }

  const getDomainIcon = (domain: string) => {
    const icons: Record<string, string> = {
      vehicles: '🚗',
      insurance: '🛡️',
      documents: '📄',
      health: '🏥',
      financial: '💰',
      home: '🏠',
      pets: '🐾',
      education: '🎓',
      digital: '💻',
      legal: '⚖️',
      travel: '✈️'
    }
    return icons[domain.toLowerCase()] || '📋'
  }

  const headerBadge = (
    <div className="flex gap-1">
      {statusCounts.expired > 0 && (
        <Badge variant="destructive" className="text-xs">
          {statusCounts.expired}
        </Badge>
      )}
      {statusCounts.urgent > 0 && (
        <Badge className="bg-orange-500 text-xs">
          {statusCounts.urgent}
        </Badge>
      )}
      {allExpiringItems.length > 0 && (
        <Badge variant="secondary" className="text-xs">
          {allExpiringItems.length}
        </Badge>
      )}
    </div>
  )

  return (
    <CollapsibleDashboardCard
      id="expiring-soon"
      title="Expiring Soon"
      icon={<FileWarning className="w-5 h-5 text-rose-500" />}
      badge={headerBadge}
      subtitle={allExpiringItems.length > 0 ? `${statusCounts.expired} expired • ${statusCounts.urgent} urgent • ${statusCounts.warning} warning` : undefined}
      borderColor="border-rose-200 dark:border-rose-900"
      defaultOpen={true}
    >
      {allExpiringItems.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
          <p className="text-sm text-gray-500">All documents up to date! 🎉</p>
          <p className="text-xs text-gray-400 mt-1">Nothing expiring in next 90 days</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${
                item.status === 'expired'
                  ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
                  : item.status === 'urgent'
                  ? 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-800'
                  : item.status === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{getDomainIcon(item.domain)}</span>
                  <div className={`flex-shrink-0 ${
                    item.status === 'expired' ? 'text-red-600' :
                    item.status === 'urgent' ? 'text-orange-600' :
                    item.status === 'warning' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{item.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.domain}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Exp: {format(item.expirationDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className={`${getStatusColor(item.status)} text-xs font-bold flex-shrink-0`}
                >
                  {getStatusLabel(item)}
                </Badge>
              </div>
            </div>
          ))}
          
          {/* Show More/Less Button */}
          {allExpiringItems.length > 4 && (
            <Button
              variant="ghost"
              className="w-full mt-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
              onClick={() => setShowAllItems(!showAllItems)}
            >
              {showAllItems ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Show All {allExpiringItems.length} Items
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </CollapsibleDashboardCard>
  )
}
