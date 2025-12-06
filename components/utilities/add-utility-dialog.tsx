'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddUtilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (utility: any) => void
}

export function AddUtilityDialog({ open, onOpenChange, onAdd }: AddUtilityDialogProps) {
  const [formData, setFormData] = useState({
    type: 'electricity' as 'electricity' | 'water' | 'gas' | 'internet' | 'phone' | 'cable' | 'other',
    provider: '',
    accountNumber: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as 'monthly' | 'weekly' | 'daily' | 'quarterly' | 'annually',
    usage: '',
    status: 'unpaid' as 'paid' | 'unpaid',
    autoPayEnabled: false
  })

  const handleSubmit = () => {
    if (!formData.provider || !formData.amount) {
      alert('Please fill in provider and amount')
      return
    }

    onAdd({
      ...formData,
      amount: parseFloat(formData.amount)
    })

    // Reset form
    setFormData({
      type: 'electricity',
      provider: '',
      accountNumber: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      usage: '',
      status: 'unpaid',
      autoPayEnabled: false
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Utility</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Utility Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Utility Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full border-2 rounded-xl p-3 bg-white dark:bg-gray-800"
            >
              <option value="electricity">⚡ Electricity</option>
              <option value="water">💧 Water</option>
              <option value="gas">🔥 Gas</option>
              <option value="internet">📶 Internet</option>
              <option value="phone">📞 Phone</option>
              <option value="cable">📺 Cable/TV</option>
              <option value="other">🏠 Other</option>
            </select>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-semibold mb-2">Provider/Company</label>
            <Input
              placeholder="e.g., City Power Co."
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              className="border-2 rounded-xl p-3"
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-semibold mb-2">Account Number</label>
            <Input
              placeholder="e.g., EP-123456"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              className="border-2 rounded-xl p-3"
            />
          </div>

          {/* Amount and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="145.50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="border-2 rounded-xl p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Payment Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full border-2 rounded-xl p-3 bg-white dark:bg-gray-800"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold mb-2">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="border-2 rounded-xl p-3"
            />
          </div>

          {/* Usage */}
          <div>
            <label className="block text-sm font-semibold mb-2">Usage (e.g., 850 kWh, 12,500 gal)</label>
            <Input
              placeholder="850 kWh"
              value={formData.usage}
              onChange={(e) => setFormData({ ...formData, usage: e.target.value })}
              className="border-2 rounded-xl p-3"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold mb-2">Payment Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full border-2 rounded-xl p-3 bg-white dark:bg-gray-800"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Auto-Pay */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.autoPayEnabled}
              onChange={(e) => setFormData({ ...formData, autoPayEnabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <label className="text-sm font-semibold">Auto-Pay Enabled</label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl text-lg"
            >
              Add Utility
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-6 rounded-2xl text-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

