'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Wrench, TrendingUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'

interface ServiceHistoryTabProps {
  homeId: string
}

interface ServiceRecord {
  id: string
  serviceName: string
  provider: string
  date: string
  cost: number
  category: 'plumbing' | 'electrical' | 'hvac' | 'landscaping' | 'cleaning' | 'appliance' | 'other'
  notes?: string
}

export function ServiceHistoryTab({ homeId }: ServiceHistoryTabProps) {
  const { getData, addData, deleteData } = useData()
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    serviceName: '',
    provider: '',
    date: new Date().toISOString().split('T')[0],
    cost: '',
    category: 'other' as ServiceRecord['category'],
    notes: ''
  })

  useEffect(() => {
    loadRecords()
  }, [homeId, getData])

  useEffect(() => {
    const handleUpdate = () => loadRecords()
    window.addEventListener('data-updated', handleUpdate)
    window.addEventListener('home-data-updated', handleUpdate)
    return () => {
      window.removeEventListener('data-updated', handleUpdate)
      window.removeEventListener('home-data-updated', handleUpdate)
    }
  }, [homeId, getData])

  const loadRecords = () => {
    const homeData = getData('home') as any[]
    const serviceRecords = homeData.filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'service-history'
    ).map(item => ({
      id: item.id,
      serviceName: item.metadata?.serviceName || item.title || '',
      provider: item.metadata?.provider || '',
      date: item.metadata?.date || item.createdAt.split('T')[0],
      cost: Number(item.metadata?.cost) || 0,
      category: item.metadata?.category || 'other',
      notes: item.metadata?.notes || ''
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    setRecords(serviceRecords)
    console.log(`🔧 Loaded ${serviceRecords.length} service records for home ${homeId}`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    await addData('home', {
      title: formData.serviceName,
      description: `${formData.provider} - $${formData.cost}`,
      metadata: {
        itemType: 'service-history',
        homeId: homeId,
        serviceName: formData.serviceName,
        provider: formData.provider,
        date: formData.date,
        cost: parseFloat(formData.cost),
        category: formData.category,
        notes: formData.notes
      }
    })
    
    console.log('✅ Service record saved to database')
    setFormData({
      serviceName: '',
      provider: '',
      date: new Date().toISOString().split('T')[0],
      cost: '',
      category: 'other',
      notes: ''
    })
    setShowDialog(false)
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('home-data-updated'))
    }
    loadRecords()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service record?')) return
    
    setDeletingIds(prev => new Set(prev).add(id))
    setRecords(prev => prev.filter(r => r.id !== id))
    
    try {
      await deleteData('home', id)
      console.log('✅ Service record deleted successfully')
      // Reload to sync with database
      await loadRecords()
    } catch (e) {
      console.error('❌ Failed to delete service record:', e)
      loadRecords()
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const totalSpent = records.reduce((sum, record) => sum + record.cost, 0)

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      plumbing: '🚰',
      electrical: '⚡',
      hvac: '❄️',
      landscaping: '🌳',
      cleaning: '🧹',
      appliance: '🔧',
      other: '🏠'
    }
    return icons[category] || '🏠'
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Service Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Service Name *</Label>
                <Input
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                  placeholder="e.g., Kitchen Sink Repair, HVAC Service"
                  required
                />
              </div>
              <div>
                <Label>Provider *</Label>
                <Input
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="e.g., QuickFlow Plumbing"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cost *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ServiceRecord['category']) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="appliance">Appliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional details about the service..."
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Service Record
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Recent Service History
              </h3>
              <p className="text-muted-foreground text-sm">Track repairs and maintenance services</p>
            </div>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Services</p>
              <p className="text-3xl font-bold text-blue-600">{records.length}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-3xl font-bold text-green-600">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Service Records Table */}
        {records.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No service history yet</p>
          </Card>
        ) : (
          <Card className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-x-auto">
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 pb-3 border-b font-semibold text-sm">
                <span>Date</span>
                <span>Service</span>
                <span>Provider</span>
                <span>Cost</span>
                <span className="text-right">Actions</span>
              </div>
              
              {/* Records */}
              {records.map((record) => (
                <div 
                  key={record.id} 
                  className="grid grid-cols-5 gap-4 py-3 border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(record.category)}</span>
                    <span className="text-sm">
                      {new Date(record.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{record.serviceName}</p>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground truncate">{record.notes}</p>
                    )}
                  </div>
                  <span className="text-sm">{record.provider}</span>
                  <span className="font-semibold text-green-600">${record.cost.toFixed(2)}</span>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(record.id)}
                      disabled={deletingIds.has(record.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingIds.has(record.id) ? (
                        <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  )
}















