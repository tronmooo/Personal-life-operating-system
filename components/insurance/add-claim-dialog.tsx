'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText } from 'lucide-react'
import { useInsurance } from '@/lib/hooks/use-insurance'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddClaimDialog({ open, onOpenChange }: Props) {
  const { policies, addClaim } = useInsurance()
  const [formData, setFormData] = useState({
    policyId: '',
    claimDate: '',
    claimAmount: '',
    approvedAmount: '',
    status: 'Pending',
    description: ''
  })

  useEffect(() => {
    if (open) {
      const active = policies.filter((p: any) => (p.metadata?.status || 'Active') === 'Active')
      if (active.length > 0) {
        setFormData(prev => ({ ...prev, policyId: active[0].id }))
      }
    }
  }, [open, policies])

  const handleSubmit = async () => {
    if (!formData.policyId || !formData.claimDate || !formData.claimAmount) {
      alert('Please fill in policy, claim date, and claim amount')
      return
    }

    const policy = policies.find((p: any) => p.id === formData.policyId)
    if (!policy) return

    await addClaim({
      policy_id: policy.id,
      status: formData.status,
      amount: parseFloat(formData.claimAmount),
      filed_on: formData.claimDate,
      resolved_on: null,
      details: {
        approvedAmount: formData.approvedAmount ? parseFloat(formData.approvedAmount) : undefined,
        description: formData.description,
        provider: policy.provider,
        policy_number: policy.policy_number,
        policy_type: policy.type,
      }
    })

    setFormData({
      policyId: policies[0]?.id || '',
      claimDate: '',
      claimAmount: '',
      approvedAmount: '',
      status: 'Pending',
      description: ''
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="w-6 h-6 text-blue-600" />
            File Insurance Claim
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Policy Selection */}
          <div>
            <Label>Select Policy *</Label>
            <select
              className="w-full border rounded-lg p-3 bg-background mt-1"
              value={formData.policyId}
              onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
            >
              {policies.map((policy: any) => (
                <option key={policy.id} value={policy.id}>
                  {(policy.type || policy.metadata?.type || 'Policy')} - {policy.provider} ({policy.policy_number})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Claim Date */}
            <div>
              <Label>Claim Date *</Label>
              <Input
                type="date"
                value={formData.claimDate}
                onChange={(e) => setFormData({ ...formData, claimDate: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Claim Amount */}
            <div>
              <Label>Claim Amount *</Label>
              <Input
                type="number"
                placeholder="2500"
                value={formData.claimAmount}
                onChange={(e) => setFormData({ ...formData, claimAmount: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded-lg p-3 bg-background mt-1"
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
              <Label>Approved Amount (if applicable)</Label>
              <Input
                type="number"
                placeholder="2200"
                value={formData.approvedAmount}
                onChange={(e) => setFormData({ ...formData, approvedAmount: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label>Description *</Label>
            <Textarea
              placeholder="Hospital visit, emergency room..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              File Claim
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

