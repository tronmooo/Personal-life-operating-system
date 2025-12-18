'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Globe, ExternalLink, Loader2, Edit } from 'lucide-react'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { toast } from 'sonner'

interface Domain {
  id: string
  domainName: string
  registrar: string
  registrationDate: string
  expiryDate: string
  autoRenew: boolean
  annualCost: string
  status: 'Active' | 'Expired' | 'Pending Transfer'
  nameservers?: string
  notes?: string
}

export function DomainsTab() {
  // ✅ Use modern hook for real-time updates
  const { entries, isLoading, createEntry, updateEntry, deleteEntry } = useDomainEntries('digital')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<Domain>>({
    autoRenew: true,
    status: 'Active'
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Domain>>({})

  // ✅ Filter domains in real-time from entries
  const domains = entries
    .filter(item => item.metadata?.itemType === 'domain')
    .map(item => {
      const meta = item.metadata || {}
      return {
        id: item.id,
        domainName: String(meta.domainName || item.title || ''),
        registrar: String(meta.registrar || ''),
        registrationDate: String(meta.registrationDate || ''),
        expiryDate: String(meta.expiryDate || ''),
        autoRenew: !!meta.autoRenew,
        annualCost: String(meta.annualCost || '0'),
        status: (meta.status as 'Active' | 'Expired' | 'Pending Transfer') || 'Active',
        nameservers: meta.nameservers ? String(meta.nameservers) : undefined,
        notes: meta.notes ? String(meta.notes) : undefined
      }
    })

  const handleAdd = async () => {
    if (!formData.domainName || !formData.registrar) {
      toast.error('Please enter domain name and registrar')
      return
    }

    const domainData = {
      itemType: 'domain',
      domainName: formData.domainName,
      registrar: formData.registrar,
      registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
      expiryDate: formData.expiryDate || '',
      autoRenew: formData.autoRenew || true,
      annualCost: formData.annualCost || '0',
      status: formData.status || 'Active',
      nameservers: formData.nameservers,
      notes: formData.notes
    }

    try {
      // ✅ Use createEntry for instant real-time updates
      await createEntry({
        domain: 'digital',
        title: domainData.domainName,
        description: `${domainData.registrar} domain`,
        metadata: domainData
      })
      
      setFormData({ autoRenew: true, status: 'Active' })
      setShowAddForm(false)
      toast.success('Domain added successfully!')
    } catch (error) {
      console.error('Failed to add domain:', error)
      toast.error('Failed to add domain. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this domain?')) return
    
    try {
      // ✅ Use deleteEntry for instant real-time updates (no manual reload needed)
      await deleteEntry(id)
      toast.success('Domain deleted successfully!')
    } catch (error) {
      console.error('Failed to delete domain:', error)
      toast.error('Failed to delete domain. Please try again.')
    }
  }

  const handleEdit = (domain: typeof domains[0]) => {
    setEditingId(domain.id)
    setEditFormData({
      domainName: domain.domainName,
      registrar: domain.registrar,
      registrationDate: domain.registrationDate,
      expiryDate: domain.expiryDate,
      autoRenew: domain.autoRenew,
      annualCost: domain.annualCost,
      status: domain.status,
      nameservers: domain.nameservers,
      notes: domain.notes
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    
    try {
      await updateEntry({
        id: editingId,
        title: editFormData.domainName,
        metadata: {
          itemType: 'domain',
          domainName: editFormData.domainName,
          registrar: editFormData.registrar,
          registrationDate: editFormData.registrationDate,
          expiryDate: editFormData.expiryDate,
          autoRenew: editFormData.autoRenew,
          annualCost: editFormData.annualCost,
          status: editFormData.status,
          nameservers: editFormData.nameservers,
          notes: editFormData.notes
        }
      })
      setEditingId(null)
      setEditFormData({})
      toast.success('Domain updated successfully!')
    } catch (error) {
      console.error('Failed to update domain:', error)
      toast.error('Failed to update domain. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'Expired': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'Pending Transfer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Domains & Websites</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Domain Name *</Label>
                <Input
                  placeholder="example.com"
                  value={formData.domainName || ''}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                />
              </div>
              <div>
                <Label>Registrar *</Label>
                <Input
                  placeholder="GoDaddy, Namecheap, Google Domains..."
                  value={formData.registrar || ''}
                  onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                />
              </div>
              <div>
                <Label>Registration Date</Label>
                <Input
                  type="date"
                  value={formData.registrationDate || ''}
                  onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate || ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Annual Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="12.99"
                  value={formData.annualCost || ''}
                  onChange={(e) => setFormData({ ...formData, annualCost: e.target.value })}
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
                  <option value="Expired">Expired</option>
                  <option value="Pending Transfer">Pending Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew || false}
                onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="autoRenew" className="cursor-pointer">Auto-Renew Enabled</Label>
            </div>

            <div>
              <Label>Nameservers</Label>
              <Textarea
                placeholder="ns1.example.com&#10;ns2.example.com"
                value={formData.nameservers || ''}
                onChange={(e) => setFormData({ ...formData, nameservers: e.target.value })}
                rows={3}
              />
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
              <Button onClick={handleAdd}>Add Domain</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading domains...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && domains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">No domains yet. Add your first domain!</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <div className="grid gap-4">
          {domains.map((domain) => (
            <Card key={domain.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{domain.domainName}</h3>
                          <a
                            href={`https://${domain.domainName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(domain.status)}`}>
                            {domain.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{domain.registrar}</p>
                        {domain.autoRenew && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                            Auto-Renew ON
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Registration</p>
                        <p className="font-medium">{domain.registrationDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">{domain.expiryDate || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Annual Cost</p>
                        <p className="font-medium">${domain.annualCost}</p>
                      </div>
                    </div>

                    {domain.nameservers && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold mb-2">Nameservers:</p>
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap font-mono">{domain.nameservers}</p>
                        </div>
                      </div>
                    )}

                    {domain.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{domain.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(domain)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(domain.id)}
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
            <DialogTitle>Edit Domain</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Domain Name</Label>
              <Input
                value={editFormData.domainName || ''}
                onChange={(e) => setEditFormData({ ...editFormData, domainName: e.target.value })}
                placeholder="example.com"
              />
            </div>
            <div>
              <Label>Registrar</Label>
              <Input
                value={editFormData.registrar || ''}
                onChange={(e) => setEditFormData({ ...editFormData, registrar: e.target.value })}
                placeholder="GoDaddy, Namecheap, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Registration Date</Label>
                <Input
                  type="date"
                  value={editFormData.registrationDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, registrationDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={editFormData.expiryDate || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Annual Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editFormData.annualCost || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, annualCost: e.target.value })}
                  placeholder="12.99"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editFormData.status || 'Active'}
                  onValueChange={(value) => setEditFormData({ ...editFormData, status: value as Domain['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Pending Transfer">Pending Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-auto-renew"
                checked={editFormData.autoRenew || false}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, autoRenew: checked as boolean })}
              />
              <Label htmlFor="edit-auto-renew" className="cursor-pointer">Auto-Renew</Label>
            </div>
            <div>
              <Label>Nameservers</Label>
              <Textarea
                value={editFormData.nameservers || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nameservers: e.target.value })}
                placeholder="ns1.example.com, ns2.example.com"
                rows={2}
              />
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

