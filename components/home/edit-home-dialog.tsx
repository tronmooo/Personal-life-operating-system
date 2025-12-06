'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles } from 'lucide-react'

interface EditHomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  home: any
  onEdit: (home: any) => void
}

export function EditHomeDialog({ open, onOpenChange, home, onEdit }: EditHomeDialogProps) {
  // Parse address back into components
  const parseAddress = (fullAddress: string) => {
    const parts = fullAddress.split(',').map(p => p.trim())
    if (parts.length >= 3) {
      const stateZip = parts[2].split(' ')
      return {
        address: parts[0],
        city: parts[1],
        state: stateZip[0] || '',
        zipCode: stateZip[1] || ''
      }
    }
    return { address: fullAddress, city: '', state: '', zipCode: '' }
  }

  const parsedAddress = parseAddress(home.address)

  const [formData, setFormData] = useState({
    name: home.name,
    address: parsedAddress.address,
    city: parsedAddress.city,
    state: parsedAddress.state,
    zipCode: parsedAddress.zipCode,
    type: home.type,
    purchaseDate: home.purchaseDate,
    propertyValue: home.propertyValue.toString()
  })
  const [extracting, setExtracting] = useState(false)

  const handleAIExtract = async () => {
    if (!formData.address || !formData.city || !formData.state) {
      alert('Please fill in the address, city, and state first')
      return
    }

    setExtracting(true)
    
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`
    
    try {
      const response = await fetch('/api/zillow-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Zillow API Response:', data)
        
        const propertyValue = data.estimatedValue || data.value || data.price || data.zestimate
        
        if (propertyValue) {
          setFormData({ ...formData, propertyValue: propertyValue.toString() })
          alert(`✅ Property value found: $${propertyValue.toLocaleString()}`)
        } else {
          alert('⚠️ Could not find property value. Keeping current value.')
        }
      } else {
        const errorData = await response.json()
        console.error('Zillow API error:', errorData)
        alert('⚠️ Zillow API error. Keeping current value.')
      }
    } catch (error) {
      console.error('Error fetching property value:', error)
      alert('⚠️ Error connecting to Zillow API. Keeping current value.')
    } finally {
      setExtracting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`
    
    const updatedHome = {
      ...home,
      name: formData.name,
      address: fullAddress,
      type: formData.type,
      purchaseDate: formData.purchaseDate,
      propertyValue: parseFloat(formData.propertyValue) || 0,
    }
    
    onEdit(updatedHome)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Home</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Home Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Home Name"
              required
            />
          </div>

          <div>
            <Label>Street Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main Street"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                required
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
                required
              />
            </div>
          </div>

          <div>
            <Label>Zip Code</Label>
            <Input
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              placeholder="12345"
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single Family">Single Family</SelectItem>
                <SelectItem value="Condo">Condo</SelectItem>
                <SelectItem value="Townhouse">Townhouse</SelectItem>
                <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Purchase Date</Label>
            <Input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Property Value</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={formData.propertyValue}
                onChange={(e) => setFormData({ ...formData, propertyValue: e.target.value })}
                placeholder="Property Value"
                required
              />
              <Button 
                type="button" 
                onClick={handleAIExtract}
                disabled={extracting || !formData.address || !formData.city || !formData.state}
                variant="outline"
                className="shrink-0 whitespace-nowrap"
              >
                {extracting ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Looking up...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Lookup
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI will look up property value using Zillow API
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Update Home
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

