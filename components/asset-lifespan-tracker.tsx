'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Wrench, Clock, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Zap } from 'lucide-react'
import { format, differenceInDays, differenceInMonths, addMonths, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

// Asset categories with typical lifespans (in months)
const ASSET_CATEGORIES = {
  'HVAC System': { lifespan: 180, maintenanceInterval: 6, replacementCost: 5000 },
  'Water Heater': { lifespan: 120, maintenanceInterval: 12, replacementCost: 1200 },
  'Roof': { lifespan: 240, maintenanceInterval: 12, replacementCost: 15000 },
  'Refrigerator': { lifespan: 156, maintenanceInterval: 6, replacementCost: 1500 },
  'Dishwasher': { lifespan: 108, maintenanceInterval: 12, replacementCost: 800 },
  'Washing Machine': { lifespan: 120, maintenanceInterval: 6, replacementCost: 900 },
  'Dryer': { lifespan: 156, maintenanceInterval: 6, replacementCost: 700 },
  'Furnace': { lifespan: 180, maintenanceInterval: 6, replacementCost: 4000 },
  'Air Conditioner': { lifespan: 180, maintenanceInterval: 6, replacementCost: 3500 },
  'Microwave': { lifespan: 108, maintenanceInterval: 12, replacementCost: 300 },
  'Oven/Range': { lifespan: 180, maintenanceInterval: 12, replacementCost: 1200 },
  'Garbage Disposal': { lifespan: 120, maintenanceInterval: 12, replacementCost: 250 },
  'Sump Pump': { lifespan: 84, maintenanceInterval: 6, replacementCost: 500 },
  'Car': { lifespan: 144, maintenanceInterval: 3, replacementCost: 30000 },
  'Laptop': { lifespan: 48, maintenanceInterval: 12, replacementCost: 1500 },
  'Smartphone': { lifespan: 36, maintenanceInterval: 12, replacementCost: 1000 },
  'Water Filter': { lifespan: 6, maintenanceInterval: 6, replacementCost: 50 },
  'HVAC Filter': { lifespan: 3, maintenanceInterval: 3, replacementCost: 20 },
  'Battery Backup': { lifespan: 36, maintenanceInterval: 12, replacementCost: 150 },
  'Custom': { lifespan: 120, maintenanceInterval: 12, replacementCost: 0 }
}

interface AssetLifespanTrackerProps {
  open: boolean
  onClose: () => void
  onSave: (asset: any) => void
  editingAsset?: any
}

export function AssetLifespanTracker({ open, onClose, onSave, editingAsset }: AssetLifespanTrackerProps) {
  const [assetName, setAssetName] = useState('')
  const [category, setCategory] = useState<keyof typeof ASSET_CATEGORIES>('Custom')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [expectedLifespan, setExpectedLifespan] = useState(120) // months
  const [maintenanceInterval, setMaintenanceInterval] = useState(12) // months
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('')
  const [notes, setNotes] = useState('')
  const [warrantyExpiration, setWarrantyExpiration] = useState('')

  useEffect(() => {
    if (editingAsset) {
      setAssetName(editingAsset.name || '')
      setCategory(editingAsset.category || 'Custom')
      setPurchaseDate(editingAsset.purchaseDate || '')
      setPurchasePrice(editingAsset.purchasePrice || '')
      setExpectedLifespan(editingAsset.expectedLifespan || 120)
      setMaintenanceInterval(editingAsset.maintenanceInterval || 12)
      setLastMaintenanceDate(editingAsset.lastMaintenanceDate || '')
      setNotes(editingAsset.notes || '')
      setWarrantyExpiration(editingAsset.warrantyExpiration || '')
    } else {
      // Reset form
      setAssetName('')
      setCategory('Custom')
      setPurchaseDate('')
      setPurchasePrice('')
      setExpectedLifespan(120)
      setMaintenanceInterval(12)
      setLastMaintenanceDate('')
      setNotes('')
      setWarrantyExpiration('')
    }
  }, [editingAsset, open])

  const handleCategoryChange = (newCategory: keyof typeof ASSET_CATEGORIES) => {
    setCategory(newCategory)
    const categoryData = ASSET_CATEGORIES[newCategory]
    setExpectedLifespan(categoryData.lifespan)
    setMaintenanceInterval(categoryData.maintenanceInterval)
  }

  const calculateMetrics = () => {
    if (!purchaseDate) return null

    const purchase = parseISO(purchaseDate)
    const now = new Date()
    const ageInMonths = differenceInMonths(now, purchase)
    const ageInDays = differenceInDays(now, purchase)
    const lifespanProgress = (ageInMonths / expectedLifespan) * 100
    const endOfLifeDate = addMonths(purchase, expectedLifespan)
    const monthsRemaining = expectedLifespan - ageInMonths
    const daysUntilReplacement = differenceInDays(endOfLifeDate, now)

    // Calculate optimal replacement window (80-95% of lifespan)
    const optimalStartDate = addMonths(purchase, Math.floor(expectedLifespan * 0.8))
    const optimalEndDate = addMonths(purchase, Math.floor(expectedLifespan * 0.95))
    const daysUntilOptimalStart = differenceInDays(optimalStartDate, now)
    const inOptimalWindow = daysUntilOptimalStart <= 0 && daysUntilReplacement > 0

    // Next maintenance due
    const lastMaintenance = lastMaintenanceDate ? parseISO(lastMaintenanceDate) : purchase
    const nextMaintenanceDate = addMonths(lastMaintenance, maintenanceInterval)
    const daysUntilMaintenance = differenceInDays(nextMaintenanceDate, now)
    const maintenanceOverdue = daysUntilMaintenance < 0

    // Replacement urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (lifespanProgress >= 95) urgency = 'critical'
    else if (lifespanProgress >= 80) urgency = 'high'
    else if (lifespanProgress >= 60) urgency = 'medium'

    return {
      ageInMonths,
      ageInDays,
      lifespanProgress: Math.min(lifespanProgress, 100),
      endOfLifeDate,
      monthsRemaining: Math.max(monthsRemaining, 0),
      daysUntilReplacement,
      optimalStartDate,
      optimalEndDate,
      daysUntilOptimalStart,
      inOptimalWindow,
      nextMaintenanceDate,
      daysUntilMaintenance,
      maintenanceOverdue,
      urgency
    }
  }

  const metrics = calculateMetrics()

  const handleSave = () => {
    const asset = {
      id: editingAsset?.id || Date.now().toString(),
      name: assetName,
      category,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice) || 0,
      expectedLifespan,
      maintenanceInterval,
      lastMaintenanceDate: lastMaintenanceDate || purchaseDate,
      notes,
      warrantyExpiration,
      ...metrics,
      createdAt: editingAsset?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSave(asset)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wrench className="h-6 w-6 text-blue-600" />
            {editingAsset ? 'Edit' : 'Track'} Asset Lifespan & Maintenance
          </DialogTitle>
          <DialogDescription>
            Smart tracking prevents early replacement (waste money) and late replacement (emergency costs)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">Asset Name *</Label>
              <Input
                id="asset-name"
                placeholder="e.g., Kitchen Refrigerator"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ASSET_CATEGORIES).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Purchase Date *</Label>
              <Input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase-price">Purchase Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="purchase-price"
                  type="number"
                  placeholder="0.00"
                  className="pl-10"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Lifespan Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expected-lifespan">Expected Lifespan (months)</Label>
              <Input
                id="expected-lifespan"
                type="number"
                min="1"
                value={expectedLifespan}
                onChange={(e) => setExpectedLifespan(parseInt(e.target.value) || 120)}
              />
              <p className="text-xs text-muted-foreground">
                {Math.floor(expectedLifespan / 12)} years {expectedLifespan % 12} months
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-interval">Maintenance Every (months)</Label>
              <Input
                id="maintenance-interval"
                type="number"
                min="1"
                value={maintenanceInterval}
                onChange={(e) => setMaintenanceInterval(parseInt(e.target.value) || 12)}
              />
            </div>
          </div>

          {/* Maintenance & Warranty */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="last-maintenance">Last Maintenance Date</Label>
              <Input
                id="last-maintenance"
                type="date"
                value={lastMaintenanceDate}
                onChange={(e) => setLastMaintenanceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty-expiration">Warranty Expiration</Label>
              <Input
                id="warranty-expiration"
                type="date"
                value={warrantyExpiration}
                onChange={(e) => setWarrantyExpiration(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Specifications</Label>
            <Textarea
              id="notes"
              placeholder="Model number, serial number, important details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Metrics Display (if purchase date is set) */}
          {metrics && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Asset Health & Predictions</h4>
                <Badge variant={
                  metrics.urgency === 'critical' ? 'destructive' :
                  metrics.urgency === 'high' ? 'default' :
                  metrics.urgency === 'medium' ? 'secondary' : 'outline'
                }>
                  {metrics.urgency.toUpperCase()}
                </Badge>
              </div>

              {/* Lifespan Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lifespan Used</span>
                  <span className="font-semibold">{metrics.lifespanProgress.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.lifespanProgress} className={cn(
                  "h-3",
                  metrics.lifespanProgress >= 95 ? "bg-red-200" :
                  metrics.lifespanProgress >= 80 ? "bg-orange-200" : "bg-blue-200"
                )} />
                <p className="text-xs text-muted-foreground">
                  Age: {Math.floor(metrics.ageInMonths / 12)}y {metrics.ageInMonths % 12}m • 
                  Remaining: {Math.floor(metrics.monthsRemaining / 12)}y {metrics.monthsRemaining % 12}m
                </p>
              </div>

              {/* Optimal Replacement Window */}
              {metrics.inOptimalWindow && (
                <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="ml-2">
                    <p className="font-semibold text-sm">⚡ Optimal Replacement Window!</p>
                    <p className="text-xs mt-1">
                      This is the best time to replace this asset. Not too early (waste money) or too late (emergency).
                      Window ends: {format(metrics.optimalEndDate, 'MMM dd, yyyy')}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Next Maintenance */}
              <div className={cn(
                "p-3 rounded-lg",
                metrics.maintenanceOverdue 
                  ? "bg-red-100 dark:bg-red-950/20 border border-red-300"
                  : "bg-blue-100 dark:bg-blue-950/20 border border-blue-300"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className={cn(
                      "h-4 w-4",
                      metrics.maintenanceOverdue ? "text-red-600" : "text-blue-600"
                    )} />
                    <span className="text-sm font-semibold">
                      {metrics.maintenanceOverdue ? 'Maintenance OVERDUE' : 'Next Maintenance'}
                    </span>
                  </div>
                  <span className="text-xs font-medium">
                    {format(metrics.nextMaintenanceDate, 'MMM dd, yyyy')}
                  </span>
                </div>
                <p className="text-xs mt-1 text-muted-foreground">
                  {metrics.maintenanceOverdue 
                    ? `Overdue by ${Math.abs(metrics.daysUntilMaintenance)} days`
                    : `Due in ${metrics.daysUntilMaintenance} days`
                  }
                </p>
              </div>

              {/* End of Life Prediction */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">End of Life</p>
                    <p className="font-semibold">{format(metrics.endOfLifeDate, 'MMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Replacement Cost</p>
                    <p className="font-semibold">${ASSET_CATEGORIES[category].replacementCost.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!assetName || !purchaseDate}>
            <Zap className="h-4 w-4 mr-2" />
            {editingAsset ? 'Update' : 'Start Tracking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook to get all tracked assets from Supabase
export function useTrackedAssets() {
  const [assets, setAssets] = useState<any[]>([])

  useEffect(() => {
    const loadAssets = async () => {
      const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
      const supabase = createClientComponentClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Try loading from IndexedDB for unauthenticated users
        const { idbGet } = await import('@/lib/utils/idb-cache')
        const stored = await idbGet<any[]>('trackedAssets') || []
        setAssets(stored)
        return
      }

      // Load from Supabase
      const { data, error } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('domain', 'tracked_assets')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading tracked assets:', error)
        return
      }

      // Transform Supabase data to expected format
      const transformedAssets = data.map((entry: any) => ({
        id: entry.id,
        name: entry.title,
        category: entry.metadata?.category,
        purchaseDate: entry.metadata?.purchaseDate,
        purchasePrice: entry.metadata?.purchasePrice,
        expectedLifespan: entry.metadata?.expectedLifespan,
        maintenanceInterval: entry.metadata?.maintenanceInterval,
        lastMaintenanceDate: entry.metadata?.lastMaintenanceDate,
        notes: entry.description,
        warrantyExpiration: entry.metadata?.warrantyExpiration,
        ...entry.metadata, // Include all metrics
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }))

      setAssets(transformedAssets)
    }

    loadAssets()
    
    const handleUpdate = () => loadAssets()
    window.addEventListener('tracked-assets-updated', handleUpdate)
    
    return () => {
      window.removeEventListener('tracked-assets-updated', handleUpdate)
    }
  }, [])

  return assets
}

// Save asset to Supabase
export async function saveTrackedAsset(asset: any) {
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createClientComponentClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Fallback to IndexedDB for unauthenticated users
    const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
    const stored = await idbGet<any[]>('trackedAssets')
    const assets = stored || []
    const existingIndex = assets.findIndex((a: any) => a.id === asset.id)
    
    if (existingIndex >= 0) {
      assets[existingIndex] = asset
    } else {
      assets.push(asset)
    }
    
    await idbSet('trackedAssets', assets)
    window.dispatchEvent(new Event('tracked-assets-updated'))
    return
  }

  // Prepare metadata
  const metadata = {
    category: asset.category,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice,
    expectedLifespan: asset.expectedLifespan,
    maintenanceInterval: asset.maintenanceInterval,
    lastMaintenanceDate: asset.lastMaintenanceDate,
    warrantyExpiration: asset.warrantyExpiration,
    currentAge: asset.currentAge,
    remainingLife: asset.remainingLife,
    replacementDate: asset.replacementDate,
    healthPercentage: asset.healthPercentage,
    nextMaintenanceDue: asset.nextMaintenanceDue,
    monthlyDepreciation: asset.monthlyDepreciation,
    currentValue: asset.currentValue,
  }

  if (asset.id && typeof asset.id === 'string' && !asset.id.startsWith('temp-')) {
    // Update existing entry
    const { error } = await supabase
      .from('domain_entries')
      .update({
        title: asset.name,
        description: asset.notes,
        metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', asset.id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error updating tracked asset:', error)
      throw error
    }
  } else {
    // Insert new entry
    const { error } = await supabase
      .from('domain_entries')
      .insert({
        user_id: user.id,
        domain: 'tracked_assets',
        title: asset.name,
        description: asset.notes,
        metadata
      })

    if (error) {
      console.error('Error creating tracked asset:', error)
      throw error
    }
  }

  window.dispatchEvent(new Event('tracked-assets-updated'))
}

// Delete asset from Supabase
export async function deleteTrackedAsset(assetId: string) {
  const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs')
  const supabase = createClientComponentClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    // Fallback to IndexedDB for unauthenticated users
    const { idbGet, idbSet } = await import('@/lib/utils/idb-cache')
    const stored = await idbGet<any[]>('trackedAssets')
    const assets = stored || []
    const filtered = assets.filter((a: any) => a.id !== assetId)
    await idbSet('trackedAssets', filtered)
    window.dispatchEvent(new Event('tracked-assets-updated'))
    return
  }

  const { error } = await supabase
    .from('domain_entries')
    .delete()
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting tracked asset:', error)
    throw error
  }

  window.dispatchEvent(new Event('tracked-assets-updated'))
}

