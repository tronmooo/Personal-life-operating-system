'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Edit, Trash2, Phone, Mail, FileText, Save, X } from 'lucide-react'
import { format } from 'date-fns'
import { useInsurance } from '@/lib/hooks/use-insurance'

export function PoliciesTab() {
  const { policies, updatePolicy, deletePolicy } = useInsurance()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})

  const getTotalPolicies = () => policies.length
  const getActivePolicies = () => policies.filter((p: any) => (p.metadata?.status || 'Active') === 'Active').length
  const getTotalAnnualPremium = () => {
    return policies
      .filter((p: any) => (p.metadata?.status || 'Active') === 'Active')
      .reduce((sum: number, p: any) => {
        const freq = p.metadata?.frequency || 'Monthly'
        const multiplier = freq === 'Monthly' ? 12 : freq === 'Quarterly' ? 4 : 1
        return sum + (Number(p.premium || 0) * multiplier)
      }, 0)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Health': 'from-green-500 to-green-600',
      'Auto': 'from-blue-500 to-blue-600',
      'Home': 'from-purple-500 to-purple-600',
      'Life': 'from-red-500 to-red-600',
      'Dental': 'from-teal-500 to-teal-600',
      'Vision': 'from-indigo-500 to-indigo-600',
      'Pet': 'from-pink-500 to-pink-600',
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'Health': '🏥',
      'Auto': '🚗',
      'Home': '🏠',
      'Life': '❤️',
      'Dental': '🦷',
      'Vision': '👁️',
      'Pet': '🐾',
    }
    return icons[type] || '📋'
  }

  const getExpiringPolicies = () => {
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    return policies.filter((p: any) => {
      const validUntil = p.ends_on || p.metadata?.validUntil
      if (!validUntil) return false
      const expiryDate = new Date(validUntil)
      const status = p.metadata?.status || 'Active'
      return expiryDate >= today && expiryDate <= thirtyDaysLater && status === 'Active'
    })
  }

  const expiringPolicies = getExpiringPolicies() as any[]

  const handleEdit = (policy: any) => {
    setEditingId(policy.id)
    setEditForm({
      provider: policy.provider,
      policy_number: policy.policy_number,
      type: policy.type || policy.metadata?.type,
      premium: policy.premium,
      starts_on: policy.starts_on,
      ends_on: policy.ends_on,
      coverageAmount: policy.coverage?.amount || 0,
      frequency: policy.metadata?.frequency || 'Monthly',
      status: policy.metadata?.status || 'Active',
      phone: policy.metadata?.phone || '',
      email: policy.metadata?.email || ''
    })
  }

  const handleSaveEdit = async (id: string, policy: any) => {
    try {
      await updatePolicy(id, {
        provider: editForm.provider,
        policy_number: editForm.policy_number,
        type: editForm.type,
        premium: Number(editForm.premium),
        starts_on: editForm.starts_on,
        ends_on: editForm.ends_on,
        coverage: { ...policy.coverage, amount: Number(editForm.coverageAmount) },
        metadata: {
          ...policy.metadata,
          frequency: editForm.frequency,
          status: editForm.status,
          phone: editForm.phone,
          email: editForm.email
        }
      })
      setEditingId(null)
      setEditForm({})
    } catch (e) {
      console.error('Failed to update policy', e)
      alert('Failed to update policy')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this policy?')) return
    try {
      await deletePolicy(id)
    } catch (error) {
      console.error('Failed to delete policy:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Policies</p>
          <p className="text-4xl font-bold">{getTotalPolicies()}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Policies</p>
          <p className="text-4xl font-bold">{getActivePolicies()}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Annual Premium</p>
          <p className="text-4xl font-bold">${getTotalAnnualPremium().toLocaleString()}</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Claims</p>
          <p className="text-4xl font-bold">—</p>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {expiringPolicies.length > 0 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-300">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-500 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-orange-900 dark:text-orange-100">
                {expiringPolicies.length} {expiringPolicies.length === 1 ? 'Policy' : 'Policies'} Expiring Soon
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {expiringPolicies.map((p: any) => `${p.type || p.metadata?.type || 'Policy'} (${p.provider})`).join(', ')} will expire within 30 days
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Policies List */}
      <Card className="p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <h2 className="text-2xl font-bold mb-6">My Insurance Policies</h2>

        {policies.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No insurance policies added yet</p>
            <p className="text-sm text-gray-500">Click "Add Policy" to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy: any) => {
              const isEditing = editingId === policy.id
              return (
                <Card 
                  key={policy.id}
                  className="p-6 hover:shadow-lg transition-all"
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Provider</Label>
                          <Input
                            value={editForm.provider || ''}
                            onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Policy Number</Label>
                          <Input
                            value={editForm.policy_number || ''}
                            onChange={(e) => setEditForm({ ...editForm, policy_number: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Type</Label>
                          <Input
                            value={editForm.type || ''}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Premium ($)</Label>
                          <Input
                            type="number"
                            value={editForm.premium || ''}
                            onChange={(e) => setEditForm({ ...editForm, premium: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Coverage Amount ($)</Label>
                          <Input
                            type="number"
                            value={editForm.coverageAmount || ''}
                            onChange={(e) => setEditForm({ ...editForm, coverageAmount: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Frequency</Label>
                          <select
                            value={editForm.frequency || 'Monthly'}
                            onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                            className="mt-1 h-10 w-full rounded border px-3"
                          >
                            <option value="Monthly">Monthly</option>
                            <option value="Quarterly">Quarterly</option>
                            <option value="Annual">Annual</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm">Starts On</Label>
                          <Input
                            type="date"
                            value={editForm.starts_on || ''}
                            onChange={(e) => setEditForm({ ...editForm, starts_on: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Ends On</Label>
                          <Input
                            type="date"
                            value={editForm.ends_on || ''}
                            onChange={(e) => setEditForm({ ...editForm, ends_on: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Phone</Label>
                          <Input
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Email</Label>
                          <Input
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Status</Label>
                          <select
                            value={editForm.status || 'Active'}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                            className="mt-1 h-10 w-full rounded border px-3"
                          >
                            <option value="Active">Active</option>
                            <option value="Expired">Expired</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveEdit(policy.id, policy)}>
                          <Save className="w-3 h-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="w-3 h-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-4 bg-gradient-to-br ${getTypeColor(policy.type || policy.metadata?.type || 'Other')} text-white rounded-xl text-3xl`}>
                          {getTypeIcon(policy.type || policy.metadata?.type || 'Other')}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold">{policy.type || policy.metadata?.type || 'Policy'}</h3>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              (policy.metadata?.status || 'Active') === 'Active' 
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }`}>
                              {policy.metadata?.status || 'Active'}
                            </span>
                          </div>
                          
                          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">{policy.provider}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Policy Number</p>
                              <p className="font-bold">{policy.policy_number}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Premium</p>
                              <p className="font-bold">${Number(policy.premium || 0)} / {(policy.metadata?.frequency || 'Monthly')}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Coverage</p>
                              <p className="font-bold">${(policy.coverage?.amount || 0).toLocaleString()}</p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valid Until</p>
                              <p className="font-bold">{policy.ends_on ? format(new Date(policy.ends_on), 'MM/dd/yyyy') : '—'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm">
                            {policy.metadata?.phone && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Phone className="w-4 h-4" />
                                {policy.metadata.phone}
                              </div>
                            )}
                            {policy.metadata?.email && (
                              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Mail className="w-4 h-4" />
                                {policy.metadata.email}
                              </div>
                            )}
                          </div>

                          {policy.metadata?.documentPhoto && (
                            <details className="mt-4">
                              <summary className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                View Scanned Document
                              </summary>
                              <img 
                                src={policy.metadata.documentPhoto} 
                                alt={`${policy.type || 'Policy'} Insurance Document`} 
                                className="mt-2 rounded-lg max-h-64 object-contain border"
                              />
                            </details>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(policy)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(policy.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

