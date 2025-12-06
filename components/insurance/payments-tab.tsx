'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'

interface InsurancePolicy {
  id: string
  type: string
  provider: string
  policyNumber: string
  premium: number
  frequency: 'Monthly' | 'Quarterly' | 'Annually'
  status: 'Active' | 'Expired' | 'Cancelled'
  validUntil: string
  nextPayment?: string
}

export function PaymentsTab() {
  const { data } = useData()

  const policies = useMemo<InsurancePolicy[]>(() => {
    const entries = (data?.insurance ?? []) as DomainData<'insurance'>[]
    return entries
      .filter((entry) => entry.metadata?.itemType === 'policy')
      .map((entry) => {
        const metadata: any = entry.metadata ?? {}
        const premium = Number(metadata.premium ?? metadata.monthlyPremium ?? 0)
        const frequency = (metadata.frequency as InsurancePolicy['frequency']) || 'Monthly'
        return {
          id: entry.id,
          type: (metadata.type || metadata.policyType || 'policy').toString(),
          provider: metadata.provider || '',
          policyNumber: metadata.policyNumber || '',
          premium,
          frequency,
          status: (metadata.status as InsurancePolicy['status']) || 'Active',
          validUntil: metadata.expiryDate || metadata.validUntil || '',
          nextPayment: metadata.nextPayment || undefined,
        }
      })
      .filter((policy) => policy.status === 'Active')
  }, [data?.insurance])

  const getTotalAnnualPremium = () => {
    return policies.reduce((sum, p) => {
      const multiplier = p.frequency === 'Monthly' ? 12 : p.frequency === 'Quarterly' ? 4 : 1
      return sum + (p.premium * multiplier)
    }, 0)
  }

  const getAnnualCost = (policy: InsurancePolicy) => {
    const multiplier = policy.frequency === 'Monthly' ? 12 : policy.frequency === 'Quarterly' ? 4 : 1
    return policy.premium * multiplier
  }

  const getCoverageProgress = (validUntil: string) => {
    const start = new Date(new Date(validUntil).getFullYear(), 0, 1)
    const end = new Date(validUntil)
    const today = new Date()
    
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return Math.min(Math.max((daysElapsed / totalDays) * 100, 0), 100)
  }

  return (
    <div className="space-y-6">
      {/* Total Annual Premium Card */}
      <Card className="p-8 bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <p className="text-purple-100 mb-2">Total Annual Premium</p>
        <p className="text-6xl font-bold mb-2">${getTotalAnnualPremium().toLocaleString()}</p>
        <p className="text-purple-100">Across all active policies</p>
      </Card>

      {/* Individual Policy Payment Cards */}
      <div className="space-y-4">
        {policies.map((policy) => (
          <Card 
            key={policy.id}
            className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{policy.type} Insurance</h3>
                <p className="text-gray-600 dark:text-gray-400">{policy.provider}</p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                Active
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Payment Frequency</p>
                <p className="text-lg font-bold">{policy.frequency}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Premium Amount</p>
                <p className="text-lg font-bold">${policy.premium}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Annual Cost</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  ${getAnnualCost(policy).toLocaleString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next Payment</p>
                <p className="text-lg font-bold">
                  {policy.nextPayment 
                    ? new Date(policy.nextPayment).toLocaleDateString()
                    : new Date(policy.validUntil).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Coverage Period</span>
                <span className="font-medium">
                  {new Date(policy.validUntil).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                  style={{ width: `${getCoverageProgress(policy.validUntil)}%` }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {policies.length === 0 && (
        <Card className="p-16 text-center">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No active policies to track</p>
        </Card>
      )}
    </div>
  )
}

