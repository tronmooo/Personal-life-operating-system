'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import type { DomainData } from '@/types/domains'

interface Props {
  onCancel: () => void
  onSuccess: () => void
}

interface Policy {
  id: string
  type: string
  provider: string
  policyNumber: string
}

export function AddClaimForm({ onCancel, onSuccess }: Props) {
  const { data, addData, reloadDomain } = useData()
  const [formData, setFormData] = useState({
    policyId: '',
    claimNumber: '',
    date: '',
    amount: '',
    status: 'Pending',
    approvedAmount: '',
    description: ''
  })

  const generateClaimNumber = () => {
    const now = new Date()
    const suffix = now.getTime().toString().slice(-4)
    return `CLM-${now.getFullYear()}-${suffix}`
  }

  const insuranceEntries = useMemo(() => {
    const entries = (data?.insurance ?? []) as DomainData<'insurance'>[]
    return entries.filter((entry) => entry.metadata?.itemType === 'policy')
  }, [data?.insurance])

  const policies: Policy[] = useMemo(() => {
    return insuranceEntries.map((entry) => {
      const metadata: any = entry.metadata ?? {}
      return {
        id: entry.id,
        type: (metadata.type || metadata.policyType || 'policy').toString(),
        provider: metadata.provider || '',
        policyNumber: metadata.policyNumber || '',
      }
    })
  }, [insuranceEntries])

  useEffect(() => {
    if (policies.length === 0) {
      return
    }

    setFormData((prev) => {
      const nextPolicyId = prev.policyId || policies[0].id
      const nextClaimNumber = prev.claimNumber || generateClaimNumber()
      return { ...prev, policyId: nextPolicyId, claimNumber: nextClaimNumber }
    })
  }, [policies])

  const handleSubmit = async () => {
    if (!formData.policyId || !formData.date || !formData.amount) {
      alert('Please fill in policy, date, and claim amount')
      return
    }

    const selectedPolicy = policies.find(p => p.id === formData.policyId)
    if (!selectedPolicy) return

    await addData('insurance', {
      title: `Claim ${formData.claimNumber || 'Pending'}`,
      description: `${selectedPolicy.type} - ${selectedPolicy.provider}`,
      metadata: {
        itemType: 'claim',
        policyId: formData.policyId,
        policyNumber: selectedPolicy.policyNumber,
        policyType: selectedPolicy.type,
        provider: selectedPolicy.provider,
        claimNumber: formData.claimNumber || generateClaimNumber(),
        claimDate: formData.date,
        claimAmount: parseFloat(formData.amount),
        approvedAmount: formData.approvedAmount ? parseFloat(formData.approvedAmount) : undefined,
        status: formData.status,
        description: formData.description || undefined,
      },
    })

    await reloadDomain('insurance')
    onSuccess()
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="p-8 bg-gray-50 dark:bg-gray-900 rounded-3xl shadow-lg">
        <h2 className="text-3xl font-bold mb-8">New Claim</h2>

        <div className="space-y-6">
          {/* Policy */}
          <div>
            <Label className="text-lg mb-2 block">Policy</Label>
            <select
              className="w-full border-2 rounded-xl p-4 text-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 dark:bg-gray-800"
              value={formData.policyId}
              onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
            >
              {policies.length === 0 ? (
                <option value="">Select policy</option>
              ) : (
                policies.map(policy => (
                  <option key={policy.id} value={policy.id}>
                    {policy.type} - {policy.provider} ({policy.policyNumber})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Claim Number */}
          <div>
            <Label className="text-lg mb-2 block">Claim Number</Label>
            <Input
              placeholder="CLM-XXXX-XXX"
              value={formData.claimNumber}
              onChange={(e) => setFormData({ ...formData, claimNumber: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800 bg-gray-50"
              readOnly
            />
          </div>

          {/* Date */}
          <div>
            <Label className="text-lg mb-2 block">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Claim Amount */}
          <div>
            <Label className="text-lg mb-2 block">Claim Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Status */}
          <div>
            <Label className="text-lg mb-2 block">Status</Label>
            <select
              className="w-full border-2 rounded-xl p-4 text-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 dark:bg-gray-800"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Denied">Denied</option>
            </select>
          </div>

          {/* Approved Amount */}
          <div>
            <Label className="text-lg mb-2 block">Approved Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.approvedAmount}
              onChange={(e) => setFormData({ ...formData, approvedAmount: e.target.value })}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-lg mb-2 block">Description</Label>
            <Textarea
              placeholder="Describe the claim..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="border-2 rounded-xl p-4 text-lg bg-gray-800 dark:bg-gray-800 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg rounded-xl"
            >
              File Claim
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 py-6 text-lg rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

