'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, CreditCard, DollarSign, Loader2, Edit } from 'lucide-react'
import { sanitizeInput } from '@/lib/validation'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { toast } from 'sonner'

interface Subscription {
  serviceName: string
  category: string
  monthlyCost: string
  billingCycle: 'Monthly' | 'Yearly' | 'Quarterly'
  renewalDate: string
  status: 'Active' | 'Cancelled' | 'Trial'
  notes?: string
}

export function SubscriptionsTab() {
  // ✅ Use modern hook for real-time updates
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useDomainEntries('digital')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Subscription>>({})


  // #region agent log
  console.log('🔍 [DEBUG-SUBS-TAB] useDomainEntries("digital") returned:', entries.length, 'entries')
  console.log('🔍 [DEBUG-SUBS-TAB] Digital entries details:', entries.slice(0, 5).map(e => ({ id: e.id, title: e.title, type: e.metadata?.type, monthlyCost: e.metadata?.monthlyCost, renewalDate: e.metadata?.renewalDate })))
  // #endregion

  // ✅ Filter subscriptions in real-time from entries
  const subscriptions = entries
    .filter(item => item.metadata?.type === 'subscription')
    .map(item => ({
      id: item.id,
      serviceName: item.metadata?.serviceName || item.title || '',
      monthlyCost: item.metadata?.monthlyCost || '0',
      billingCycle: item.metadata?.billingCycle || 'Monthly',
      renewalDate: item.metadata?.renewalDate || '',
      status: item.metadata?.status || 'Active',
      category: item.metadata?.category,
      paymentMethod: item.metadata?.paymentMethod,
      notes: item.metadata?.notes
    }))
  const [formData, setFormData] = useState<Partial<Subscription>>({
    billingCycle: 'Monthly',
    status: 'Active'
  })

  const totalMonthlyCost = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + parseFloat(String(s.monthlyCost) || '0'), 0)

  const handleAdd = async () => {
    // Validation
    if (!formData.serviceName?.trim()) {
      toast.error('Please enter a service name')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a category')
      return
    }

    // Validate monthly cost is positive if provided
    const cost = parseFloat(formData.monthlyCost || '0')
    if (cost < 0) {
      toast.error('Monthly cost cannot be negative')
      return
    }

    const subscriptionData = {
      serviceName: sanitizeInput(formData.serviceName),
      category: formData.category,
      monthlyCost: cost.toString(),
      billingCycle: formData.billingCycle || 'Monthly',
      renewalDate: formData.renewalDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'Active',
      notes: formData.notes ? sanitizeInput(formData.notes) : undefined
    }

    try {
      // ✅ Use createEntry for instant real-time updates
      await createEntry({
        domain: 'digital',
        title: `${subscriptionData.serviceName} Subscription`,
        description: `${subscriptionData.billingCycle} subscription`,
        metadata: {
          type: 'subscription',
          ...subscriptionData
        }
      })
      
      setFormData({ billingCycle: 'Monthly', status: 'Active' })
      setShowAddForm(false)
      toast.success('Subscription added successfully!')
    } catch (error) {
      console.error('Failed to add subscription:', error)
      toast.error('Failed to add subscription. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    
    try {
      // ✅ Use deleteEntry for instant real-time updates (no manual reload needed)
      await deleteEntry(id)
      toast.success('Subscription deleted successfully!')
    } catch (error) {
      console.error('Failed to delete subscription:', error)
      toast.error('Failed to delete subscription. Please try again.')
    }
  }

  const handleEdit = (sub: typeof subscriptions[0]) => {
    setEditingId(sub.id)
    setEditFormData({
      serviceName: String(sub.serviceName || ''),
      category: String(sub.category || ''),
      monthlyCost: String(sub.monthlyCost || ''),
      billingCycle: (sub.billingCycle as Subscription['billingCycle']) || 'Monthly',
      renewalDate: String(sub.renewalDate || ''),
      status: (sub.status as Subscription['status']) || 'Active',
      notes: sub.notes ? String(sub.notes) : undefined
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    
    try {
      await updateEntry({
        id: editingId,
        title: `${editFormData.serviceName} Subscription`,
        metadata: {
          type: 'subscription',
          serviceName: editFormData.serviceName,
          category: editFormData.category,
          monthlyCost: editFormData.monthlyCost,
          billingCycle: editFormData.billingCycle,
          renewalDate: editFormData.renewalDate,
          status: editFormData.status,
          notes: editFormData.notes
        }
      })
      setEditingId(null)
      setEditFormData({})
      toast.success('Subscription updated successfully!')
    } catch (error) {
      console.error('Failed to update subscription:', error)
      toast.error('Failed to update subscription. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Trial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Subscriptions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total Monthly Cost: <span className="font-semibold text-green-600">${totalMonthlyCost.toFixed(2)}</span>
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Service Name *</Label>
                <Input
                  placeholder="Netflix, Spotify, Adobe CC..."
                  value={formData.serviceName || ''}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                />
              </div>
              <div>
                <Label>Category *</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Software">Software</option>
                  <option value="Cloud Storage">Cloud Storage</option>
                  <option value="Music">Music</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Gaming">Gaming</option>
                  <option value="News">News</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Monthly Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="9.99"
                  value={formData.monthlyCost || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyCost: e.target.value })}
                />
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.billingCycle || 'Monthly'}
                  onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input
                  type="date"
                  value={formData.renewalDate || ''}
                  onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Trial">Trial</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional information..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Subscription</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && subscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">No subscriptions yet. Add your first subscription!</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{String(sub.serviceName || 'Unnamed Service')}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(sub.status) || 'Active')}`}>
                            {String(sub.status || 'Active')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{String(sub.category || 'Uncategorized')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">${String(sub.monthlyCost || '0')}</p>
                        <p className="text-xs text-muted-foreground">{String(sub.billingCycle || 'Monthly')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Renewal Date</p>
                        <p className="font-medium">{String(sub.renewalDate || 'Not set')}</p>
                      </div>
                    </div>

                    {typeof sub.notes === 'string' && sub.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{sub.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(sub)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(sub.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Service Name</Label>
              <Input
                value={editFormData.serviceName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, serviceName: e.target.value })}
                placeholder="Netflix, Spotify, etc."
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={editFormData.category || ''}
                onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Streaming">Streaming</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="News">News</SelectItem>
                  <SelectItem value="Productivity">Productivity</SelectItem>
                  <SelectItem value="Storage">Storage</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Monthly Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.monthlyCost || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, monthlyCost: e.target.value })}
                  placeholder="9.99"
                />
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <Select
                  value={editFormData.billingCycle || 'Monthly'}
                  onValueChange={(value) => setEditFormData({ ...editFormData, billingCycle: value as Subscription['billingCycle'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Renewal Date</Label>
                <Input
                  type="date"
                  value={editFormData.renewalDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, renewalDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editFormData.status || 'Active'}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Subscription['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

