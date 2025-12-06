'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, HardDrive, Cloud, Database, Loader2 } from 'lucide-react'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { toast } from 'sonner'

interface DigitalAsset {
  id: string
  assetName: string
  type: 'Cloud Storage' | 'Backup' | 'Media Library' | 'Database' | 'Repository' | 'Other'
  provider: string
  storageSize: string
  location: string
  lastBackup?: string
  cost?: string
  notes?: string
}

export function AssetsTab() {
  // ✅ Use modern hook for real-time updates
  const { entries, isLoading, createEntry, deleteEntry } = useDomainEntries('digital')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState<Partial<DigitalAsset>>({
    type: 'Cloud Storage'
  })

  // ✅ Filter assets in real-time from entries
  const assets = entries
    .filter(i => i.metadata?.itemType === 'asset')
    .map(i => {
      const meta = i.metadata as Record<string, any>
      return {
        id: i.id,
        assetName: String(i.title || meta?.assetName || ''),
        type: (meta?.type || 'Cloud Storage') as 'Cloud Storage' | 'Backup' | 'Media Library' | 'Database' | 'Repository' | 'Other',
        provider: String(meta?.provider || ''),
        storageSize: String(meta?.storageSize || ''),
        location: String(meta?.location || ''),
        lastBackup: meta?.lastBackup ? String(meta.lastBackup) : undefined,
        cost: meta?.cost ? String(meta.cost) : undefined,
        notes: meta?.notes ? String(meta.notes) : undefined
      }
    })

  const handleAdd = async () => {
    if (!formData.assetName || !formData.provider) {
      toast.error('Please enter asset name and provider')
      return
    }

    const assetData = {
      itemType: 'asset',
      assetName: formData.assetName,
      type: formData.type || 'Cloud Storage',
      provider: formData.provider,
      storageSize: formData.storageSize || '',
      location: formData.location || '',
      lastBackup: formData.lastBackup,
      cost: formData.cost, // ✅ One-time cost, not monthly
      notes: formData.notes
    }

    try {
      // ✅ Use createEntry for instant real-time updates
      await createEntry({
        domain: 'digital',
        title: assetData.assetName,
        description: `${assetData.type} - ${assetData.provider}`,
        metadata: assetData
      })
      
      setFormData({ type: 'Cloud Storage' })
      setShowAddForm(false)
      toast.success('Digital asset added successfully!')
    } catch (error) {
      console.error('Failed to add asset:', error)
      toast.error('Failed to add asset. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    
    try {
      // ✅ Use deleteEntry for instant real-time updates (no manual reload needed)
      await deleteEntry(id)
      toast.success('Asset deleted successfully!')
    } catch (error) {
      console.error('Failed to delete asset:', error)
      toast.error('Failed to delete asset. Please try again.')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Cloud Storage': return <Cloud className="w-5 h-5" />
      case 'Database': return <Database className="w-5 h-5" />
      case 'Backup': return <HardDrive className="w-5 h-5" />
      default: return <HardDrive className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Digital Assets</h2>
        <Button onClick={() => setShowAddForm(!showAddForm)} disabled={isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading digital assets...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Digital Asset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Asset Name *</Label>
                <Input
                  placeholder="Family Photos Backup, Project Files..."
                  value={formData.assetName || ''}
                  onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <select
                  className="w-full border rounded-md p-2 bg-background"
                  value={formData.type || 'Cloud Storage'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="Cloud Storage">Cloud Storage</option>
                  <option value="Backup">Backup</option>
                  <option value="Media Library">Media Library</option>
                  <option value="Database">Database</option>
                  <option value="Repository">Repository</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label>Provider *</Label>
                <Input
                  placeholder="Google Drive, AWS S3, Dropbox..."
                  value={formData.provider || ''}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                />
              </div>
              <div>
                <Label>Storage Size</Label>
                <Input
                  placeholder="500 GB, 2 TB, 100 MB..."
                  value={formData.storageSize || ''}
                  onChange={(e) => setFormData({ ...formData, storageSize: e.target.value })}
                />
              </div>
              <div>
                <Label>Location/Path</Label>
                <Input
                  placeholder="/backups/photos, bucket-name..."
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Last Backup</Label>
                <Input
                  type="date"
                  value={formData.lastBackup || ''}
                  onChange={(e) => setFormData({ ...formData, lastBackup: e.target.value })}
                />
              </div>
              <div>
                <Label>One-Time Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="99.99"
                  value={formData.cost || ''}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Access details, important information..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAdd}>Add Asset</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && assets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HardDrive className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">No digital assets yet. Add your first asset!</p>
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <div className="grid gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{asset.assetName}</h3>
                        <p className="text-sm text-muted-foreground">{asset.type} • {asset.provider}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
                      {asset.storageSize && (
                        <div>
                          <p className="text-muted-foreground">Storage Size</p>
                          <p className="font-medium">{asset.storageSize}</p>
                        </div>
                      )}
                      {asset.location && (
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium font-mono text-xs">{asset.location}</p>
                        </div>
                      )}
                      {asset.lastBackup && (
                        <div>
                          <p className="text-muted-foreground">Last Backup</p>
                          <p className="font-medium">{asset.lastBackup}</p>
                        </div>
                      )}
                      {asset.cost && (
                        <div>
                          <p className="text-muted-foreground">Cost</p>
                          <p className="font-medium text-green-600">${asset.cost}</p>
                        </div>
                      )}
                    </div>

                    {asset.notes && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(asset.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  )
}

