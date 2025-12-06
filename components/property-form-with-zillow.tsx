'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Loader2, Home, DollarSign } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

interface PropertyFormProps {
  open: boolean
  onClose: () => void
}

export function PropertyFormWithZillow({ open, onClose }: PropertyFormProps) {
  const { addData } = useData()
  const [loading, setLoading] = useState(false)
  const [fetchingValue, setFetchingValue] = useState(false)
  
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Primary Residence',
    currentValue: '',
    purchasePrice: '',
    mortgageBalance: '',
    notes: ''
  })

  const handleFetchValue = async () => {
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: '⚠️ Complete Address Required',
        description: 'Please fill in street, city, state, and ZIP code',
        variant: 'destructive'
      })
      return
    }

    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim()
    
    setFetchingValue(true)
    console.log('🏠 Fetching property value for:', fullAddress)
    
    try {
      const response = await fetch('/api/zillow-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 API Response:', data)

      if (data.estimatedValue && data.estimatedValue > 0) {
        setFormData(prev => ({
          ...prev,
          currentValue: data.estimatedValue.toString()
        }))
        toast({
          title: '✅ Property Value Fetched!',
          description: `$${data.estimatedValue.toLocaleString()} from ${data.source || 'Zillow'}`,
        })
      } else {
        // Still set fallback value if provided
        if (data.estimatedValue) {
          setFormData(prev => ({
            ...prev,
            currentValue: data.estimatedValue.toString()
          }))
        }
        toast({
          title: '⚠️ Limited Data Available',
          description: data.marketTrends || 'Using estimate. You can adjust manually.',
        })
      }
    } catch (error: any) {
      console.error('❌ Zillow API error:', error)
      toast({
        title: '❌ API Error',
        description: error.message || 'Could not fetch value. Check console and enter manually.',
        variant: 'destructive'
      })
    } finally {
      setFetchingValue(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.street || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: 'Complete Address Required',
        description: 'Please fill in all address fields',
        variant: 'destructive'
      })
      return
    }

    const fullAddress = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim()

    setLoading(true)

    try {
      await addData('home', {
        title: fullAddress, // Use full address as title
        metadata: {
          itemType: 'Property',
          propertyAddress: fullAddress,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          propertyType: formData.propertyType,
          currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          mortgageBalance: formData.mortgageBalance ? parseFloat(formData.mortgageBalance) : undefined,
          notes: formData.notes
        }
      })

      toast({
        title: '✅ Property Added!',
        description: `${fullAddress} saved successfully!`,
      })

      // Reset form
      setFormData({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        propertyType: 'Primary Residence',
        currentValue: '',
        purchasePrice: '',
        mortgageBalance: '',
        notes: ''
      })

      onClose()
    } catch (error) {
      console.error('Error adding property:', error)
      toast({
        title: 'Error',
        description: 'Failed to add property. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" /> Add Property
          </DialogTitle>
          <DialogDescription>
            Add a property with auto-fetch value from Zillow
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Separate Address Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                placeholder="2103 Alexis Ct"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Tarpon Springs"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                    <SelectItem value="DC">District of Columbia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  placeholder="34689"
                  maxLength={5}
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Complete address required for Zillow API
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleFetchValue}
            disabled={fetchingValue || !formData.street || !formData.city || !formData.state || !formData.zipCode}
            className="w-full"
          >
            {fetchingValue ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching from RapidAPI...</>
            ) : (
              <><DollarSign className="mr-2 h-4 w-4" /> Fetch Property Value (RapidAPI/Zillow)</>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select
                value={formData.propertyType}
                onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary Residence">Primary Residence</SelectItem>
                  <SelectItem value="Rental Property">Rental Property</SelectItem>
                  <SelectItem value="Vacation Home">Vacation Home</SelectItem>
                  <SelectItem value="Investment">Investment</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value *</Label>
              <Input
                id="currentValue"
                type="number"
                placeholder="500000"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Auto-filled by API or enter manually
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (Optional)</Label>
              <Input
                id="purchasePrice"
                type="number"
                placeholder="450000"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageBalance">Mortgage Balance (Optional)</Label>
              <Input
                id="mortgageBalance"
                type="number"
                placeholder="300000"
                value={formData.mortgageBalance}
                onChange={(e) => setFormData({ ...formData, mortgageBalance: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Additional details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.street || !formData.city || !formData.state || !formData.zipCode || !formData.currentValue}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                'Add Property'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

