'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, Loader2, TrendingUp } from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { getCarValueAI, decodeVIN } from '@/lib/services/car-value-service'

interface AddCarValueProps {
  open: boolean
  onClose: () => void
}

export function AddCarValue({ open, onClose }: AddCarValueProps) {
  const { addData } = useData()
  const [vin, setVin] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [mileage, setMileage] = useState('')
  const [condition, setCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good')
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedValue, setEstimatedValue] = useState<number | null>(null)
  const [manualValue, setManualValue] = useState('')

  const handleDecodeVIN = async () => {
    if (vin.length !== 17) {
      alert('VIN must be 17 characters')
      return
    }

    setIsLoading(true)
    try {
      const details = await decodeVIN(vin)
      if (details.year) setYear(details.year)
      if (details.make) setMake(details.make)
      if (details.model) setModel(details.model)
    } catch (error) {
      console.error('Failed to decode VIN:', error)
      alert('Failed to decode VIN. Please enter manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetEstimate = async () => {
    if (!year || !make || !model || !mileage) {
      alert('Please fill in all vehicle details')
      return
    }

    setIsLoading(true)
    try {
      const estimate = await getCarValueAI({
        year,
        make,
        model,
        mileage,
        condition
      })
      setEstimatedValue(estimate.estimatedValue)
      setManualValue(estimate.estimatedValue.toString())
    } catch (error) {
      console.error('Failed to get car value:', error)
      alert('Failed to get estimate. Please enter manually.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = () => {
    const value = parseFloat(manualValue)
    if (!year || !make || !model || !value || value <= 0) return

    const carData = {
      id: `vehicle-${Date.now()}`,
      title: `${year} ${make} ${model}`,
      description: `Vehicle: ${year} ${make} ${model} - ${mileage} miles`,
      type: 'vehicle',
      metadata: {
        year,
        make,
        model,
        mileage: parseInt(mileage.replace(/[^0-9]/g, '')) || 0,
        condition,
        value,
        estimatedValue: estimatedValue || value,
        vin: vin || undefined,
        type: 'vehicle',
        category: 'auto',
        lastUpdated: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addData('vehicles', carData)

    // Reset
    setVin('')
    setYear('')
    setMake('')
    setModel('')
    setMileage('')
    setCondition('good')
    setManualValue('')
    setEstimatedValue(null)
    onClose()
  }

  const handleClose = () => {
    setVin('')
    setYear('')
    setMake('')
    setModel('')
    setMileage('')
    setCondition('good')
    setManualValue('')
    setEstimatedValue(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-cyan-500" />
            Add Vehicle Value
          </DialogTitle>
          <DialogDescription>
            Decode VIN or enter details manually to get AI value estimate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* VIN Section */}
          <div className="space-y-2">
            <Label htmlFor="vin">VIN (Optional - Auto-fill details)</Label>
            <div className="flex gap-2">
              <Input
                id="vin"
                placeholder="1HGBH41JXMN109186"
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                maxLength={17}
              />
              <Button
                type="button"
                onClick={handleDecodeVIN}
                disabled={isLoading || vin.length !== 17}
                variant="outline"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decode'}
              </Button>
            </div>
          </div>

          {/* Manual Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                placeholder="2020"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mileage">Mileage *</Label>
              <Input
                id="mileage"
                placeholder="45000"
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="make">Make *</Label>
            <Input
              id="make"
              placeholder="Toyota"
              value={make}
              onChange={(e) => setMake(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              placeholder="Camry"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={(v: any) => setCondition(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            onClick={handleGetEstimate}
            disabled={isLoading || !year || !make || !model || !mileage}
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
            <div className="p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
              <div className="text-sm text-muted-foreground">AI Estimated Value</div>
              <div className="text-2xl font-bold text-cyan-600">
                ${estimatedValue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on year, make, model, mileage, and condition
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
                placeholder="25000"
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
            disabled={!year || !make || !model || !manualValue || parseFloat(manualValue) <= 0}
          >
            Save Vehicle Value
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

























