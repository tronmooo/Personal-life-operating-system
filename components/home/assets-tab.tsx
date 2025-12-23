'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Package } from 'lucide-react'
import { useDomainEntries } from '@/lib/hooks/use-domain-entries'
import { toast } from 'sonner'

interface AssetsTabProps {
  homeId: string
}

interface Asset {
  id: string
  name: string
  room: string
  category: string
  purchaseDate: string
  value: number
  warrantyExpiry?: string
  imageUrl?: string
  brand?: string
}

export function AssetsTab({ homeId }: AssetsTabProps) {
  const { entries, createEntry, deleteEntry: removeEntry } = useDomainEntries('home')
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    room: '',
    category: '',
    purchaseDate: '',
    value: '',
    warrantyExpiry: '',
    brand: ''
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [estimating, setEstimating] = useState(false)

  // ✅ Filter assets from useDomainEntries hook
  const assets = entries
    .filter(item => 
      item.metadata?.homeId === homeId && 
      item.metadata?.itemType === 'asset'
    )
    .map(item => {
      const meta = item.metadata || {}
      return {
        id: item.id,
        name: (typeof meta.name === 'string' ? meta.name : undefined) || item.title || '',
        room: (typeof meta.room === 'string' ? meta.room : '') || '',
        category: (typeof meta.category === 'string' ? meta.category : '') || '',
        purchaseDate: (typeof meta.purchaseDate === 'string' ? meta.purchaseDate : '') || '',
        value: Number(meta.value) || 0,
        warrantyExpiry: typeof meta.warrantyExpiry === 'string' ? meta.warrantyExpiry : undefined,
        imageUrl: typeof meta.imageUrl === 'string' ? meta.imageUrl : undefined,
        brand: typeof meta.brand === 'string' ? meta.brand : undefined
      } as Asset
    })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    let imageUrl: string | undefined

    // Upload photo to Supabase via generic document saver if provided
    if (photoFile) {
      try {
        const body = new FormData()
        body.append('file', photoFile)
        body.append('path', `home-assets/${Date.now()}-${photoFile.name}`)
        const res = await fetch('/api/upload', { method: 'POST', body })
        const json = await res.json().catch(() => null)
        if (json?.url) imageUrl = json.url
      } catch (error) {
        console.error('Failed to upload asset photo:', error)
        toast.error('Failed to upload photo, but will save asset anyway')
      }
    }

    try {
      // ✅ Save to Supabase via useDomainEntries hook
      await createEntry({
        domain: 'home',
        title: formData.name,
        description: `${formData.room} - ${formData.category} - $${formData.value}`,
        metadata: {
          itemType: 'asset',
          homeId: homeId,
          name: formData.name,
          room: formData.room,
          category: formData.category,
          purchaseDate: formData.purchaseDate,
          value: parseFloat(formData.value),
          warrantyExpiry: formData.warrantyExpiry,
          brand: formData.brand,
          imageUrl: imageUrl,
        }
      })

      toast.success(`Asset "${formData.name}" added successfully!`)
      setFormData({ name: '', room: '', category: '', purchaseDate: '', value: '', warrantyExpiry: '', brand: '' })
      setPhotoFile(null)
      setPhotoPreview(null)
      setShowDialog(false)
    } catch (error) {
      console.error('Failed to add asset:', error)
      toast.error('Failed to add asset. Please try again.')
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
  }

  const estimateValue = async () => {
    if (!formData.name) return
    setEstimating(true)
    try {
      const res = await fetch('/api/estimate/asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          purchaseDate: formData.purchaseDate || undefined,
        }),
      })
      const json = await res.json()
      if (json?.estimatedValue) {
        setFormData(prev => ({ ...prev, value: String(Math.round(json.estimatedValue)) }))
      }
    } catch (e) {
      // ignore
    } finally {
      setEstimating(false)
    }
  }

  const handleDelete = async (id: string) => {
    const asset = assets.find(a => a.id === id)
    if (!asset) return
    
    if (!confirm(`Delete "${asset.name}"? This action cannot be undone.`)) return
    
    // Optimistic UI update
    setDeletingIds(prev => new Set(prev).add(id))
    
    try {
      // ✅ Delete from Supabase via useDomainEntries hook
      await removeEntry(id)
      toast.success(`Asset "${asset.name}" deleted successfully!`)
    } catch (e) {
      console.error('❌ Failed to delete asset:', e)
      toast.error('Failed to delete asset. Please try again.')
      // Remove from deleting state on error
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  // Group assets by room
  const assetsByRoom: Record<string, Asset[]> = assets.reduce((acc: Record<string, Asset[]>, asset) => {
    const room = asset.room || 'Unassigned'
    if (!acc[room]) acc[room] = []
    acc[room].push(asset)
    return acc
  }, {})

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Asset Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sofa, Smart TV"
                  required
                />
              </div>
              <div>
                <Label>Room *</Label>
                <Input
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., Living Room, Kitchen"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Furniture, Appliance"
                  required
                />
              </div>
              <div>
                <Label>Brand</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Samsung, LG"
                />
              </div>
            </div>
            
            <div>
              <Label>Photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={handlePhotoChange} />
              {photoPreview && (
                <div className="mt-2">
                  <img src={photoPreview} alt="preview" className="h-24 w-24 object-cover rounded" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Warranty Expiry</Label>
                <Input
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>Value *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="0.00"
                required
              />
              <div className="mt-2 text-right">
                <button type="button" className="text-sm underline text-purple-600 hover:text-purple-700" onClick={estimateValue} disabled={estimating}>
                  {estimating ? 'Estimating…' : 'Estimate with AI'}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Summary Card */}
        <Card className="p-4 sm:p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 sm:h-6 sm:w-6" />
                Room-by-Room Inventory
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Track all your home contents and warranties</p>
            </div>
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4">
            <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">Total Assets Value</p>
              <p className="text-xl sm:text-3xl font-bold text-blue-600">${totalAssetValue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Home contents</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground">Warranties Active</p>
              <p className="text-xl sm:text-3xl font-bold text-green-600">
                {assets.filter(a => a.warrantyExpiry && typeof a.warrantyExpiry === 'string' && new Date(a.warrantyExpiry) > new Date()).length}
              </p>
              <p className="text-xs text-muted-foreground mt-1 hidden sm:block">Covered items</p>
            </div>
          </div>
        </Card>

        {/* Assets by Room */}
        {assets.length === 0 ? (
          <Card className="p-12 text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assets yet</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(assetsByRoom).map(([room, roomAssets]) => (
              <Card key={room} className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  🏠 {room}
                </h4>
                
                <div className="space-y-3">
                  {roomAssets.map((asset) => {
                    const warrantyActive = asset.warrantyExpiry && new Date(asset.warrantyExpiry) > new Date()
                    
                    return (
                      <div 
                        key={asset.id} 
                        className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-2">
                              <h5 className="font-semibold text-base sm:text-lg truncate">{asset.name}</h5>
                              {warrantyActive && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded w-fit">
                                  Warranty: {new Date(asset.warrantyExpiry!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <p className="text-muted-foreground">Category</p>
                                <p className="font-medium truncate">{asset.category}</p>
                              </div>
                              {asset.brand && (
                                <div>
                                  <p className="text-muted-foreground">Brand</p>
                                  <p className="font-medium truncate">{asset.brand}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-muted-foreground">Value</p>
                                <p className="font-bold text-purple-600">${asset.value.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Purchased</p>
                                <p className="font-medium">{new Date(asset.purchaseDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(asset.id)}
                            disabled={deletingIds.has(asset.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                          >
                            {deletingIds.has(asset.id) ? (
                              <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

