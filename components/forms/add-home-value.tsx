'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Home, Loader2, TrendingUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { getHomeValueAI } from '@/lib/services/zillow-service'

interface AddHomeValueProps {
  open: boolean
  onClose: () => void
}

export function AddHomeValue({ open, onClose }: AddHomeValueProps) {
  const { addData } = useData()
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null)
  const [manualValue, setManualValue] = useState('')

  const handleGetEstimate = async () => {
    if (!address.trim()) return

    setIsLoading(true)
    try {
      const estimate = await getHomeValueAI(address)
      setEstimatedValue(estimate.estimatedValue)
      setManualValue(estimate.estimatedValue.toString())
    } catch (error) {
      console.error('Failed to get home value:', error)
      alert('Failed to get estimate. Please enter manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    const value = parseFloat(manualValue)
    if (!address.trim() || !value || value <= 0) return

    const homeData = {
      id: `home-${Date.now()}`,
      title: `Home: ${address}`,
      description: `Property at ${address}`,
      type: 'property',
      metadata: {
        address,
        value,
        estimatedValue: estimatedValue || value,
        type: 'real-estate',
        category: 'home',
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addData('home', homeData)

    // Reset
    setAddress('')
    setManualValue('')
    setEstimatedValue(null)
    onClose()
  }

  const handleClose = () => {
    setAddress('')
    setManualValue('')
    setEstimatedValue(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-blue-500" />
            Add Home Value
          </DialogTitle>
          <DialogDescription>
            Enter your address to get an AI estimate, or enter value manually.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Property Address *</Label>
            <Input
              id="address"
              placeholder="123 Main St, San Francisco, CA 94105"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <Button
            type="button"
            onClick={handleGetEstimate}
            disabled={isLoading || !address.trim()}
            className="w-full"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Estimate...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Get AI Estimate
              </>
            )}
          </Button>

          {estimatedValue && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-sm text-muted-foreground">AI Estimated Value</div>
              <div className="text-2xl font-bold text-blue-600">
                ${estimatedValue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on AI analysis of the address
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="value">Actual/Manual Value *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input
                id="value"
                type="number"
                placeholder="350000"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Adjust the AI estimate or enter your own value
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!address.trim() || !manualValue || parseFloat(manualValue) <= 0}
          >
            Save Home Value
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

























